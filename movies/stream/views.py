import os
import time
import threading
import difflib
import requests
import libtorrent as lt

from django.http import StreamingHttpResponse, Http404
from rest_framework.decorators import api_view
from rest_framework.response import Response
from asgiref.sync import sync_to_async
import re

import subprocess
from .models import Movie

ACTIVE_DOWNLOADS = {}
DOWNLOAD_DIR = "/movies_cache"

os.makedirs(DOWNLOAD_DIR, exist_ok=True)


# ==========================================
# 1. SEARCH MOVIES VIEW (Kept unchanged)
# ==========================================
@api_view(["GET"])
def search_movies(request):
    movie_title = request.query_params.get("title", "").strip()
    if not movie_title:
        return Response({"error": "Provide a title parameter"}, status=400)

    # YTS List Movies API Endpoint
    search_url = "https://yts.lt/api/v2/list_movies.json"
    params = {
        "query_term": movie_title,
        "sort_by": "download_count",  # Equivalent to downloads desc
        "limit": 12,  # Equivalent to rows: 12
    }

    try:
        response = requests.get(search_url, params=params, timeout=8)
        response.raise_for_status()
        data = response.json().get("data", {})
        items = data.get("movies", [])

        # Fallback if no items found (YTS query_term handles fuzzy matching well,
        # but we keep the structure consistent with your original logic)
        if not items:
            params["query_term"] = movie_title
            response = requests.get(search_url, params=params, timeout=8)
            items = response.json().get("data", {}).get("movies", [])

        results = []
        for item in items:
            # YTS uses 'title_long' or 'title', and 'id' or 'imdb_code' as unique identifiers
            ident = item.get("imdb_code") or str(item.get("id"))
            title = item.get("title")
            if not ident or not title:
                continue

            year = item.get("year", "Unknown Year")
            description = item.get("synopsis", "")
            if isinstance(description, list):
                description = " ".join(description)
            clean_desc = (
                (description[:120] + "...")
                if len(description) > 120
                else description
            )

            # Extracting the best quality torrent available (usually 1080p or 720p)
            torrents = item.get("torrents", [])
            torrent_url = torrents[0].get("url") if torrents else ""

            results.append({
                "title": title,
                "year": year,
                "identifier": ident,
                "description": clean_desc,
                # YTS provides direct cover images
                "verification_image": item.get("medium_cover_image", ""),
                "backup_image": item.get("small_cover_image", ""),
                "archive_url": item.get("url", ""),  # YTS movie details page
                "torrent_url": torrent_url,  # Direct .torrent file download link
            })

        # Keep your exact string matching sorting logic
        clean_query = (
            movie_title.replace('"', "").replace("'", "").strip().lower()
        )
        results.sort(
            key=lambda x: difflib.SequenceMatcher(
                None, clean_query, x["title"].lower()
            ).ratio(),
            reverse=True,
        )
        return Response(results)

    except Exception as e:
        return Response({"error": str(e)}, status=500)





def transcode_to_144p(input_path, identifier, torrent_url):
    """
    Reads the original file and transcodes it into a separate 144p file.
    Safely initializes dictionary keys to prevent Threading KeyErrors.
    """
    base, ext = os.path.splitext(input_path)
    output_path = f"{base}_144.mp4" 
    target_144_identifier = f"{identifier}144" 
    
    print(f"Creating 144p version for ID: {target_144_identifier}")

    cmd = [
        'ffmpeg', '-y',
        '-i', input_path,
        '-vf', 'scale=-2:144',  
        '-c:v', 'libx264',
        '-crf', '24',           
        '-preset', 'veryfast',  
        '-c:a', 'aac',
        '-b:a', '128k',
        '-movflags', '+faststart', 
        output_path
    ]

    try:
        # 1. Initialize the memory dictionary safely before spawning the process
        if 'ACTIVE_DOWNLOADS' in globals():
            ACTIVE_DOWNLOADS[target_144_identifier] = {
                "status": "transcoding",
                "ffmpeg_pid": None
            }

        # 2. SAVE TO DATABASE AT START (So the record exists immediately)
        Movie.objects.update_or_create(
            movie_id=target_144_identifier,
            defaults={
                "identifier": target_144_identifier, 
                "path": output_path, 
                "torrent_url": torrent_url 
            }
        )

        # 3. Start the FFmpeg process
        process = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        
        # Update with the actual PID now that it's running
        if 'ACTIVE_DOWNLOADS' in globals() and target_144_identifier in ACTIVE_DOWNLOADS:
            ACTIVE_DOWNLOADS[target_144_identifier]["ffmpeg_pid"] = process.pid
        
        stdout, stderr = process.communicate()
        
        if process.returncode == 0:
            print(f"Successfully created 144p file at: {output_path}")
            
            # --- UPDATE DATABASE TO COMPLETED ---
            Movie.objects.filter(movie_id=target_144_identifier).update(completed=True)
            
            if 'ACTIVE_DOWNLOADS' in globals() and target_144_identifier in ACTIVE_DOWNLOADS:
                ACTIVE_DOWNLOADS[target_144_identifier]["status"] = "completed"
        else:
            error_msg = stderr.decode('utf-8', errors='ignore')
            print(f"FFmpeg error: {error_msg}")
            if 'ACTIVE_DOWNLOADS' in globals() and target_144_identifier in ACTIVE_DOWNLOADS:
                ACTIVE_DOWNLOADS[target_144_identifier]["status"] = f"failed: {error_msg}"
                
    except Exception as e:
        print(f"Transcoding thread failed for {target_144_identifier}: {e}")
        if 'ACTIVE_DOWNLOADS' in globals() and target_144_identifier in ACTIVE_DOWNLOADS:
            ACTIVE_DOWNLOADS[target_144_identifier]["status"] = f"exception: {str(e)}"


