FROM python:3.12

WORKDIR /app

COPY . .

RUN pip install -r requirement.txt

WORKDIR /app/movies

CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]

# CMD ["uvicorn", "movies.asgi:application", "--host", "0.0.0.0", "--port", "8000"]

CMD ["uvicorn","movies.asgi:application","--host", "0.0.0.0","--port", "8000","--workers", "4", "--reload","--log-level", "info","--timeout-keep-alive", "30","--limit-concurrency", "100","--limit-max-requests", "1000"]

# CMD [
#   "uvicorn",
#   "movies.asgi:application",
#   "--host", "0.0.0.0",
#   "--port", "8000",
#   "--workers", "4",                # Number of worker processes
#   "--reload",                      # Enable auto-reload (for development)
#   "--log-level", "info",           # Log level: critical, error, warning, info, debug, trace
#   "--timeout-keep-alive", "30",    # Keep-alive timeout in seconds
#   "--limit-concurrency", "100",    # Max concurrent connections
#   "--limit-max-requests", "1000"   # Max requests per worker before restart
# ]