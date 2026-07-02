import os
import time
import threading
import difflib
import requests
import libtorrent as lt

from django.http import StreamingHttpResponse, Http404
from rest_framework.decorators import api_view
from rest_framework.response import Response
import re

ACTIVE_DOWNLOADS = {}
DOWNLOAD_DIR = "./movies_cache"

os.makedirs(DOWNLOAD_DIR, exist_ok=True)


# ==========================================
# 1. SEARCH MOVIES VIEW (Kept unchanged)
# ==========================================
@api_view(["GET"])
def search_movies(request):
    movie_title = request.query_params.get("title", "").strip()
    if not movie_title:
        return Response({"error": "Provide a title parameter"}, status=400)

    search_url = "https://archive.org/advancedsearch.php"
    params = {
        "q": f"{movie_title} AND mediatype:(movies)",
        "fl[]": ["identifier", "title", "description", "year"],
        "sort[]": "downloads desc",
        "output": "json",
        "rows": 12,
    }

    try:
        response = requests.get(search_url, params=params, timeout=8)
        response.raise_for_status()
        items = response.json().get("response", {}).get("docs", [])

        if not items:
            params["q"] = f"{movie_title}"
            response = requests.get(search_url, params=params, timeout=8)
            items = response.json().get("response", {}).get("docs", [])

        results = []
        for item in items:
            ident = item.get("identifier")
            title = item.get("title")
            if not ident or not title:
                continue

            year = item.get("year", "Unknown Year")
            description = item.get("description", '')
            if isinstance(description, list):
                description = " ".join(description)
            clean_desc = (description[:120] + "...") if len(description) > 120 else description

            results.append({
                "title": title,
                "year": year,
                "identifier": ident,
                "description": clean_desc,
                "verification_image": f"https://archive.org/services/img/{ident}/",
                "backup_image": f"https://archive.org/download/{ident}/__ia_thumb.jpg",
                "archive_url": f"https://archive.org/details/{ident}",
                "torrent_url": f"https://archive.org/download/{ident}/{ident}_archive.torrent",
            })

        clean_query = movie_title.replace('"', "").replace("'", "").strip().lower()
        results.sort(key=lambda x: difflib.SequenceMatcher(None, clean_query, x["title"].lower()).ratio(), reverse=True)
        return Response(results)

    except Exception as e:
        return Response({"error": str(e)}, status=500)


