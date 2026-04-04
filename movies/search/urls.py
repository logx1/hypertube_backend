from django.urls import path

from .views import search
from .views import popular
from .views import movie_detail



urlpatterns = [
    path('', search, name='search'),
    path('popular', popular, name='popular'),
    path('movie_detail', movie_detail, name='movie_detail')
]