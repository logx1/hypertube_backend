from django.urls import path
from .views import search_movies
from .views import download_movie
from .views import stream_movie







urlpatterns = [
    path('download',search_movies,name='search'),
    path('downloadx', download_movie, name="start_movie_download"),
    path('watch', stream_movie)
]