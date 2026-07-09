import os
import shutil  # 👈 Added to handle folder deletion
from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from stream.models import Movie  

class Command(BaseCommand):
    help = 'Deletes movies and their parent directories if they haven\'t been streamed in a specified time.'

    def handle(self, *args, **options):
        CLEANUP_DAYS = 30     
        CLEANUP_HOURS = 0     
        CLEANUP_MINUTES = 0   
        CLEANUP_SECONDS = 0 

        time_threshold = timezone.now() - timedelta(
            days=CLEANUP_DAYS, 
            hours=CLEANUP_HOURS, 
            minutes=CLEANUP_MINUTES, 
            seconds=CLEANUP_SECONDS
        )
        
        expired_movies = Movie.objects.filter(geted_at__lt=time_threshold)
        
        count = 0
        for movie in expired_movies:
            if movie.path:
                
                parts = movie.path.split('/')
                if 'movies_cache' in parts:
                    idx = parts.index('movies_cache')
                    if idx + 1 < len(parts):
                        target_dir = '/'.join(parts[:idx + 2])
                        
                        if os.path.exists(target_dir) and 'tt' in parts[idx + 1]:
                            try:
                                shutil.rmtree(target_dir)
                                self.stdout.write(self.style.SUCCESS(f"Deleted movie directory: {target_dir}"))
                            except Exception as e:
                                self.stdout.write(self.style.ERROR(f"Failed to delete directory {target_dir}: {e}"))
                        else:
                            if os.path.exists(movie.path):
                                os.remove(movie.path)
            
            movie.delete()
            count += 1
            
        self.stdout.write(self.style.SUCCESS(f"Successfully cleaned up {count} expired movies."))