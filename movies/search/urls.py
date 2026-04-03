from django.urls import path

from .views import search
from .views import popular



urlpatterns = [
    path('', search, name='search'),
    path('popular', popular, name='popular'),
]