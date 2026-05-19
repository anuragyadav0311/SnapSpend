#!/usr/bin/env bash
# Render build script for the Django backend
# This script runs during each deployment on Render

set -o errexit  # Exit on any error

echo "==> Installing dependencies..."
pip install -r requirements.txt

echo "==> Collecting static files..."
python manage.py collectstatic --noinput

echo "==> Running database migrations..."
python manage.py migrate

echo "==> Seeding default categories..."
python manage.py seed_categories

echo "==> Build complete!"
