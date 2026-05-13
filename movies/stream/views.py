import os
import time
import threading
import requests
import libtorrent as lt
from rest_framework.decorators import api_view
from rest_framework.response import Response

@api_view(['GET'])
def search_movies(request):
    movie_title = request.query_params.get('title', '')
    if not movie_title:
        return Response({"error": "Provide a title"}, status=400)

    search_url = "https://archive.org/advancedsearch.php"
    params = {
        'q': f'title:({movie_title}) AND mediatype:(movies)',
        'fl[]': 'identifier,title',
        'output': 'json',
        'rows': 10 
    }
    
    try:
        response = requests.get(search_url, params=params)
        items = response.json().get('response', {}).get('docs', [])

        results = []
        for item in items:
            ident = item['identifier']
            meta_url = f"https://archive.org/metadata/{ident}"
            meta_resp = requests.get(meta_url).json()
            
            files = meta_resp.get('files', [])
            
            # 1. FIND VIDEOS
            valid_video_formats = ['MPEG4', 'H.264', 'Matroska', 'h.264']
            video_list = [
                {"file_name": f['name'], "format": f.get('format'), "size": f.get('size')}
                for f in files 
                if f.get('format') in valid_video_formats or f['name'].endswith(('.mp4', '.mkv'))
            ]

            # 2. FIND IMAGES (The Thumbnail/Poster)
            # We look for common image formats or files tagged as 'Thumbnail'
            image_url = None
            for f in files:
                if f.get('format') in ['JPEG', 'PNG', 'JSON Thumb']:
                    image_url = f"https://archive.org/download/{ident}/{f['name']}"
                    break # Take the first good image we find
            
            # Fallback: Archive.org usually has a default thumbnail if no specific image is found
            if not image_url:
                image_url = f"https://archive.org/services/img/{ident}"

            if video_list:
                results.append({
                    "title": item['title'],
                    "identifier": ident,
                    "poster_image": image_url,
                    "videos": video_list,
                    "torrent_url": f"https://archive.org/download/{ident}/{ident}_archive.torrent"
                })

        return Response(results)

    except Exception as e:
        return Response({"error": str(e)}, status=500)
    

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