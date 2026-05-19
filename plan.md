# SnapSpend Team Plan

## Project Summary

We will build the project as a **3-tier separated application**:

- `frontend/`: React + Vite client
- `backend/`: Django + Django REST Framework API
- `database/`: PostgreSQL setup docs, seed scripts, schema notes, and export samples

This structure is chosen so that all 4 teammates can work **simultaneously** with minimum overlap:

- frontend team can work independently on UI
- backend team can work independently on APIs
- database/docs/deployment work can happen in parallel

The final app is a personal finance platform where a user can:

- register and login securely
- manage income and expenses
- organize records by category
- set monthly budgets
- view dashboard analytics
- generate reports
- export reports as `CSV`, `Excel (.xlsx)`, and `PDF`

## Final Tech Stack

### Frontend

- React
- Vite
- Tailwind CSS
- Axios
- Recharts

### Backend

- Django
- Django REST Framework
- django-cors-headers
- djangorestframework-simplejwt

### Database

- PostgreSQL

### Reporting / Export

- CSV via Python standard library
- Excel export via `openpyxl`
- PDF export via `reportlab` or `WeasyPrint`

### Deployment

- Frontend: Vercel
- Backend: Render
- Database: Neon or Supabase PostgreSQL

## Fixed Rules For The Team

- Do not switch frameworks again
- Do not mix Flask, FastAPI, and Django
- Use React only for the frontend
- Use Django API only for the backend
- Frontend must consume backend via APIs only
- Use PostgreSQL from the beginning
- Create the custom Django user model before first migration
- No one pushes directly to `main`

## Final Folder Structure

```text
snapspend/
|-- frontend/
|   |-- public/
|   |-- src/
|   |   |-- components/
|   |   |-- context/
|   |   |-- hooks/
|   |   |-- pages/
|   |   |-- services/
|   |   `-- utils/
|   |-- .env.example
|   |-- package.json
|   `-- vite.config.js
|-- backend/
|   |-- config/
|   |-- apps/
|   |   |-- accounts/
|   |   |-- transactions/
|   |   |-- budgets/
|   |   `-- reports/
|   |-- requirements.txt
|   |-- manage.py
|   `-- .env.example
|-- database/
|   |-- seeds/
|   |-- schema_notes/
|   |-- sample_exports/
|   `-- setup.md
|-- README.md
`-- plan.md
```

## Core Features

### Authentication

- register
- login
- logout
- token refresh
- profile fetch/update
- password change

### Transactions

- add income
- add expense
- edit transaction
- delete transaction
- list transactions
- filter by type, category, date range
- search by title/note
- sort by newest, oldest, highest, lowest

### Categories

- default categories
- custom categories per user
- category type: `income` or `expense`

### Budgets

- monthly budget creation
- monthly budget update
- current-month spending calculation
- remaining budget calculation
- near-limit warning
- exceeded-budget warning

### Dashboard

- total income
- total expense
- current balance
- current month summary
- recent transactions
- category breakdown chart
- monthly trend chart

### Reports

- monthly report
- category-wise report
- income vs expense summary
- filtered report generation
- export to:
  - CSV
  - Excel (`.xlsx`)
  - PDF

## Data Model

### User

- id
- name
- email
- password
- created_at
- updated_at

### Category

- id
- user nullable for system defaults
- name
- type: `income` or `expense`
- created_at

### Transaction

- id
- user
- type: `income` or `expense`
- amount
- category
- title
- note
- date
- optional receipt
- created_at
- updated_at

### Budget

- id
- user
- month
- limit_amount
- created_at
- updated_at

## Backend API Contract

### Auth

- `POST /api/auth/register/`
- `POST /api/auth/login/`
- `POST /api/auth/refresh/`
- `GET /api/auth/me/`
- `PUT /api/auth/me/`
- `PUT /api/auth/change-password/`

### Categories

- `GET /api/categories/`
- `POST /api/categories/`
- `PUT /api/categories/{id}/`
- `DELETE /api/categories/{id}/`

### Transactions

- `GET /api/transactions/`
- `POST /api/transactions/`
- `GET /api/transactions/{id}/`
- `PUT /api/transactions/{id}/`
- `DELETE /api/transactions/{id}/`

### Budgets

- `GET /api/budgets/`
- `POST /api/budgets/`
- `PUT /api/budgets/{id}/`

### Reports

- `GET /api/reports/dashboard/`
- `GET /api/reports/monthly/`
- `GET /api/reports/category-summary/`
- `GET /api/reports/export/csv/`
- `GET /api/reports/export/xlsx/`
- `GET /api/reports/export/pdf/`

