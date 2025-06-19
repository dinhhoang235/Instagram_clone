#!/bin/bash
set -e

# Wait for MySQL to be ready
echo "Waiting for MySQL..."
while ! nc -z db 3306; do
  sleep 1
done
echo "MySQL started"

echo "Making database migrations..."
python manage.py makemigrations

echo "Applying database migrate..."
python manage.py migrate

echo "Collecting static files..."
python manage.py collectstatic --noinput

if [ -f setup_project.py ]; then
  echo "Running setup script..."
  python setup_project.py
fi

echo "Starting Daphne server..."
exec daphne backend.asgi:application --bind 0.0.0.0 --port 8000
