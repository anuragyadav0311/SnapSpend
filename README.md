# 💰 Expense Tracker

A full-stack personal finance management platform built with **React**, **Django REST Framework**, and **PostgreSQL**. Track income and expenses, organize by categories, set monthly budgets, view analytics dashboards, and export reports.

---

## ✨ Features

### 🔐 Authentication
- Secure registration and login with email
- JWT-based authentication with token refresh
- Profile management and password change
- Protected routes on frontend

### 💸 Transaction Management
- Add, edit, and delete income and expense records
- Organize transactions by categories
- Filter by type, category, and date range
- Search by title or note
- Sort by date or amount

### 📁 Categories
- 20 built-in default categories (6 income, 14 expense)
- Create custom categories per user
- Separate income and expense category types

### 📊 Budget Tracking
- Set monthly spending limits
- Real-time remaining budget calculation
- Near-limit warning (≥80% spent)
- Exceeded-budget alerts (>100% spent)

### 📈 Dashboard Analytics
- Total income, expense, and current balance
- Current month summary cards
- Recent transactions list
- Category breakdown pie chart
- Monthly trend line chart

### 📋 Reports & Export
- Monthly income/expense reports
- Category-wise spending summary
- Export transactions to:
  - **CSV** — UTF-8 encoded spreadsheet
  - **Excel (.xlsx)** — Formatted with summary totals
  - **PDF** — Printable A4 report with charts

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, Vite, Tailwind CSS, Axios, Recharts |
| **Backend** | Django 5.2, Django REST Framework, SimpleJWT |
| **Database** | PostgreSQL |
| **Export** | openpyxl (Excel), reportlab (PDF), csv (CSV) |
| **Deployment** | Vercel (frontend), Render (backend), Neon/Supabase (database) |

---

## 📂 Project Structure

```
expense-tracker/
├── frontend/                    # React + Vite client
│   ├── public/
│   ├── src/
│   │   ├── components/          # Reusable UI components
│   │   ├── context/             # React context (auth, theme)
│   │   ├── hooks/               # Custom React hooks
│   │   ├── pages/               # Page components
│   │   ├── services/            # API service layer (Axios)
│   │   └── utils/               # Helper utilities
│   ├── .env.example
│   ├── package.json
│   └── vite.config.js
│
├── backend/                     # Django + DRF API
│   ├── config/                  # Django project settings
│   │   ├── settings.py
│   │   ├── urls.py
│   │   ├── wsgi.py
│   │   └── asgi.py
│   ├── apps/
│   │   ├── accounts/            # User model, auth APIs
│   │   ├── transactions/        # Category & transaction CRUD
│   │   ├── budgets/             # Monthly budget management
│   │   └── reports/             # Dashboard, reports, exports
│   ├── requirements.txt
│   ├── manage.py
│   └── .env.example
│
├── database/                    # DB documentation & support
│   ├── schema_notes/            # ER diagram, data dictionary
│   ├── seeds/                   # Default categories, sample data
│   ├── sample_exports/          # Reference export files for QA
│   └── setup.md                 # PostgreSQL setup guide
│
├── README.md
└── plan.md                      # Team implementation plan
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18 and **npm** ≥ 9
- **Python** ≥ 3.11
- **PostgreSQL** ≥ 15 (local or cloud)
- **Git**

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/expense-tracker.git
cd expense-tracker
```

### 2. Set Up the Database

Follow the [Database Setup Guide](database/setup.md) for detailed instructions.

**Quick local setup:**

```bash
sudo -u postgres psql -c "CREATE DATABASE expense_tracker;"
sudo -u postgres psql -c "CREATE USER expense_user WITH PASSWORD 'your_password';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE expense_tracker TO expense_user;"
```

### 3. Set Up the Backend

```bash
cd backend/

# Create and activate a virtual environment
python -m venv venv
source venv/bin/activate        # Linux/macOS
# venv\Scripts\activate         # Windows

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
cp .env.example .env
# Edit .env with your database credentials and a secure SECRET_KEY

# Run migrations
python manage.py makemigrations
python manage.py migrate

# Seed default categories
python manage.py seed_categories

# Create a superuser (for admin panel)
python manage.py createsuperuser

# Start the development server
python manage.py runserver
```

The backend API will be available at `http://localhost:8000`.

### 4. Set Up the Frontend

```bash
cd frontend/

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
# Edit .env if the backend URL differs from default

# Start the development server
npm run dev
```

The frontend will be available at `http://localhost:5173`.

---

## 🔌 API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/register/` | Register a new user |
| `POST` | `/api/auth/login/` | Login and get JWT tokens |
| `POST` | `/api/auth/refresh/` | Refresh access token |
| `GET` | `/api/auth/me/` | Get current user profile |
| `PUT` | `/api/auth/me/` | Update user profile |
| `PUT` | `/api/auth/change-password/` | Change password |

