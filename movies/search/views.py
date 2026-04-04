import requests
from rest_framework.decorators import api_view
from rest_framework.response import Response
import os
import threading

def sort_key(movie):
    try:
        return int(movie['production_year'])
    except ValueError:
        return -1

@api_view(['GET'])
def search(request):
    query = request.GET.get('q', '')
    
    if not query:
        return Response({"message": "No query provided. You should return popular movies here!"})

    api_key = os.environ.get('tmdb_api_key')
    
    url = "https://api.themoviedb.org/3/search/movie"
    params = {
        "api_key": api_key,
        "query": query,
        "language": "en-US", 
        "page": 1,           
        "include_adult": "false"
    }
    
    try:
        # Make the request to TMDb
        response = requests.get(url, params=params)
        response.raise_for_status() 
        data = response.json()
        
        movies = []
        if "results" in data:
            for item in data["results"]:
                poster_path = item.get("poster_path")
                cover_image = f"https://image.tmdb.org/t/p/w1280{poster_path}" if poster_path else None
                

                release_date = item.get("release_date", "")
                production_year = release_date.split("-")[0] if release_date else "N/A"
                

                movies.append({
                    "movie_id": item.get("id"),
                    "name": item.get("title"),
                    "production_year": production_year,
                    "rating": item.get("vote_average"), 
                    "cover_image": cover_image,
                    "overview": item.get("overview"),
                })
        

        # movies = sorted(movies, key=lambda x: x['name'])
        movies = sorted(movies, key=sort_key, reverse=True)
        
        return Response({"results": movies})
        
    except requests.exceptions.RequestException as e:
        return Response({"error": "Failed to communicate with TMDb.", "details": str(e)}, status=500)
    
@api_view(['GET'])
def popular(request):
    api_key = os.environ.get('tmdb_api_key')
    
    # TMDb Popular Movies Endpoint
    url = "https://api.themoviedb.org/3/movie/popular"
    
    # Notice we don't need the 'query' parameter anymore
    params = {
        "api_key": api_key,
        "language": "en-US", 
        "page": 1,
        "include_adult": "false"
    }
    
    try:
        # Make the request to TMDb
        response = requests.get(url, params=params)
        response.raise_for_status() 
        data = response.json()
        
        movies = []
        if "results" in data:
            for item in data["results"]:
                poster_path = item.get("poster_path")
                cover_image = f"https://image.tmdb.org/t/p/w1280{poster_path}" if poster_path else None
                
                release_date = item.get("release_date", "")
                production_year = release_date.split("-")[0] if release_date else "N/A"
                
                movies.append({
                    "name": item.get("title"),
                    "production_year": production_year,
                    "rating": item.get("vote_average"), 
                    "cover_image": cover_image
                })
        
        return Response({"results": movies})
        
    except requests.exceptions.RequestException as e:
        return Response({"error": "Failed to fetch popular movies from TMDb.", "details": str(e)}, status=500)



# http://localhost:8000/search/movie_detail?id=1098152<movie_id>
@api_view(['GET'])
def movie_detail(request):
    movie_id = request.GET.get('id', '')
    if not movie_id:
        return Response({"error": "No movie id provided."}, status=400)

    api_key = os.environ.get('tmdb_api_key')
    base_url = "https://api.themoviedb.org/3/movie"
    image_base = "https://image.tmdb.org/t/p/w1280"

    # Fetch movie details
    url = f"{base_url}/{movie_id}"
    params = {"api_key": api_key, "language": "en-US"}
    try:
        response = requests.get(url, params=params)
        if response.status_code == 404:
            return Response({"error": "Movie not found."}, status=404)
        response.raise_for_status()
        data = response.json()

        # Fetch credits (actors)
        credits_url = f"{base_url}/{movie_id}/credits"
        credits_resp = requests.get(credits_url, params=params)
        credits_data = credits_resp.json() if credits_resp.ok else {}

        actors = []
        for actor in credits_data.get("cast", [])[:5]:  # Top 5 actors
            actors.append({
                "name": actor.get("name"),
                "character": actor.get("character"),
                "profile_image": f"{image_base}{actor['profile_path']}" if actor.get("profile_path") else None
            })

        poster_path = data.get("poster_path")
        cover_image = f"{image_base}{poster_path}" if poster_path else None
        backdrop_path = data.get("backdrop_path")
        backdrop_image = f"{image_base}{backdrop_path}" if backdrop_path else None

        movie_info = {
            "movie_id": data.get("id"),
            "name": data.get("title"),
            "production_year": data.get("release_date", "")[:4] if data.get("release_date") else "N/A",
            "rating": data.get("vote_average"),
            "cover_image": cover_image,
            "backdrop_image": backdrop_image,
            "overview": data.get("overview"),
            "genres": [genre["name"] for genre in data.get("genres", [])],
            "runtime": data.get("runtime"),
            "release_date": data.get("release_date"),
            "homepage": data.get("homepage"),
            "actors": actors,
        }
        return Response(movie_info)
    except requests.exceptions.RequestException as e:
        return Response({"error": "Failed to communicate with TMDb.", "details": str(e)}, status=500)