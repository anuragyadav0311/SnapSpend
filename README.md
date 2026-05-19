# SnapSpend

A full-stack personal finance tracker built with React, Django REST Framework, and PostgreSQL/SQLite. The app supports authentication, transactions, categories, monthly budgets, dashboard analytics, report exports, and **ML-powered anomaly detection** for suspicious transactions.

## Features

### Authentication
- Register with name, email, and password
- Login with JWT access and refresh tokens
- Refresh tokens
- View and update profile details
- Change password
- Logout with refresh token blacklisting

### Transactions and Categories
- Create, edit, delete, and list transactions
- Support income and expense transaction types
- Default system categories plus custom user categories
- Filter by type, category, date range, and month
- Search by title, note, or category name
- Sort by newest, oldest, highest, and lowest amount
- Bill photo scanning with OCR to auto-fill transaction details

### ML Anomaly Detection
- Isolation Forest model trained on user's transaction history
- Automatic flagging of suspicious transactions on creation
- Statistical z-score fallback when fewer than 10 transactions exist
- Bill-photo verification flow for flagged transactions using OCR
- Anomaly detection dashboard panel with scores and reasons
- "ML Flagged" badges on suspicious transactions in the UI

### Budgets and Dashboard
- Create monthly budgets
- Track spent, remaining, and progress percentage
- Show healthy, near-limit, and exceeded states
- Dashboard totals for income, expense, and balance
- Current-month summary, category breakdown, trend data, and recent transactions
- ML anomaly alerts panel on the dashboard

### Reports and Export
- Monthly reports
- Category summary reports
- CSV export
- Excel export with `openpyxl`
- PDF export with `reportlab`

## Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend | React 19, Vite, Axios, Recharts |
| Backend | Django 5.2, Django REST Framework, SimpleJWT |
| ML | scikit-learn (Isolation Forest), joblib |
| Database | PostgreSQL (production) / SQLite (development) |
| OCR | Tesseract OCR, Pillow |
| Export | CSV, openpyxl, reportlab |

## Project Structure

```text
snapspend/
├── backend/
│   ├── apps/
│   │   ├── accounts/        # User auth, JWT, profile
│   │   ├── budgets/         # Monthly budgets
│   │   ├── reports/         # Dashboard, exports
│   │   └── transactions/    # Transactions, categories, OCR, verification
│   ├── config/              # Django settings, URLs
│   ├── ml/                  # ML anomaly detection module
│   │   ├── anomaly_detector.py
│   │   └── preprocess_income_expense_dataset.py
│   ├── manage.py
│   └── requirements.txt
├── dataset/                 # Sample income/expense dataset
├── database/                # DB docs, seeds, schema notes
├── frontend/
│   ├── public/
│   └── src/
│       ├── components/      # Shared UI components
│       ├── context/         # Auth and theme context
│       ├── pages/           # Dashboard, Transactions, Budgets, etc.
│       ├── services/        # API service layer
│       ├── styles/          # Theme and global styles
│       └── utils/           # Helpers and utilities
├── CONTRIBUTING.md
├── plan.md
└── README.md
```

## Prerequisites

- **Python 3.11+**
- **Node.js 18+** and npm
- **Tesseract OCR** (required for bill scanning and anomaly verification)

Install Tesseract on Ubuntu/Debian:

```bash
sudo apt install tesseract-ocr
```

## How to Run

### 1. Clone the Repository

```bash
git clone <repository-url>
cd snapspend
```

### 2. Backend Setup

```bash
cd backend

# Create and activate virtual environment
python -m venv .venv
source .venv/bin/activate        # Linux/macOS
# .venv\Scripts\activate         # Windows

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
```

Edit the `.env` file to configure your environment. For **local development with SQLite** (no PostgreSQL needed), add:

```env
DATABASE_ENGINE=sqlite
SQLITE_NAME=db.sqlite3
```

For **PostgreSQL**, keep the default settings and update the credentials:

```env
DATABASE_ENGINE=postgres
POSTGRES_DB=expense_tracker
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_password
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
```

For **cloud PostgreSQL** on platforms like Render, Neon, Supabase, or Railway, you can use a single connection string instead:

```env
DATABASE_URL=postgresql://user:password@host:5432/database?sslmode=require
DEBUG=False
ALLOWED_HOSTS=your-backend-domain.onrender.com
FRONTEND_URLS=https://your-frontend-domain.vercel.app
```

Then run migrations and start the server:

```bash
# Run database migrations
python manage.py migrate

# Seed default categories (optional but recommended)
python manage.py seed_categories

# Start the backend server
python manage.py runserver
```

The backend runs at **http://localhost:8000**.

### 3. Frontend Setup

Open a new terminal:

```bash
cd frontend

# Install dependencies
npm install

# Start the dev server
npm run dev
```

The frontend runs at **http://localhost:5173**.

### 4. Frontend-Only Mode (No Backend)

If you want to run the frontend without a backend (uses local storage for demo data), create a `.env` file in the `frontend/` directory:

```env
VITE_FRONTEND_ONLY=true
```

> **Note:** ML anomaly detection, bill scanning, and OCR verification require the backend to be running.

### Environment Variables Reference

#### Backend (`backend/.env`)

