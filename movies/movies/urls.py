"""
URL configuration for movies project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import include, path
# movie_detail
from stream.views import movie_details,delete_movie_by_identifier


urlpatterns = [
    path('admin/', admin.site.urls),
    path('search/', include('search.urls'), name='search'),
    path('stream/', include('stream.urls'), name='stream'),
    path("movies", movie_details, name="get_movie_by_id"),
    path("movies/delete", delete_movie_by_identifier, name="delete_movie_by_identifier")
]
