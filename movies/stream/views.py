import os
import time
import threading
import difflib
import requests
import libtorrent as lt

from django.http import StreamingHttpResponse, Http404
from rest_framework.decorators import api_view
from rest_framework.response import Response

# Global in-memory engine storage
# Format: { identifier: { "session": ses, "handle": handle, "completed": False, "save_path": path } }
ACTIVE_DOWNLOADS = {}
DOWNLOAD_DIR = "./movies_cache"

os.makedirs(DOWNLOAD_DIR, exist_ok=True)


# ==========================================
# 1. SEARCH MOVIES VIEW
# ==========================================
@api_view(["GET"])
def search_movies(request):
    """
    Searches Archive.org for movies and returns titles, descriptions,
    and multiple poster options, sorted by closest title match.
    """
    movie_title = request.query_params.get("title", "").strip()
    if not movie_title:
        return Response(
            {"error": "Provide a title parameter (e.g., ?title=The Matrix)"},
            status=400
        )

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

        # Relevance Sorting
        clean_query = movie_title.replace('"', "").replace("'", "").strip().lower()
        results.sort(
            key=lambda x: difflib.SequenceMatcher(None, clean_query, x["title"].lower()).ratio(),
            reverse=True
        )

        return Response(results)

    except requests.exceptions.RequestException as e:
        return Response({"error": f"Archive.org communication error: {str(e)}"}, status=502)
    except Exception as e:
        return Response({"error": f"Internal server error: {str(e)}"}, status=500)


# ==========================================
# TORRENT BACKGROUND WORKER
# ==========================================
def background_torrent_worker(torrent_url, save_path, identifier):
    """
    Background worker keeping libtorrent session alive, forcing 
    sequential downloads for instant streaming capabilities.
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
        handle.set_sequential_download(True)

        # Retain references globally to prevent garbage collection mid-download
        ACTIVE_DOWNLOADS[identifier] = {
            "session": ses,
            "handle": handle,
            "completed": False,
            "save_path": save_path
        }

        while not handle.status().is_seeding:
            time.sleep(2)

        # Mark as complete safely without clearing context handles
        if identifier in ACTIVE_DOWNLOADS:
            ACTIVE_DOWNLOADS[identifier]["completed"] = True

    except Exception as e:
        print(f"Error in torrent engine for {identifier}: {str(e)}")
        if identifier in ACTIVE_DOWNLOADS:
            del ACTIVE_DOWNLOADS[identifier]


# ==========================================
# 2. DOWNLOAD MOVIE VIEW
# ==========================================
@api_view(['POST'])
def download_movie(request):
    """
    Initiates sequential video block torrenting for a specific movie identifier.
    """
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
    
    # Check if files already exist locally 
    if os.path.exists(movie_folder) and len(os.listdir(movie_folder)) > 0:
        return Response({"message": "Movie is ready for streaming"}, status=200)

    thread = threading.Thread(
        target=background_torrent_worker,
        args=(torrent_url, movie_folder, identifier),
        daemon=True
    )
    thread.start()

    return Response({
        "message": "Download initiated successfully in the background",
        "identifier": identifier
    }, status=202)


# ==========================================
# 3. DOWNLOAD STATUS VIEW
# ==========================================
@api_view(['GET'])
def download_status(request, identifier):
    """
    Returns polling statistics regarding torrent speeds and buffer availability.
    """
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
    
    # Fallback to verify folder contents if the memory tracker dropped out
    movie_folder = os.path.join(DOWNLOAD_DIR, identifier)
    if os.path.exists(movie_folder) and len(os.listdir(movie_folder)) > 0:
         return Response({"active": False, "completed": True, "message": "Download completed."})

    return Response({"active": False, "completed": False, "message": "Not downloading or queued."})


# ==========================================
# 4. STREAM MOVIE VIEW (WITH RANGE HEADERS)
# ==========================================
def _find_largest_video_file(dir_path):
    """Helper to crawl directory and find the actual movie file."""
    largest_file = None
    max_size = 0
    video_extensions = ('.mp4', '.mkv', '.avi', '.mov')
    
    for root, _, files in os.walk(dir_path):
        for f in files:
            if f.endswith(video_extensions):
                full_path = os.path.join(root, f)
                file_size = os.path.getsize(full_path)
                if file_size > max_size:
                    max_size = file_size
                    largest_file = full_path
    return largest_file


@api_view(['GET'])
def stream_movie(request):
    """
    Streams the tracked movie file back to the browser supporting HTML5 content chunking.
    Expects dynamic query param: /api/stream/?identifier=item_id
    """
    identifier = request.query_params.get('identifier', '').strip()
    if not identifier:
        return Response({"error": "Missing 'identifier' parameter"}, status=400)

    movie_folder = os.path.join(DOWNLOAD_DIR, identifier)
    file_path = _find_largest_video_file(movie_folder)

    if not file_path or not os.path.exists(file_path):
        raise Http404("Video content missing or buffering primary chunks.")

    file_size = os.path.getsize(file_path)
    range_header = request.META.get('HTTP_RANGE', '').strip()
    
    # Parse HTTP range definitions (e.g., bytes=0-1048576)
    start, end = 0, file_size - 1
    if range_header and range_header.startswith('bytes='):
        try:
            ranges = range_header.split('=')[1].split('-')
            if ranges[0]:
                start = int(ranges[0])
            if ranges[1]:
                end = int(ranges[1])
        except ValueError:
            pass

    # Constrain boundaries safely
    end = min(end, file_size - 1)
    chunk_length = (end - start) + 1

    def range_iterator(path, offset, length, chunk_size=16384):
        with open(path, 'rb') as f:
            f.seek(offset)
            remaining = length
            while remaining > 0:
                to_read = min(chunk_size, remaining)
                data = f.read(to_read)
                if not data:
                    break
                remaining -= len(data)
                yield data

    # Return HTTP 206 Partial Content response
    response = StreamingHttpResponse(
        range_iterator(file_path, start, chunk_length), 
        status=206, 
        content_type='video/mp4'
    )
    response['Content-Range'] = f'bytes {start}-{end}/{file_size}'
    response['Accept-Ranges'] = 'bytes'
    response['Content-Length'] = chunk_length
    response['Content-Disposition'] = 'inline; filename="movie.mp4"'
    
    return response