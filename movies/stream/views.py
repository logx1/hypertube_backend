import os
import time
import threading
import requests
import libtorrent as lt
from rest_framework.decorators import api_view
from rest_framework.response import Response

# --- BACKGROUND DOWNLOAD WORKER ---
def download_torrent_background(torrent_file_path, save_directory):
    """
    Runs in the background using libtorrent.
    Prioritizes sequential downloading so the video can be streamed.
    """
    try:
        # 1. Initialize the BitTorrent session
        ses = lt.session({'listen_interfaces': '0.0.0.0:6881'})
        
        # 2. Load the torrent file we downloaded from Archive.org
        info = lt.torrent_info(torrent_file_path)
        
        # 3. Add the torrent to the session
        h = ses.add_torrent({
            'ti': info, 
            'save_path': save_directory
        })
        
        # CRITICAL FOR HYPERTUBE: Force sequential download for streaming!
        h.set_sequential_download(True)
        
        print(f"Starting download: {h.name()}")
        
        # 4. Keep the thread alive while downloading
        while not h.is_seed():
            s = h.status()
            print(f"[{h.name()}] Progress: {s.progress * 100:.2f}% | "
                  f"Download rate: {s.download_rate / 1000} kB/s | "
                  f"Peers: {s.num_peers}")
            
            # Here you would typically save progress to your database 
            # so the frontend knows when enough is downloaded to start playing.
            
            time.sleep(5)
            
        print(f"Download complete: {h.name()}")
        
    except Exception as e:
        print(f"Torrent download failed: {str(e)}")


# --- DJANGO REST FRAMEWORK VIEW ---
@api_view(['POST'])
def download(request):
    # Retrieve the title from the URL parameters (?title="movie name")
    movie_title = request.query_params.get('title', '')
    
    if not movie_title:
        return Response({"error": "Movie title is required in the URL parameters (e.g., ?title=Matrix)."}, status=400)

    # 1. Search Archive.org for the legal torrent
    archive_search_url = "https://archive.org/advancedsearch.php"
    params = {
        'q': f'title:({movie_title}) AND mediatype:(movies) AND format:(Archive BitTorrent)',
        'fl[]': 'identifier,title',
        'output': 'json',
        'rows': 1 
    }

    try:
        response = requests.get(archive_search_url, params=params)
        response.raise_for_status()
        data = response.json()

        docs = data.get('response', {}).get('docs', [])
        if not docs:
            return Response({"error": "No legal torrent found for this movie on Archive.org."}, status=404)

        identifier = docs[0]['identifier']
        matched_title = docs[0]['title']
        torrent_url = f"https://archive.org/download/{identifier}/{identifier}_archive.torrent"

        # 2. Setup directories in your Django project
        base_media_dir = os.path.join(os.getcwd(), 'media', 'movies', identifier)
        os.makedirs(base_media_dir, exist_ok=True)
        
        torrent_file_path = os.path.join(base_media_dir, f"{identifier}.torrent")

        # 3. Download the actual .torrent file to disk first
        torrent_resp = requests.get(torrent_url)
        with open(torrent_file_path, 'wb') as f:
            f.write(torrent_resp.content)

        # 4. Fire off the background download task using threading
        download_thread = threading.Thread(
            target=download_torrent_background, 
            args=(torrent_file_path, base_media_dir)
        )
        download_thread.start()

        return Response({
            "message": "Torrent found and background download initiated.",
            "searched_for": movie_title,
            "matched_title": matched_title,
            "identifier": identifier,
            "status": "downloading",
            # Example endpoint you will need to build next:
            "stream_endpoint": f"/stream/{identifier}" 
        })

    except requests.exceptions.RequestException as e:
        return Response({"error": "Failed to communicate with Archive.org.", "details": str(e)}, status=500)