# ==========================================
# ADVANCED TORRENT BACKGROUND WORKER
# ==========================================
def background_torrent_worker(torrent_url, save_path, identifier):
    ses = None
    try:
        # 1. OPTIMIZED SESSION SETTINGS FOR PUBLIC MOVIES
        settings = {
            'enable_dht': True,
            'enable_lsd': True,       
            'enable_upnp': True,
            'enable_natpmp': True,
            'announce_to_all_trackers': True,
            'announce_to_all_tiers': True,
            # Force outgoing/incoming encryption to bypass ISP blocking
            'out_enc_policy': lt.enc_policy.forced,
            'in_enc_policy': lt.enc_policy.forced,
            # Increase connection limits
            'connections_limit': 200,
        }
        ses = lt.session(settings)
        
        # 2. SEED THE DHT OVER WIDER PORTS
        # If 6881 is blocked by your ISP, this falls back automatically up to 6899
        ses.listen_on(6881, 6899)

        # Robust, updated DHT bootstrap nodes (vital for finding peers without trackers)
        dht_nodes = [
            ("router.bittorrent.com", 6881),
            ("router.utorrent.com", 6881),
            ("dht.transmissionbt.com", 6881),
            ("dht.aelitis.com", 6881),
            ("router.bitcomet.com", 6881),
        ]
        for node in dht_nodes:
            ses.add_dht_node(node)

        ses.start_dht()

        # Fetch the torrent payload
        response = requests.get(torrent_url, timeout=15)
        if response.status_code != 200:
            ACTIVE_DOWNLOADS[identifier] = {"completed": False, "error": "Failed to fetch torrent file"}
            return

        torrent_data = lt.bdecode(response.content)
        info = lt.torrent_info(torrent_data)

        params = {
            'save_path': save_path,
            'storage_mode': lt.storage_mode_t.storage_mode_sparse,
            'ti': info,
        }

        handle = ses.add_torrent(params)

        # 3. FRESH AGGRESSIVE PUBLIC TRACKERS 
        # Essential for mainstream public torrent structures
        public_trackers = [
            "udp://tracker.opentrackr.org:1337/announce",
            "udp://open.tracker.cl:1337/announce",
            "udp://tracker.openbittorrent.com:6969/announce",
            "udp://exodus.desync.com:6969/announce",
            "udp://tracker.torrent.eu.org:451/announce",
            "udp://tracker.moeking.me:6969/announce",
            "http://tracker.gbitt.info:80/announce"
        ]
        for tracker in public_trackers:
            handle.add_tracker({"url": tracker, "tier": 0})

        # Target largest video file
        files = info.files()
        num_files = files.num_files()
        largest_file_idx = -1
        max_size = 0
        # video_extensions = ('.mp4', '.mkv', '.avi', '.mov')
        video_extensions = ('.mp4')
        for idx in range(num_files):
            file_path_str = files.file_path(idx)
            file_size_bytes = files.file_size(idx)
            if file_path_str.lower().endswith(video_extensions) and file_size_bytes > max_size:
                max_size = file_size_bytes
                largest_file_idx = idx

        if largest_file_idx != -1:
            # Set target file to highest priority, everything else to 0 (ignore)
            priorities = [0] * num_files
            priorities[largest_file_idx] = 4
            handle.prioritize_files(priorities)
            print(f"Targeting: {files.file_path(largest_file_idx)} ({max_size / (1024*1024):.1f} MB)")

        handle.set_sequential_download(True)

        # Save session pointer globally so it lives
        ACTIVE_DOWNLOADS[identifier] = {
            "session": ses,
            "handle": handle,
            "completed": False,
            "error": None,
            "save_path": save_path,
        }

        # Monitor progress loop
        start_time = time.time()
        STUCK_TIMEOUT = 120  # Cancel if absolutely no connection after 2 minutes

        while True:
            status = handle.status()
            progress = status.progress
            ACTIVE_DOWNLOADS[identifier]["progress"] = progress

            # If we finally have peers or progress, reset the stuck timeout clock
            if status.num_peers > 0 or progress > 0.0:
                start_time = time.time() 

            if largest_file_idx != -1:
                file_prog = handle.file_progress()
                if len(file_prog) > largest_file_idx and file_prog[largest_file_idx] >= max_size:
                    break
            if status.is_seeding or progress >= 1.0:
                break

            if progress == 0.0 and (time.time() - start_time) > STUCK_TIMEOUT:
                print(f"Download stuck at 0% with 0 peers, aborting: {identifier}")
                ACTIVE_DOWNLOADS[identifier]["error"] = "Download timed out — No peers responding."
                ACTIVE_DOWNLOADS[identifier]["completed"] = False
                ses.remove_torrent(handle)
                return

            time.sleep(2)

        ACTIVE_DOWNLOADS[identifier]["completed"] = True
        print(f"Download completed: {identifier}")

    except Exception as e:
        print(f"Torrent error [{identifier}]: {e}")
        if identifier in ACTIVE_DOWNLOADS:
            ACTIVE_DOWNLOADS[identifier]["error"] = str(e)
        else:
            ACTIVE_DOWNLOADS[identifier] = {"completed": False, "error": str(e)}
# ==========================================
# 2. DOWNLOAD MOVIE VIEW
# ==========================================
@api_view(['POST'])
def download_movie(request):
    identifier = request.data.get('identifier', '').strip()
    torrent_url = request.data.get('torrent_url', '').strip()

    if not identifier or not torrent_url:
        return Response({"error": "Missing 'identifier' or 'torrent_url'"}, status=400)

    if identifier in ACTIVE_DOWNLOADS:
        status = ACTIVE_DOWNLOADS[identifier]["handle"].status()
        return Response({
            "message": "Movie download in progress",
            "progress": f"{status.progress * 100:.2f}%",
            "download_rate_kb": round(status.download_rate / 1024, 2)
        }, status=200)

    movie_folder = os.path.join(DOWNLOAD_DIR, identifier)
    
    # Quick check if files already exist
    if os.path.exists(movie_folder) and len(os.listdir(movie_folder)) > 0:
        return Response({"message": "Movie file is cached and ready"}, status=200)

    thread = threading.Thread(
        target=background_torrent_worker,
        args=(torrent_url, movie_folder, identifier),
        daemon=True
    )
    thread.start()

    return Response({
        "message": "Selective video download initiated successfully in the background",
        "identifier": identifier
    }, status=202)