### Categories

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/categories/` | List all categories (defaults + custom) |
| `POST` | `/api/categories/` | Create a custom category |
| `PUT` | `/api/categories/{id}/` | Update a custom category |
| `DELETE` | `/api/categories/{id}/` | Delete a custom category |

### Transactions

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/transactions/` | List transactions (with filters) |
| `POST` | `/api/transactions/` | Create a transaction |
| `GET` | `/api/transactions/{id}/` | Get transaction detail |
| `PUT` | `/api/transactions/{id}/` | Update a transaction |
| `DELETE` | `/api/transactions/{id}/` | Delete a transaction |

**Query Parameters:** `type`, `category`, `start_date`, `end_date`, `search`, `ordering`

### Budgets

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/budgets/` | List all budgets |
| `POST` | `/api/budgets/` | Create a monthly budget |
| `PUT` | `/api/budgets/{id}/` | Update a budget |

### Reports & Export

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/reports/dashboard/` | Dashboard summary data |
| `GET` | `/api/reports/monthly/` | Monthly income/expense report |
| `GET` | `/api/reports/category-summary/` | Category-wise breakdown |
| `GET` | `/api/reports/export/csv/` | Download transactions as CSV |
| `GET` | `/api/reports/export/xlsx/` | Download transactions as Excel |
| `GET` | `/api/reports/export/pdf/` | Download transactions as PDF |

### Utility

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health/` | Health check (no auth required) |

---

## 🧪 Testing

### Backend Tests

```bash
cd backend/
python manage.py test
```

### Frontend

```bash
cd frontend/
npm run build          # Validate production build
```

### Manual QA Checklist

See the full [Test Plan](plan.md#test-plan) for the detailed checklist covering:

- ✅ Registration and login flows
- ✅ Token persistence and refresh
- ✅ CRUD operations for transactions and categories
- ✅ Budget warning display
- ✅ Dashboard chart rendering
- ✅ Export file downloads (CSV, XLSX, PDF)
- ✅ Data isolation between users
- ✅ Responsive UI on mobile/tablet

---

## 🌐 Deployment

### Frontend → Vercel

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) → Import project
3. Set **Root Directory** to `frontend`
4. Set **Build Command** to `npm run build`
5. Set **Output Directory** to `dist`
6. Add environment variable:
   - `VITE_API_URL` = your deployed backend URL

### Backend → Render

1. Go to [render.com](https://render.com) → New Web Service
2. Connect your GitHub repo
3. Set **Root Directory** to `backend`
4. Set **Build Command** to:
   ```bash
   pip install -r requirements.txt && python manage.py collectstatic --noinput && python manage.py migrate
   ```
5. Set **Start Command** to:
   ```bash
   gunicorn config.wsgi:application --bind 0.0.0.0:$PORT
   ```
6. Add environment variables:
   - `SECRET_KEY` — a strong random string
   - `DEBUG` — `False`
   - `ALLOWED_HOSTS` — your Render domain
   - `POSTGRES_*` — your cloud PostgreSQL credentials
   - `FRONTEND_URL` — your Vercel frontend URL

### Database → Neon / Supabase

See the [Database Setup Guide](database/setup.md) for cloud provider configuration.

---

## 🛡️ Environment Variables

### Backend (`backend/.env`)

| Variable | Description | Example |
|----------|-------------|---------|
| `SECRET_KEY` | Django secret key | `your-random-secret-key` |
| `DEBUG` | Debug mode | `True` / `False` |
| `ALLOWED_HOSTS` | Comma-separated hosts | `127.0.0.1,localhost` |
| `POSTGRES_DB` | Database name | `expense_tracker` |
| `POSTGRES_USER` | Database user | `expense_user` |
| `POSTGRES_PASSWORD` | Database password | `your_password` |
| `POSTGRES_HOST` | Database host | `localhost` |
| `POSTGRES_PORT` | Database port | `5432` |
| `FRONTEND_URL` | Frontend URL for CORS | `http://localhost:5173` |

### Frontend (`frontend/.env`)

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API base URL | `http://localhost:8000` |

---

## 👥 Team

| Member | Responsibility | Branch |
|--------|---------------|--------|
| Member 1 | Backend core, auth, JWT, deployment config | `feature/backend-auth-core` |
| Member 2 | Transactions, budgets, reports, export APIs | `feature/backend-finance` |
| Member 3 | Frontend UI, pages, components, services | `feature/frontend-ui` |
| Member 4 | Database docs, seeds, QA, README, deployment | `feature/database-docs-deploy` |

---

## 📝 Git Workflow

1. Pull latest `main`
2. Create your feature branch
3. Commit and push to your branch
4. Open a Pull Request
5. Get teammate review
6. Merge after verification

> ⚠️ **Never push directly to `main`**

---

## 📄 License

This project is for educational purposes.
