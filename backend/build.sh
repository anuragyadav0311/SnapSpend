#!/usr/bin/env bash
# Render build script for the Django backend
# This script runs during each deployment on Render

set -o errexit  # Exit on any error

echo "==> Installing dependencies..."
pip install -r requirements.txt

if ! command -v tesseract >/dev/null 2>&1; then
  if command -v apt-get >/dev/null 2>&1; then
    echo "==> Tesseract not found. Attempting to install system OCR support..."
    apt-get update && apt-get install -y tesseract-ocr || echo "==> Warning: Tesseract install failed. Bill OCR will stay unavailable until the binary is installed."
  else
    echo "==> Warning: Tesseract OCR is not installed and no package manager is available in build.sh."
  fi
fi

echo "==> Collecting static files..."
python manage.py collectstatic --noinput

echo "==> Running database migrations..."
python manage.py migrate

echo "==> Seeding default categories..."
python manage.py seed_categories

echo "==> Build complete!"
