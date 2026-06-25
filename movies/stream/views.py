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

@api_view(['GET'])
def search_movies(request):
    """
    Searches Archive.org for movies and returns titles, years, descriptions,
    and multiple poster options for quick frontend verification.
    """
    # 1. Extract and sanitize input query
    movie_title = request.query_params.get('title', '').strip()
    if not movie_title:
        return Response({"error": "Provide a title parameters (e.g., ?title=The Matrix)"}, status=400)

    search_url = "https://archive.org/advancedsearch.php"
    
    # Target popular media files first to maximize high-quality poster matching
    params = {
        'q': f'{movie_title} AND mediatype:(movies)',
        'fl[]': ['identifier', 'title', 'description', 'year'],
        'sort[]': 'downloads desc',
        'output': 'json',
        'rows': 12  # Ideal response count for a 2, 3, or 4-column responsive frontend grid
    }
    
    try:
        # Single network hop to the search index (extremely fast execution)
        response = requests.get(search_url, params=params, timeout=8)
        response.raise_for_status()
        items = response.json().get('response', {}).get('docs', [])
        
        # Fallback: Broaden lookup bounds if the strict media filter returned zero items
        if not items:
            params['q'] = f'{movie_title}'
            response = requests.get(search_url, params=params, timeout=8)
            items = response.json().get('response', {}).get('docs', [])

        results = []
        
        for item in items:
            ident = item.get('identifier')
            title = item.get('title')
            
            # Skip invalid structural references
            if not ident or not title:
                continue

            # Standardize year and description strings
            year = item.get('year', 'Unknown Year')
            description = item.get('description', '')
            
            if isinstance(description, list):
                description = " ".join(description)
            clean_desc = (description[:120] + '...') if len(description) > 120 else description

            # Construct direct static image endpoints
            # Format A uses the internal service handler (requires trailing slash)
            primary_poster = f"https://archive.org/services/img/{ident}/"
            # Format B bypasses the service layer to point directly to standard generated filesystem thumbs
            backup_poster = f"https://archive.org/download/{ident}/__ia_thumb.jpg"

            results.append({
                "title": title,
                "year": year,
                "identifier": ident,
                "description": clean_desc,
                "verification_image": primary_poster,
                "backup_image": backup_poster,
                "archive_url": f"https://archive.org/details/{ident}",
                "torrent_url": f"https://archive.org/download/{ident}/{ident}_archive.torrent"
            })

        return Response(results)

    except requests.exceptions.RequestException as e:
        return Response({"error": f"Failed to communicate with Archive.org: {str(e)}"}, status=502)
    except Exception as e:
        return Response({"error": f"Internal server error: {str(e)}"}, status=500)

import libtorrent as lt
import os
import threading

def download_torrent_background(torrent_url, save_path):
    ses = lt.session()
    # Listen on standard bittorrent ports
    ses.listen_on(6881, 6891)

    # Download the .torrent file data
    r = requests.get(torrent_url)
    info = lt.torrent_info(lt.bdecode(r.content))
    
    params = {
        'save_path': save_path,
        'storage_mode': lt.storage_mode_t.storage_mode_sparse,
        'ti': info,
    }
    
    handle = ses.add_torrent(params)
    
    # IMPORTANT: Hypertube requirement - Download pieces in order for streaming
    handle.set_sequential_download(True) 

    print(f"Starting background download: {handle.status().name}")

    while not handle.status().is_seeding:
        s = handle.status()
        # You can log progress here or update a Database record
        # print(f"Progress: {s.progress * 100:.2f}%")
        time.sleep(5)


@api_view(['POST'])
def start_movie_download(request):
    torrent_url = request.data.get('torrent_url')
    identifier = request.data.get('identifier')
    
    if not torrent_url or not identifier:
        return Response({"error": "Missing data"}, status=400)

    # Path where movies will be stored (shared with your media settings)
    save_path = os.path.join(os.getcwd(), 'media', 'movies', identifier)
    os.makedirs(save_path, exist_ok=True)

    # Start the download in a non-blocking thread 
    thread = threading.Thread(
        target=download_torrent_background, 
        args=(torrent_url, save_path)
    )
    thread.start()

    return Response({
        "status": "started",
        "message": "Download initiated in background.",
        "stream_url": f"/media/movies/{identifier}/" # You'll need to find the exact filename
    })




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





# Define where you want to save downloaded movies on your server
DOWNLOAD_DIR = os.path.join(os.path.expanduser('~'), 'goinfre', 'ArchiveMovies')
os.makedirs(DOWNLOAD_DIR, exist_ok=True)

@api_view(['POST'])
def start_torrent_download(request):
    """
    Takes a torrent_url, downloads the metadata, and starts 
    downloading the video file to the server.
    """
    torrent_url = request.data.get('torrent_url')
    
    if not torrent_url:
        return Response({"error": "Missing 'torrent_url' in request body."}, status=400)
    
    try:
        # 1. Download the temporary .torrent file from Archive.org
        temp_torrent_path = os.path.join(DOWNLOAD_DIR, "temp_movie.torrent")
        
        response = requests.get(torrent_url, timeout=15)
        response.raise_for_status()
        
        with open(temp_torrent_path, 'wb') as f:
            f.write(response.content)
            
        # 2. Initialize the torrent downloader
        downloader = TorrentDownloader(temp_torrent_path, DOWNLOAD_DIR)
        
        # 3. Start the download in a background thread 
        # (This prevents your API from freezing or timing out)
        downloader.start_download()
        
        return Response({
            "message": "Download started successfully in the background.",
            "save_path": DOWNLOAD_DIR,
            "torrent_source": torrent_url
        }, status=202)

    except requests.exceptions.RequestException as e:
        return Response({"error": f"Failed to fetch the torrent file: {str(e)}"}, status=400)
    except Exception as e:
        return Response({"error": f"Internal download error: {str(e)}"}, status=500)