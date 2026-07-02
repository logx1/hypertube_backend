from django.db import models

# Create your models here.

class Movie(models.Model):
    movie_id = models.CharField(max_length=100, unique=True, primary_key=True)
    title = models.CharField(max_length=255)
    year = models.CharField(max_length=20, default="Unknown Year")
    overview = models.TextField(blank=True, default="")
    cover_image = models.URLField(max_length=500, blank=True, default="")