import os
import time
import threading
import requests
import libtorrent as lt
from rest_framework.decorators import api_view
from rest_framework.response import Response
import os
from django.http import StreamingHttpResponse, Http404


from torrentp import TorrentDownloader
import difflib




@api_view(["GET"])
def search_movies(request):
    """Searches Archive.org for movies and returns titles, years, descriptions,

    and multiple poster options for quick frontend verification.
    """
    # 1. Extract and sanitize input query
    movie_title = request.query_params.get("title", "").strip()
    if not movie_title:
        return Response(
            {"error": "Provide a title parameters (e.g., ?title=The Matrix)"},
            status=400,
        )

    search_url = "https://archive.org/advancedsearch.php"

    # Target popular media files first to maximize high-quality poster matching
    params = {
        "q": f"{movie_title} AND mediatype:(movies)",
        "fl[]": ["identifier", "title", "description", "year"],
        "sort[]": "downloads desc",
        "output": "json",
        "rows": 12,  # Ideal response count for a 2, 3, or 4-column responsive frontend grid
    }

    try:
        # Single network hop to the search index (extremely fast execution)
        response = requests.get(search_url, params=params, timeout=8)
        response.raise_for_status()
        items = response.json().get("response", {}).get("docs", [])

        # Fallback: Broaden lookup bounds if the strict media filter returned zero items
        if not items:
            params["q"] = f"{movie_title}"
            response = requests.get(search_url, params=params, timeout=8)
            items = response.json().get("response", {}).get("docs", [])

        results = []

        for item in items:
            ident = item.get("identifier")
            title = item.get("title")

            # Skip invalid structural references
            if not ident or not title:
                continue

            # Standardize year and description strings
            year = item.get("year", "Unknown Year")
            description = item.get("description", '')

            if isinstance(description, list):
                description = " ".join(description)
            clean_desc = (
                (description[:120] + "...")
                if len(description) > 120
                else description
            )

            # Construct direct static image endpoints
            # Format A uses the internal service handler (requires trailing slash)
            primary_poster = f"https://archive.org/services/img/{ident}/"
            # Format B bypasses the service layer to point directly to standard generated filesystem thumbs
            backup_poster = (
                f"https://archive.org/download/{ident}/__ia_thumb.jpg"
            )

            results.append(
                {
                    "title": title,
                    "year": year,
                    "identifier": ident,
                    "description": clean_desc,
                    "verification_image": primary_poster,
                    "backup_image": backup_poster,
                    "archive_url": f"https://archive.org/details/{ident}",
                    "torrent_url": f"https://archive.org/download/{ident}/{ident}_archive.torrent",
                }
            )

        # === RELEVANCE SORTING LOGIC ADDED HERE ===
        # Strip literal frontend quotes out of the comparison key
        clean_query = movie_title.replace('"', "").replace("'", "").strip().lower()

        # Sort descending based on string match ratio (closest match goes to index 0)
        results.sort(
            key=lambda x: difflib.SequenceMatcher(
                None, clean_query, x["title"].lower()
            ).ratio(),
            reverse=True,
        )

        return Response(results)

    except requests.exceptions.RequestException as e:
        return Response(
            {"error": f"Failed to communicate with Archive.org: {str(e)}"},
            status=502,
        )
    except Exception as e:
        return Response({"error": f"Internal server error: {str(e)}"}, status=500)









import os
import threading
import libtorrent as lt
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

# In-memory dictionary to track currently active background downloads
# Key: identifier, Value: libtorrent handle status
ACTIVE_DOWNLOADS = {}
DOWNLOAD_DIR = "./movies_cache"

# Ensure the download directory exists
os.makedirs(DOWNLOAD_DIR, exist_ok=True)


def background_torrent_worker(torrent_url, save_path, identifier):
    """
    Background worker thread that initializes libtorrent,
    forces sequential download, and keeps the session alive.
    """
    try:
        ses = lt.session()
        # Set basic session configurations (ports)
        ses.listen_on(6881, 6891)

        # Download the .torrent file data from Archive.org
        import requests
        response = requests.get(torrent_url, timeout=10)
        if response.status_code != 200:
            print(f"Failed to fetch torrent file for {identifier}")
            return

        # Load torrent info
        torrent_data = lt.bdecode(response.content)
        info = lt.torrent_info(torrent_data)

        params = {
            'save_path': save_path,
            'storage_mode': lt.storage_mode_t.storage_mode_sparse,
            'ti': info
        }

        handle = ses.add_torrent(params)
        
        # CRITICAL RULE: Force download pieces in order from start to finish
        handle.set_sequential_download(True)

        # Keep track of this handle globally so we can check status/progress
        ACTIVE_DOWNLOADS[identifier] = handle

        print(f"Started sequential background download for: {identifier}")

        # Keep the thread alive while downloading
        while not handle.status().is_seeding:
            s = handle.status()
            # You can log progress here or update a Database model row
            # print(f"Progress: {s.progress * 100:.2f}% | Download Rate: {s.download_rate / 1000} kB/s")
            import time
            time.sleep(2)

        print(f"Download completed for: {identifier}")

    except Exception as e:
        print(f"Error in background torrent worker: {str(e)}")
        if identifier in ACTIVE_DOWNLOADS:
            del ACTIVE_DOWNLOADS[identifier]


@api_view(['POST'])
def download_movie(request):
    """
    Receives a movie identifier and torrent_url from the frontend,
    and initiates a sequential background download.
    """
    identifier = request.data.get('identifier', '').strip()
    torrent_url = request.data.get('torrent_url', '').strip()

    if not identifier or not torrent_url:
        return Response({"error": "Missing 'identifier' or 'torrent_url' in request body"}, status=400)

    # 1. If it's already actively downloading, just return status
    if identifier in ACTIVE_DOWNLOADS:
        handle = ACTIVE_DOWNLOADS[identifier]
        status = handle.status()
        return Response({
            "message": "Movie is already downloading",
            "progress": f"{status.progress * 100:.2f}%",
            "download_rate_kb": status.download_rate / 1024
        }, status=200)

    # 2. Check if file already exists completely on disk (already downloaded before)
    # (In production, you'd match this against a database record)
    movie_folder = os.path.join(DOWNLOAD_DIR, identifier)
    if os.path.exists(movie_folder) and not os.listdir(movie_folder) == []:
        # If folder exists and isn't empty, assume it's downloaded or ready
        return Response({"message": "Movie is ready for streaming"}, status=200)

    # 3. Fire up the non-blocking background thread
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


@api_view(['GET'])
def download_status(request, identifier):
    """
    Optional helper endpoint for the frontend to poll the current
    download speed and percentage completion.
    """
    if identifier in ACTIVE_DOWNLOADS:
        status = ACTIVE_DOWNLOADS[identifier].status()
        return Response({
            "active": True,
            "progress": round(status.progress * 100, 2),
            "download_rate_kb": round(status.download_rate / 1024, 2),
            "num_peers": status.num_peers
        })
    
    return Response({"active": False, "message": "Not downloading or complete."})





# watch 
@api_view(['GET'])
def stream_movie(request):
    # Hardcoded path to your test video file
    file_path = './video_test/test_video.mp4'
    if not os.path.exists(file_path):
        raise Http404("Movie not found")

    def file_iterator(path, chunk_size=8192):
        with open(path, 'rb') as f:
            while chunk := f.read(chunk_size):
                yield chunk

    response = StreamingHttpResponse(file_iterator(file_path), content_type='video/mp4')
    response['Content-Disposition'] = 'inline; filename="test_video.mp4"'
    response['Content-Length'] = os.path.getsize(file_path)
    return response