# ==========================================
# 1. ADVANCED TORRENT BACKGROUND WORKER
# ==========================================

def background_torrent_worker(torrent_url, save_path, identifier):
    ses = None
    try:
        # 1. SETUP SESSION
        settings = {
            'enable_dht': True, 'enable_lsd': True, 'enable_upnp': True,
            'enable_natpmp': True, 'announce_to_all_trackers': True,
            'announce_to_all_tiers': True, 'out_enc_policy': lt.enc_policy.forced,
            'in_enc_policy': lt.enc_policy.forced, 'connections_limit': 200,
        }
        ses = lt.session(settings)
        ses.listen_on(6881, 6899)

        for node in [("router.bittorrent.com", 6881), ("router.utorrent.com", 6881)]:
            ses.add_dht_node(node)
        ses.start_dht()

        # 2. FETCH TORRENT
        response = requests.get(torrent_url, timeout=15)
        if response.status_code != 200: return

        torrent_data = lt.bdecode(response.content)
        info = lt.torrent_info(torrent_data)
        
        # Kept exactly as you requested: sparse storage allocation
        handle = ses.add_torrent({
            'save_path': save_path, 
            'storage_mode': lt.storage_mode_t.storage_mode_sparse, 
            'ti': info
        })

        # 3. IDENTIFY TARGET VIDEO FILE
        files = info.files()
        max_size, largest_file_idx, file_relative_path = 0, -1, ""
        for idx in range(files.num_files()):
            if files.file_path(idx).lower().endswith(('.mp4', '.mkv', '.avi', '.mov')) and files.file_size(idx) > max_size:
                max_size, largest_file_idx, file_relative_path = files.file_size(idx), idx, files.file_path(idx)
        
        full_video_path = os.path.join(save_path, file_relative_path) if file_relative_path else save_path

        # 4. INITIAL SAVE TO DB (Original Movie)
        Movie.objects.update_or_create(
            movie_id=identifier,
            defaults={"identifier": identifier, "path": full_video_path, "torrent_url": torrent_url}
        )

        # 5. CONFIGURE DOWNLOAD
        if largest_file_idx != -1:
            priorities = [0] * files.num_files()
            priorities[largest_file_idx] = 4
            handle.prioritize_files(priorities)

        handle.set_sequential_download(True)
        ACTIVE_DOWNLOADS[identifier] = {"handle": handle, "completed": False, "progress": 0.0, "ffmpeg_started": False}

        # 6. MONITOR LOOP
        start_time, STUCK_TIMEOUT = time.time(), 120
        while True:
            status = handle.status()
            ACTIVE_DOWNLOADS[identifier]["progress"] = status.progress
            
            if status.num_peers > 0 or status.progress > 0.0: start_time = time.time()
            
            # --- START TRANSCODING SEPARATE FILE WHEN DATA IS READY ---
            if not ACTIVE_DOWNLOADS[identifier]["ffmpeg_started"] and status.progress > 0.05:
                if os.path.exists(full_video_path):
                    ffmpeg_thread = threading.Thread(
                        target=transcode_to_144p, 
                        args=(full_video_path, identifier, torrent_url),
                        daemon=True
                    )
                    ffmpeg_thread.start()
                    ACTIVE_DOWNLOADS[identifier]["ffmpeg_started"] = True
            
            # Check for completion
            if (largest_file_idx != -1 and handle.file_progress()[largest_file_idx] >= max_size) or status.is_seeding:
                break
            
            if status.progress == 0.0 and (time.time() - start_time) > STUCK_TIMEOUT:
                raise Exception("Download timed out")

            time.sleep(2)

        # 7. ORIGINAL DOWNLOAD FINISHED
        ACTIVE_DOWNLOADS[identifier]["completed"] = True
        
        # --- UPDATE DATABASE TO COMPLETED HERE ---
        Movie.objects.update_or_create(
            movie_id=identifier, 
            defaults={"path": full_video_path, "completed": True}
        )

    except Exception as e:
        print(f"Torrent error [{identifier}]: {e}")
        ACTIVE_DOWNLOADS[identifier] = {"completed": False, "error": str(e)}

