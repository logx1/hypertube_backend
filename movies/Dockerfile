FROM python:3.12

WORKDIR /app

COPY . .

RUN pip install -r requirement.txt

WORKDIR /app/movies

CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]