import requests
from rest_framework.decorators import api_view
from rest_framework.response import Response
import os

def sort_key(movie):
    try:
        return int(movie['production_year'])
    except ValueError:
        return -1

@api_view(['GET'])
def search(request):
    query = request.GET.get('q', '')
    
    if not query:
        # Based on your project rules: if no search is done, return most popular videos.
        return Response({"message": "No query provided. You should return popular movies here!"})

    api_key = os.environ.get('tmdb_api_key')
    
    # TMDb Search Endpoint
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
                cover_image = f"https://image.tmdb.org/t/p/w500{poster_path}" if poster_path else None
                

                release_date = item.get("release_date", "")
                production_year = release_date.split("-")[0] if release_date else "N/A"
                

                movies.append({
                    "name": item.get("title"),
                    "production_year": production_year,
                    "rating": item.get("vote_average"), 
                    "cover_image": cover_image,
                    "overview": item.get("overview")
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
                cover_image = f"https://image.tmdb.org/t/p/w500{poster_path}" if poster_path else None
                
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