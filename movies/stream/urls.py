from django.urls import path
from .views import search_movies
from .views import start_movie_download

urlpatterns = [
    path('download',search_movies,name='test'),
    path('downloadx', start_movie_download, name="start_movie_download")
]