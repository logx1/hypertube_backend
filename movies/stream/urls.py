from django.urls import path
from .views import search_movies
from .views import download_movie
from .views import stream_movie
from .views import download_status
from .comments import comments_view







urlpatterns = [
    path('torrent_search',search_movies,name='search'),
    path('downloadx', download_movie, name="start_movie_download"),
    path('watch', stream_movie),
    path('download_status',download_status),
    path('comments',comments_view)
]