# ==========================================
# 3. DOWNLOAD STATUS VIEW
# ==========================================
@api_view(['GET'])
def download_status(request, identifier):
    if identifier in ACTIVE_DOWNLOADS:
        download_data = ACTIVE_DOWNLOADS[identifier]
        status = download_data["handle"].status()
        return Response({
            "active": True,
            "completed": download_data["completed"],
            "progress": round(status.progress * 100, 2),
            "download_rate_kb": round(status.download_rate / 1024, 2),
            "num_peers": status.num_peers
        })
    
    movie_folder = os.path.join(DOWNLOAD_DIR, identifier)
    if os.path.exists(movie_folder) and len(os.listdir(movie_folder)) > 0:
         return Response({"active": False, "completed": True, "message": "Download complete."})

    return Response({"active": False, "completed": False, "message": "Not active."})












# ==========================================
# 4. STREAM MOVIE VIEW (Supporting Ranges)
# ==========================================

















# watch 

@api_view(['GET'])
def stream_movie(request):
    file_path = './video_test/lol.mp4'
    
    # Is the file still downloading? You need a way to track this.
    # For example, checking if a temporary download lock file exists, 
    # or if the downloader process is still active.
    is_still_downloading = True  # Replace with your actual download status check

    # If it doesn't exist at all yet, wait a moment or raise 404
    if not os.path.exists(file_path):
        raise Http404("Movie not found")

    current_file_size = os.path.getsize(file_path)
    range_header = request.META.get('HTTP_RANGE', '').strip()
    
    start = 0
    status_code = 200

    if range_header:
        match = re.match(r'bytes=(\d+)-(\d*)', range_header)
        if match:
            start = int(match.group(1))
            status_code = 206

    # 1. Smarter Generator that waits for new data
    def live_file_iterator(path, offset, chunk_size=8192, timeout=30):
        """
        Yields bytes from a file, waiting for new data if the file is still growing.
        """
        with open(path, 'rb') as f:
            f.seek(offset)
            time_spent_waiting = 0
            
            while True:
                chunk = f.read(chunk_size)
                if chunk:
                    yield chunk
                    time_spent_waiting = 0  # Reset timeout counter on successful read
                else:
                    # No data read. Check if the download is officially finished.
                    # You must implement your own logic for checking if the download is done!
                    download_finished = not is_still_downloading 
                    
                    if download_finished:
                        break  # File is complete, we are done.
                    
                    # File is still downloading, wait for more data to arrive
                    if time_spent_waiting >= timeout:
                        break  # Avoid infinite loops if the downloader crashed
                        
                    time.sleep(0.5)
                    time_spent_waiting += 0.5

    # 2. Configure headers for a growing file
    response = StreamingHttpResponse(
        live_file_iterator(file_path, start), 
        status=status_code, 
        content_type='video/mp4'
    )
    
    response['Accept-Ranges'] = 'bytes'
    response['Content-Disposition'] = 'inline; filename="lol.mp4"'
    
    # CRITICAL: If it's still downloading, we don't know the final content length.
    # We omit or adapt the total size so the browser treats it as a live stream chunk.
    if is_still_downloading:
        # Tell the browser we are sending bytes starting from 'start', but total size is unknown (*)
        response['Content-Range'] = f'bytes {start}-/*'
        # Note: We omit 'Content-Length' entirely here because the stream length is dynamic.
    else:
        # Standard behavior for a fully finished file
        file_size = os.path.getsize(file_path)
        end = file_size - 1
        content_length = end - start + 1
        response['Content-Length'] = str(content_length)
        response['Content-Range'] = f'bytes {start}-{end}/{file_size}'
        
    return response