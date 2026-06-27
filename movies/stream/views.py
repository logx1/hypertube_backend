import os
import time
import threading
import difflib
import requests
import libtorrent as lt

from django.http import StreamingHttpResponse, Http404
from rest_framework.decorators import api_view
from rest_framework.response import Response

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
    """
    Background worker that extracts files, targets ONLY the largest video file,
    ignores all metadata/sub-files, and streams sequentially.
    """
    try:
        ses = lt.session()
        ses.listen_on(6881, 6891)

        response = requests.get(torrent_url, timeout=10)
        if response.status_code != 200:
            return

        torrent_data = lt.bdecode(response.content)
        info = lt.torrent_info(torrent_data)

        params = {
            'save_path': save_path,
            'storage_mode': lt.storage_mode_t.storage_mode_sparse,
            'ti': info
        }

        handle = ses.add_torrent(params)
        
        # 🎯 FIX: Correctly interface with libtorrent's file_storage object
        files = info.files()  # This returns a file_storage object
        num_files = files.num_files()  # Get total count of files
        
        largest_file_idx = -1
        max_size = 0
        video_extensions = ('.mp4', '.mkv', '.avi', '.mov')

        # Loop using range and use file_storage methods: file_path() and file_size()
        for idx in range(num_files):
            file_path_str = files.file_path(idx)
            file_size_bytes = files.file_size(idx)
            
            if file_path_str.lower().endswith(video_extensions) and file_size_bytes > max_size:
                max_size = file_size_bytes
                largest_file_idx = idx

        # If a video file was found, tell libtorrent to ONLY download that file
        if largest_file_idx != -1:
            # Step 1: Set file priorities (0 means do not download)
            file_priorities = [0] * num_files
            file_priorities[largest_file_idx] = 4  # 4 is standard/normal priority
            handle.prioritize_files(file_priorities)
            
            print(f"Targeting single video file: {files.file_path(largest_file_idx)} ({max_size / (1024*1024):.2f} MB)")
        else:
            print("Warning: No video extension found. Downloading entire package as fallback.")

        # Force sequential download pieces for streaming
        handle.set_sequential_download(True)

        ACTIVE_DOWNLOADS[identifier] = {
            "session": ses,
            "handle": handle,
            "completed": False,
            "save_path": save_path
        }

        while True:
            status = handle.status()
            
            if status.is_seeding or (status.progress >= 1.0 and status.state == lt.torrent_status.state_t.finished):
                break
                
            # Fallback breaking logic: check our specific targeted file's progress
            if largest_file_idx != -1 and handle.file_progress()[largest_file_idx] == max_size:
                break
                
            time.sleep(2)

        if identifier in ACTIVE_DOWNLOADS:
            ACTIVE_DOWNLOADS[identifier]["completed"] = True
            print(f"Targeted movie download completed for: {identifier}")

    except Exception as e:
        print(f"Error in torrent engine: {str(e)}")
        if identifier in ACTIVE_DOWNLOADS:
            del ACTIVE_DOWNLOADS[identifier]

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
def _find_largest_video_file(dir_path):
    largest_file = None
    max_size = 0
    video_extensions = ('.mp4', '.mkv', '.avi', '.mov')
    
    for root, _, files in os.walk(dir_path):
        for f in files:
            if f.lower().endswith(video_extensions):
                full_path = os.path.join(root, f)
                file_size = os.path.getsize(full_path)
                if file_size > max_size:
                    max_size = file_size
                    largest_file = full_path
    return largest_file

# watch 
@api_view(['GET'])
def stream_movie(request):
    # Hardcoded path to your test video file
    file_path = './video_test/lol.mp4'
    if not os.path.exists(file_path):
        raise Http404("Movie not found")

    def file_iterator(path, chunk_size=8192):
        with open(path, 'rb') as f:
            while chunk := f.read(chunk_size):
                yield chunk

    response = StreamingHttpResponse(file_iterator(file_path), content_type='video/mp4')
    response['Content-Disposition'] = 'inline; filename="lol.mp4"'
    response['Content-Length'] = os.path.getsize(file_path)
    return response