## Export Requirements

### CSV

- export filtered transaction rows
- UTF-8 encoded
- columns:
  - Date
  - Type
  - Category
  - Title
  - Note
  - Amount

### Excel

- use `.xlsx`
- generate using `openpyxl`
- first sheet name: `Transactions Report`
- include title, filters, summary totals, and data table

### PDF

- generate printable A4 report
- include user info, date range, filters, summary totals, transaction table, and generation timestamp
- support multi-page output

## Implementation Phases

### Phase 1: Backend Foundation

- create Django project in `backend/`
- configure custom user model
- configure PostgreSQL
- configure DRF, JWT, and CORS
- create app structure
- create initial migrations
- set up admin
- create health check endpoint

### Phase 2: Auth And Accounts

- register API
- login API
- refresh API
- profile API
- change-password API
- frontend auth context
- login/register pages
- protected routes

### Phase 3: Categories And Transactions

- category model and CRUD
- default category seeding
- transaction model and CRUD
- filter/search/sort backend
- transaction forms and list UI
- category dropdown integration

### Phase 4: Budgets And Dashboard

- budget model and CRUD
- remaining budget logic
- overspending alert logic
- dashboard report endpoint
- summary cards
- charts using backend data

### Phase 5: Reports And Export

- monthly report endpoint
- category summary endpoint
- frontend reports page
- CSV export
- Excel export
- PDF export

### Phase 6: Testing, Polish, Deployment

- backend API tests
- frontend integration/manual QA
- responsive UI checks
- README
- screenshots
- deploy frontend/backend/database

## Division For 4 People

### Member 1 — Backend Core And Auth

Own:

- `backend/config/`
- `backend/apps/accounts/`
- JWT auth
- custom user model
- env config
- CORS
- deployment backend config

Branch:

- `feature/backend-auth-core`

### Member 2 — Backend Finance Modules

Own:

- `backend/apps/transactions/`
- `backend/apps/budgets/`
- `backend/apps/reports/`
- category APIs
- transaction APIs
- budget APIs
- export APIs

Branch:

- `feature/backend-finance`

### Member 3 — Frontend Application

Own:

- `frontend/src/pages/`
- `frontend/src/components/`
- `frontend/src/hooks/`
- `frontend/src/services/`
- auth UI
- dashboard UI
- transactions UI
- reports UI
- export buttons and report views

Branch:

- `feature/frontend-ui`

### Member 4 — Database, QA, Docs, Deployment

Own:

- `database/`
- seed scripts
- schema notes
- export samples
- README
- screenshots
- deployment steps
- final QA

Branch:

- `feature/database-docs-deploy`

## Parallel Work Strategy

### Dependency Order

Member 1 must first create:

- Django project
- custom user model
- base settings
- auth contract

After that:

- Member 2 builds models, serializers, views, exports
- Member 3 builds frontend using agreed API contracts
- Member 4 prepares DB docs, seeds, README skeleton, and QA checklist

### Shared File Rules

Only Member 1 edits these initially:

- `backend/config/settings.py`
- `backend/config/urls.py`
- `backend/requirements.txt`

Only Member 3 edits these initially:

- `frontend/package.json`
- frontend routing shell
- frontend API base service

Member 4 owns:

- root `README.md`
- `database/` docs
- test checklist
- deployment notes

## Git Workflow

1. Pull latest `main`
2. Create personal feature branch
3. Commit only to your branch
4. Push branch
5. Open PR
6. Get teammate review
7. Merge only after manual verification

## Test Plan

### Backend

- register valid user
- reject duplicate email
- login and refresh token
- reject unauthorized requests
- ensure user data isolation
- CRUD for categories
- CRUD for transactions
- budget calculations
- report summary correctness
- export CSV/XLSX/PDF correctness

### Frontend

- register/login flow
- token persistence after refresh
- protected route checks
- add/edit/delete transaction flow
- filter/search/sort behavior
- budget warnings visible
- dashboard charts render correctly
- reports page export buttons work

### Integration

- frontend connects to deployed backend
- CORS is correct
- PostgreSQL is used, not SQLite
- live exports download successfully

## Assumptions And Defaults

- Excel means `.xlsx`
- export formats required: `CSV`, `XLSX`, `PDF`
- PDF export is mandatory
- frontend is React only
- backend is Django API only
- database folder stores docs/support material while actual migrations remain in Django apps
- receipt upload is optional unless time remains after mandatory features are complete
