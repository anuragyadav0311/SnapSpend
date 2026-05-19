# Deployment Guide

Production deployment guide for the SnapSpend stack.

## Architecture

- Frontend: Vite/React app deployed to Vercel or another static host
- Backend: Django REST API deployed to Render, Railway, Fly.io, or a similar Python host
- Database: Managed PostgreSQL such as Neon, Supabase, Railway Postgres, or Render Postgres

## Backend Prep

The backend is already set up for production with:

- `gunicorn` for the web server
- `whitenoise` for static file serving
- `build.sh` for install, checks, migrations, seeding, and static collection
- `Procfile` for platforms that expect a process definition
- environment-driven Django settings
- `DATABASE_URL` support for cloud-hosted PostgreSQL

### Included Build Script

```bash
#!/usr/bin/env bash
set -o errexit

pip install -r requirements.txt
python manage.py check --deploy
python manage.py collectstatic --noinput
python manage.py migrate
python manage.py seed_categories
```

### Included Procfile

```procfile
web: gunicorn config.wsgi:application --bind 0.0.0.0:${PORT:-8000} --workers ${WEB_CONCURRENCY:-2} --log-file -
```

## Step 1: Provision PostgreSQL

Use any managed PostgreSQL provider. Prefer copying the full connection string if the provider exposes one.

Example:

```text
postgresql://user:password@host:5432/database?sslmode=require
```

If your provider does not expose a single URL, keep the individual values for:

- `POSTGRES_DB`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `POSTGRES_HOST`
- `POSTGRES_PORT`

## Step 2: Deploy the Backend

Recommended Render settings:

| Setting | Value |
| --- | --- |
| Name | `snapspend-api` |
| Root Directory | `backend` |
| Runtime | `Python 3` |
| Build Command | `./build.sh` |
| Start Command | `gunicorn config.wsgi:application --bind 0.0.0.0:$PORT --workers 2 --log-file -` |

### Required Backend Environment Variables

| Variable | Example |
| --- | --- |
| `SECRET_KEY` | generated Django secret |
| `DEBUG` | `False` |
| `ALLOWED_HOSTS` | `snapspend-api.onrender.com` |
| `FRONTEND_URLS` | `https://snapspend.vercel.app` |
| `DJANGO_LOG_LEVEL` | `INFO` |
| `WEB_CONCURRENCY` | `2` |

### Database Configuration Options

Preferred option:

| Variable | Example |
| --- | --- |
| `DATABASE_URL` | `postgresql://user:password@host:5432/database?sslmode=require` |
| `POSTGRES_SSL_REQUIRE` | `True` |

Fallback option:

| Variable | Example |
| --- | --- |
| `DATABASE_ENGINE` | `postgres` |
| `POSTGRES_DB` | your database name |
| `POSTGRES_USER` | your database user |
| `POSTGRES_PASSWORD` | your database password |
| `POSTGRES_HOST` | your database host |
| `POSTGRES_PORT` | `5432` |
| `POSTGRES_SSL_REQUIRE` | `True` |

### Optional OAuth Variables

Set these only if you are enabling those flows in production:

- `GOOGLE_OAUTH_CLIENT_ID`
- `GOOGLE_OAUTH_CLIENT_SECRET`
- `GOOGLE_OAUTH_REDIRECT_URI`
- `FIREBASE_PROJECT_ID`
- `FIREBASE_PROJECT_NUMBER`
- `APPLE_OAUTH_CLIENT_ID`
- `APPLE_OAUTH_TEAM_ID`
- `APPLE_OAUTH_KEY_ID`
- `APPLE_OAUTH_PRIVATE_KEY`
- `APPLE_OAUTH_REDIRECT_URI`

### Backend Verification

After deploy, confirm the service is healthy:

```bash
curl https://snapspend-api.onrender.com/health/
```

Expected response:

```json
{"status":"ok"}
```

## Step 3: Deploy the Frontend

Recommended Vercel settings:

| Setting | Value |
| --- | --- |
| Root Directory | `frontend` |
| Framework Preset | `Vite` |
| Build Command | `npm run build` |
| Output Directory | `dist` |

### Frontend Environment Variables

| Variable | Example |
| --- | --- |
| `VITE_API_URL` | `https://snapspend-api.onrender.com` |
| `VITE_FRONTEND_ONLY` | `false` |
| `VITE_FIREBASE_API_KEY` | Firebase web app API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | `your-project.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | Firebase project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase storage bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase sender ID |
| `VITE_FIREBASE_APP_ID` | Firebase app ID |

The frontend already includes `vercel.json` for SPA rewrites.

## Step 4: Final Production Checks

- Open the frontend URL and confirm the login page loads
- Register a user and confirm the backend responds
- Create a transaction and confirm dashboard data updates
- Export a CSV or PDF report
- Verify backend logs are visible in your hosting platform
- Confirm static files load correctly

## Production Checklist

- `SECRET_KEY` is not the default value
- `DEBUG=False`
- `ALLOWED_HOSTS` contains only real backend domains
- `FRONTEND_URLS` contains only trusted frontend origins
- `DATABASE_URL` or PostgreSQL env vars point to managed PostgreSQL
- `POSTGRES_SSL_REQUIRE=True` in production
- `/health/` returns `{"status":"ok"}`
- migrations run successfully
- `collectstatic` succeeds
- frontend build succeeds

## Troubleshooting

| Issue | What to check |
| --- | --- |
| CORS errors | `FRONTEND_URLS` exactly matches the deployed frontend origin |
| Backend boot failure | required env vars, `SECRET_KEY`, and database connectivity |
| Static files missing | `whitenoise` is enabled and `collectstatic` completed |
| Database connection errors | `DATABASE_URL`, SSL settings, provider allowlist/network settings |
| Blank frontend page | `VITE_API_URL`, browser console, and Vercel build logs |
