# Deployment Guide

Complete step-by-step guide for deploying the Expense Tracker to production.

---

## Architecture Overview

```
                    ┌─────────────┐
                    │   Browser   │
                    └──────┬──────┘
                           │
              ┌────────────┴────────────┐
              │                         │
      ┌───────▼───────┐       ┌────────▼────────┐
      │    Vercel      │       │     Render      │
      │  (Frontend)    │──────▶│   (Backend)     │
      │  React + Vite  │  API  │  Django + DRF   │
      └───────────────┘       └────────┬────────┘
                                       │
                              ┌────────▼────────┐
                              │  Neon/Supabase   │
                              │  (PostgreSQL)    │
                              └─────────────────┘
```

---

## Step 1: Deploy the Database

### Option A: Neon (Recommended)

1. Sign up at [neon.tech](https://neon.tech)
2. Click **New Project**
3. Set project name: `expense-tracker`
4. Choose region closest to your Render backend region
5. Copy the connection details:
   - Host: `ep-xxxxx.us-east-2.aws.neon.tech`
   - Database: `neondb`
   - User: `your_user`
   - Password: `your_password`

### Option B: Supabase

1. Sign up at [supabase.com](https://supabase.com)
2. Create new project: `expense-tracker`
3. Go to **Settings → Database**
4. Copy connection details from the **Connection string** section

### Verify Connection

```bash
psql "postgresql://user:password@host:5432/database?sslmode=require"
# Should connect successfully
\dt  # Should show no tables (empty database)
\q
```

---

## Step 2: Deploy the Backend (Render)

### 2.1 Prepare the Backend

Ensure these files exist:

**`backend/requirements.txt`** — already configured with all dependencies

**`backend/build.sh`** — create this file:

```bash
#!/usr/bin/env bash
set -o errexit

pip install -r requirements.txt
python manage.py collectstatic --noinput
python manage.py migrate
python manage.py seed_categories
```

Make it executable:
```bash
chmod +x backend/build.sh
```

### 2.1.1 OCR Runtime Requirement

Bill-photo scanning depends on the system Tesseract OCR binary, not just Python packages.

- Ubuntu / Debian: `apt-get install -y tesseract-ocr`
- Windows local development: install Tesseract OCR and add `C:\Program Files\Tesseract-OCR` to `PATH`

If Tesseract is missing, the rest of the backend still works, but `POST /api/transactions/scan-bill/` will return an OCR-installation error instead of scanning the uploaded bill image.

### 2.2 Create Render Web Service

1. Go to [render.com](https://render.com) → **New** → **Web Service**
2. Connect your GitHub repository
3. Configure:

| Setting | Value |
|---------|-------|
| **Name** | `expense-tracker-api` |
| **Region** | Same as your database |
| **Root Directory** | `backend` |
| **Runtime** | Python 3 |
| **Build Command** | `./build.sh` |
| **Start Command** | `gunicorn config.wsgi:application --bind 0.0.0.0:$PORT --workers 2` |
| **Plan** | Free |

### 2.3 Set Environment Variables on Render

| Variable | Value |
|----------|-------|
| `SECRET_KEY` | Generate with: `python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"` |
| `DEBUG` | `False` |
| `ALLOWED_HOSTS` | `expense-tracker-api.onrender.com,localhost` |
| `POSTGRES_DB` | Your cloud DB name |
| `POSTGRES_USER` | Your cloud DB user |
| `POSTGRES_PASSWORD` | Your cloud DB password |
| `POSTGRES_HOST` | Your cloud DB host |
| `POSTGRES_PORT` | `5432` |
| `FRONTEND_URL` | `https://expense-tracker-xxxx.vercel.app` (update after Vercel deploy) |
| `PYTHON_VERSION` | `3.11.9` |

### 2.4 Verify Backend Deployment

```bash
curl https://expense-tracker-api.onrender.com/health/
# Expected: {"status": "ok"}
```

For OCR-enabled environments, also verify that the scan route exists:

```bash
curl -X POST https://expense-tracker-api.onrender.com/api/transactions/scan-bill/
# Expected without auth: {"detail":"Authentication credentials were not provided."}
# Expected with auth but no file: {"detail":"Please upload a bill photo."}
```

---

## Step 3: Deploy the Frontend (Vercel)

### 3.1 Create Vercel Project

1. Go to [vercel.com](https://vercel.com) → **New Project**
2. Import your GitHub repository
3. Configure:

| Setting | Value |
|---------|-------|
| **Project Name** | `expense-tracker` |
| **Root Directory** | `frontend` |
| **Framework Preset** | Vite |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |

### 3.2 Set Environment Variables on Vercel

| Variable | Value |
|----------|-------|
| `VITE_API_URL` | `https://expense-tracker-api.onrender.com` |

### 3.3 Handle SPA Routing

Create `frontend/vercel.json`:

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/" }
  ]
}
```

### 3.4 Verify Frontend Deployment

Visit `https://expense-tracker-xxxx.vercel.app` — the app should load and show the login page.

---

## Step 4: Post-Deployment Configuration

### 4.1 Update CORS

After Vercel deploy, update the `FRONTEND_URL` env var on Render with the actual Vercel URL.

### 4.2 Create Production Superuser

```bash
# Using Render Shell (Dashboard → Shell tab)
python manage.py createsuperuser
```

### 4.3 Seed Production Data

```bash
# Should already run via build.sh, but verify:
python manage.py seed_categories
```

### 4.4 Verify End-to-End

1. Open the Vercel URL in a browser
2. Register a new account
3. Login with the new account
4. Add a transaction
5. Check the dashboard
6. Export a CSV report
7. If OCR is enabled on the host, upload a receipt through **Transactions -> Add Expense -> Scan Bill**

---

## Production Checklist

### Security

- [ ] `SECRET_KEY` is a strong random value (not `change-me`)
- [ ] `DEBUG` is set to `False`
- [ ] `ALLOWED_HOSTS` only contains production domains
- [ ] CORS is configured to allow only the frontend domain
- [ ] SSL is enforced on all connections
- [ ] Database credentials are not committed to git
- [ ] `.env` files are in `.gitignore`

### Performance

- [ ] Static files are collected (`collectstatic`)
- [ ] Gunicorn is configured with appropriate worker count
- [ ] Database connection pooling is enabled (Neon default)
- [ ] Frontend is built in production mode (`npm run build`)

### Reliability

- [ ] Health check endpoint responds correctly
- [ ] Database migrations have been applied
- [ ] Default categories are seeded
- [ ] Error logging is configured

### Monitoring

- [ ] Render dashboard shows service as running
- [ ] Vercel deployment shows as successful
- [ ] Database dashboard shows active connections

---

## Troubleshooting Production Issues

| Issue | Solution |
|-------|----------|
| CORS errors in browser console | Verify `FRONTEND_URL` on Render matches Vercel URL exactly |
| 500 errors on API | Check Render logs for Python tracebacks |
| Static files not loading | Run `collectstatic` and verify `whitenoise` is in middleware |
| Database connection timeout | Verify cloud DB credentials and check if IP whitelisting is needed |
| Frontend shows blank page | Check browser console for errors; verify `VITE_API_URL` is correct |
| Render free tier sleeps | First request after inactivity takes ~30s; consider paid plan |
| JWT token expired | Frontend should auto-refresh; check `SIMPLE_JWT` settings |

---

## Cost Estimate (Free Tier)

| Service | Free Tier Limits |
|---------|-----------------|
| **Vercel** | 100 GB bandwidth/month, unlimited deploys |
| **Render** | 750 hours/month, sleeps after 15 min inactivity |
| **Neon** | 0.5 GB storage, 1 compute unit |
| **Supabase** | 500 MB storage, 2 GB bandwidth |

> For a student/portfolio project, the free tiers of all services are more than sufficient.
