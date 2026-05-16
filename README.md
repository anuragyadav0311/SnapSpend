# Expense Tracker

A full-stack personal finance tracker built with React, Django REST Framework, and PostgreSQL. The app supports authentication, transactions, categories, monthly budgets, dashboard analytics, and report exports.

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

### Budgets and Dashboard
- Create monthly budgets
- Track spent, remaining, and progress percentage
- Show healthy, near-limit, and exceeded states
- Dashboard totals for income, expense, and balance
- Current-month summary, category breakdown, trend data, and recent transactions

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
| Database | PostgreSQL |
| Export | CSV, openpyxl, reportlab |

## Project Structure

```text
expense-tracker/
|-- backend/
|   |-- apps/
|   |   |-- accounts/
|   |   |-- budgets/
|   |   |-- reports/
|   |   `-- transactions/
|   |-- config/
|   |-- manage.py
|   `-- requirements.txt
|-- database/
|   |-- qa_checklist.md
|   |-- sample_exports/
|   |-- schema_notes/
|   |-- seeds/
|   `-- setup.md
|-- frontend/
|   |-- public/
|   |-- src/
|   |   |-- components/
|   |   |-- context/
|   |   |-- pages/
|   |   |-- services/
|   |   |-- styles/
|   |   `-- utils/
|   `-- package.json
|-- CONTRIBUTING.md
|-- plan.md
`-- README.md
```

## Local Setup

### Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
python manage.py migrate
python manage.py seed_categories
python manage.py runserver
```

The backend runs at `http://localhost:8000`.

Bill-photo scanning uses the system Tesseract OCR binary. Install it before using OCR locally:

```bash
sudo apt install tesseract-ocr
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend runs at `http://localhost:5173`.

## Main API Endpoints

### Authentication
- `POST /api/auth/register/`
- `POST /api/auth/login/`
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
- `POST /api/transactions/`
- `GET /api/transactions/{id}/`
- `PUT /api/transactions/{id}/`
- `DELETE /api/transactions/{id}/`

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
- Team plan: [plan.md](plan.md)
