from django.urls import path
from .views import search_movies
from .views import start_movie_download
from .views import stream_movie,start_torrent_download







urlpatterns = [
    path('download',search_movies,name='search'),
    path('downloadx', start_movie_download, name="start_movie_download"),
    path('watch', stream_movie)
]