# ==========================================
# 2. API DOWNLOAD VIEW
# ==========================================
@api_view(['POST'])
def download_movie(request):
    identifier = request.data.get('identifier', '').strip()
    torrent_url = request.data.get('torrent_url', '').strip()

    if not identifier or not torrent_url:
        return Response({"error": "Missing 'identifier' or 'torrent_url'"}, status=400)

    # 1. DATABASE CHECK
    if Movie.objects.filter(movie_id=identifier).exists():
        movie_instance = Movie.objects.get(movie_id=identifier)
        return Response({
            "message": "Movie file is cached and tracked ready",
            "path": movie_instance.path,
            "torrent_url": movie_instance.torrent_url
        }, status=200)

    # 2. ACTIVE DOWNLOAD CHECK
    if identifier in ACTIVE_DOWNLOADS and "handle" in ACTIVE_DOWNLOADS[identifier]:
        status = ACTIVE_DOWNLOADS[identifier]["handle"].status()
        return Response({
            "message": "Movie download in progress",
            "progress": f"{status.progress * 100:.2f}%",
            "download_rate_kb": round(status.download_rate / 1024, 2)
        }, status=200)

    # 3. DIRECTORY CHECK
    movie_folder = os.path.join(DOWNLOAD_DIR, identifier)
    if os.path.exists(movie_folder) and len(os.listdir(movie_folder)) > 0:
        Movie.objects.get_or_create(
            movie_id=identifier,
            defaults={"identifier": identifier, "path": movie_folder, "torrent_url": torrent_url}
        )
        return Response({"message": "Movie file found on disk, auto-registered tracking records"}, status=200)

    # 4. INITIALIZE THREAD
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
def download_status(request):
    identifier = request.GET.get('identifier', '').strip(' "\'')
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
    # 1. Get the identifier from the query parameters (e.g. ?identifier=tt5433140)
    # Strip away any accidental literal quotes passed in from frontend matching
    identifier = request.GET.get('identifier', '').strip(' "\'')

    if not identifier:
        return Response({"error": "Missing 'identifier' query parameter"}, status=400)

    # 2. Query the Movie model for the full file path
    try:
        movie_instance = Movie.objects.get(movie_id=identifier)
        file_path = movie_instance.path
    except Movie.DoesNotExist:
        raise Http404("Movie metadata records not tracked in database.")

    # 3. Verify file actually exists on disk where the DB says it does
    if not os.path.exists(file_path):
        raise Http404("Movie file path exists in database but file not found on disk")

    # =========================================================
    # UNTOUCHED STREAMING LOGIC BELOW
    # =========================================================
    file_size = os.path.getsize(file_path)
    range_header = request.META.get('HTTP_RANGE', '').strip()

    start = 0
    end = file_size - 1
    status_code = 200

    # Handle standard browser video range requests (e.g., skipping through timelines)
    if range_header:
        match = re.match(r'bytes=(\d+)-(\d*)', range_header)
        if match:
            start = int(match.group(1))
            if match.group(2):
                end = int(match.group(2))
            status_code = 206

    content_length = end - start + 1

    def read_file_chunk(f, size):
        return f.read(size)

    # Async generator to stream the file in small pieces safely under Uvicorn
    async def file_iterator_async(path, offset, length, chunk_size=32768):
        f = open(path, 'rb')
        f.seek(offset)
        remaining = length
        
        try:
            while remaining > 0:
                to_read = min(chunk_size, remaining)
                # Offload blocking read to a separate worker thread
                chunk = await sync_to_async(read_file_chunk, thread_sensitive=False)(f, to_read)
                
                if not chunk:
                    break
                
                yield chunk
                remaining -= len(chunk)
        finally:
            f.close()

    # Pass the async generator directly to StreamingHttpResponse
    response = StreamingHttpResponse(
        file_iterator_async(file_path, start, content_length), 
        status=status_code, 
        content_type='video/mp4'
    )

    # Dynamically extract original file name for safe browser layout streaming representation
    extracted_filename = os.path.basename(file_path)

    # Standard headers telling the browser exactly how much data is coming
    response['Accept-Ranges'] = 'bytes'
    response['Content-Length'] = str(content_length)
    if range_header:
        response['Content-Range'] = f'bytes {start}-{end}/{file_size}'
    response['Content-Disposition'] = f'inline; filename="{extracted_filename}"'

    return response