| Variable | Default | Description |
| --- | --- | --- |
| `SECRET_KEY` | `change-me` | Django secret key (change in production) |
| `DEBUG` | `True` | Django debug mode |
| `ALLOWED_HOSTS` | `127.0.0.1,localhost` | Comma-separated allowed hosts |
| `DATABASE_URL` | empty | Full database connection string. Takes priority over the split PostgreSQL variables below. |
| `DATABASE_ENGINE` | `postgres` | `postgres` or `sqlite` |
| `SQLITE_NAME` | `db.sqlite3` | SQLite file name (when using sqlite engine) |
| `POSTGRES_DB` | `expense_tracker` | PostgreSQL database name |
| `POSTGRES_USER` | `postgres` | PostgreSQL user |
| `POSTGRES_PASSWORD` | `postgres` | PostgreSQL password |
| `POSTGRES_HOST` | `localhost` | PostgreSQL host |
| `POSTGRES_PORT` | `5432` | PostgreSQL port |
| `POSTGRES_SSL_REQUIRE` | `False` in debug, `True` in production | Force SSL for PostgreSQL connections |
| `FRONTEND_URL` | `http://localhost:5173` | Frontend URL for CORS |
| `FRONTEND_URLS` | same as above | Comma-separated frontend URLs for CORS |
| `GOOGLE_OAUTH_CLIENT_ID` | empty | Google OAuth client ID for Sign in with Google |
| `GOOGLE_OAUTH_CLIENT_SECRET` | empty | Google OAuth client secret |
| `GOOGLE_OAUTH_REDIRECT_URI` | empty | Backend callback URI registered with Google, for example `http://localhost:8000/api/auth/oauth/google/callback/` |
| `FIREBASE_PROJECT_ID` | empty | Firebase project ID used to verify Google sign-in ID tokens |
| `FIREBASE_PROJECT_NUMBER` | empty | Optional Firebase project number accepted as a token audience |
| `APPLE_OAUTH_CLIENT_ID` | empty | Apple Services ID / client ID |
| `APPLE_OAUTH_TEAM_ID` | empty | Apple Developer team ID |
| `APPLE_OAUTH_KEY_ID` | empty | Apple Sign in key ID |
| `APPLE_OAUTH_PRIVATE_KEY` | empty | Apple private key PEM, with newlines escaped as `\\n` in `.env` |
| `APPLE_OAUTH_REDIRECT_URI` | empty | Backend callback URI registered with Apple |
| `OAUTH_FRONTEND_CALLBACK_PATH` | `/auth/callback` | Frontend route that completes provider sign-in |
| `DJANGO_LOG_LEVEL` | `INFO` | Root/Django console log level |

> Note: Apple requires an HTTPS redirect URI on a real domain for web Sign in with Apple. `localhost` and raw IP callback URLs are not accepted by Apple.

#### Frontend (`frontend/.env`)

| Variable | Default | Description |
| --- | --- | --- |
| `VITE_API_URL` | `http://localhost:8000/api` | Backend API base URL |
| `VITE_FRONTEND_ONLY` | `false` | Set to `true` for offline demo mode |
| `VITE_FIREBASE_API_KEY` | empty | Firebase web app API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | empty | Firebase auth domain, for example `your-project.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | empty | Firebase project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | empty | Firebase storage bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | empty | Firebase messaging sender ID |
| `VITE_FIREBASE_APP_ID` | empty | Firebase web app ID |

## Deployment

Use [database/deployment.md](/c:/Projects/SnapSpend/snapspend/database/deployment.md) for the full production walkthrough. The backend now supports both a `Procfile`-based Gunicorn startup command and a single `DATABASE_URL`, which makes deployment on common PaaS providers much smoother.

## Main API Endpoints

### Authentication
- `POST /api/auth/register/`
- `POST /api/auth/login/`
- `POST /api/auth/firebase/google/`
- `POST /api/auth/refresh/`
- `GET /api/auth/me/`
- `PUT /api/auth/me/`
- `PUT /api/auth/change-password/`
- `POST /api/auth/logout/`

### Categories and Transactions
- `GET /api/categories/`
- `POST /api/categories/`
- `PUT /api/categories/{id}/`
- `DELETE /api/categories/{id}/`
- `GET /api/transactions/`
- `POST /api/transactions/` — creates transaction; returns `202` if ML flags it as anomalous
- `GET /api/transactions/{id}/`
- `PUT /api/transactions/{id}/`
- `DELETE /api/transactions/{id}/`

### ML Anomaly Detection
- `GET /api/transactions/anomalies/` — list ML-detected suspicious transactions
- `POST /api/transactions/verify/` — verify a flagged transaction with a bill photo
- `POST /api/transactions/scan-bill/` — scan a bill photo to auto-fill transaction fields

### Budgets
- `GET /api/budgets/`
- `POST /api/budgets/`
- `PUT /api/budgets/{id}/`

### Reports and Export
- `GET /api/reports/dashboard/`
- `GET /api/reports/monthly/`
- `GET /api/reports/category-summary/`
- `GET /api/reports/export/csv/`
- `GET /api/reports/export/xlsx/`
- `GET /api/reports/export/pdf/`

### Utility
- `GET /health/`

## Testing

### Backend

```bash
cd backend
source .venv/bin/activate
python manage.py test
```

### Frontend

```bash
cd frontend
npm run build
```

## Documentation

- Database setup: [database/setup.md](database/setup.md)
- QA checklist: [database/qa_checklist.md](database/qa_checklist.md)
- Deployment notes: [database/deployment.md](database/deployment.md)
- ML module docs: [backend/ml/README.md](backend/ml/README.md)
- Team plan: [plan.md](plan.md)
