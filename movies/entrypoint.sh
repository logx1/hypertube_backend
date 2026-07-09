#!/bin/sh
set -e

# 1. Run migrations on startup
python manage.py makemigrations
python manage.py migrate

# 2. Start the daily cleanup loop in the background
(
    while true; do
        sleep 3600
        python manage.py cleanup_movies
    done
) &

# 3. Start your main application (Uvicorn CMD from Dockerfile)
exec "$@"