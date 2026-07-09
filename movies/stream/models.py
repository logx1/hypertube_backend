from django.db import models
import uuid

# Create your models here.

class Movie(models.Model):
    movie_id = models.CharField(max_length=100, unique=True, primary_key=True)
    identifier = models.CharField(max_length=250)
    path = models.CharField(max_length=355)
    torrent_url = models.CharField(max_length=455)
    completed = models.BooleanField(default=False)
    geted_at = models.DateTimeField(auto_now_add=True)



# class Movie(models.Model):
#     movie_id = models.CharField(max_length=100, unique=True, primary_key=True)
#     title = models.CharField(max_length=255)
#     year = models.CharField(max_length=20, default="Unknown Year")
#     overview = models.TextField(blank=True, default="")
#     cover_image = models.URLField(max_length=500, blank=True, default="")
#     identifier = models.CharField(max_length=250)
#     path = models.CharField(max_length=355)
#     torrent_url = models.CharField(max_length=455)
    
#user_name comment movie_id

class comments(models.Model):
    # This will automatically generate a unique 36-character string ID
    comment_id = models.CharField(
        max_length=100, 
        primary_key=True, 
        default=uuid.uuid4, 
        editable=False
    )
    movie_id = models.CharField(max_length=250)
    comments = models.CharField(max_length=455)
    user_name = models.CharField(max_length=250)
    created_at = models.DateTimeField(auto_now_add=True)
