# Database Setup Guide

## Overview

This project uses **PostgreSQL** as its primary database. All team members must use PostgreSQL from day one — do not use SQLite even for local development.

---

## Option 1: Local PostgreSQL Installation

### Ubuntu / Debian

```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### macOS (Homebrew)

```bash
brew install postgresql@16
brew services start postgresql@16
```

### Windows

Download the installer from [postgresql.org](https://www.postgresql.org/download/windows/) and follow the setup wizard.

### Create the Database and User

```bash
# Switch to the postgres system user
sudo -u postgres psql

# Inside the PostgreSQL shell:
CREATE DATABASE expense_tracker;
CREATE USER expense_user WITH PASSWORD 'your_secure_password';
ALTER ROLE expense_user SET client_encoding TO 'utf8';
ALTER ROLE expense_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE expense_user SET timezone TO 'Asia/Kolkata';
GRANT ALL PRIVILEGES ON DATABASE expense_tracker TO expense_user;
\q
```

### Configure the Backend

Copy `backend/.env.example` to `backend/.env` and update:

```env
SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=127.0.0.1,localhost
POSTGRES_DB=expense_tracker
POSTGRES_USER=expense_user
POSTGRES_PASSWORD=your_secure_password
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
FRONTEND_URL=http://localhost:5173
```

---

## Option 2: Neon (Recommended for Cloud)

1. Sign up at [neon.tech](https://neon.tech)
2. Create a new project named `snapspend`
3. Copy the connection string from the dashboard
4. Update your `backend/.env`:

```env
POSTGRES_DB=neondb
POSTGRES_USER=your_neon_user
POSTGRES_PASSWORD=your_neon_password
POSTGRES_HOST=ep-xxxx-xxxx.us-east-2.aws.neon.tech
POSTGRES_PORT=5432
```

> **Note:** Neon uses connection pooling by default. The free tier includes 0.5 GB storage and is ideal for development.

---

## Option 3: Supabase

1. Sign up at [supabase.com](https://supabase.com)
2. Create a new project
3. Go to **Settings → Database** and copy the connection info
4. Update your `backend/.env` with the Supabase credentials

> **Note:** Supabase provides a full PostgreSQL instance. The free tier includes 500 MB storage.

---

## Running Migrations

After configuring the database connection:

```bash
cd backend/
python manage.py makemigrations
python manage.py migrate
```

## Creating a Superuser

```bash
cd backend/
python manage.py createsuperuser
```

Follow the prompts to set email, name, and password.

## Seeding Default Data

After migrations, seed the default categories:

```bash
cd backend/
python manage.py seed_categories
```

Or load the JSON fixture:

```bash
cd backend/
python manage.py loaddata database/seeds/default_categories.json
```

See `database/seeds/` for available seed data.

---

## Verifying the Setup

```bash
cd backend/
python manage.py dbshell
```

Inside the PostgreSQL shell:

```sql
\dt                          -- list all tables
SELECT count(*) FROM accounts_user;
SELECT count(*) FROM transactions_category;
\q
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `psycopg2` install fails | Install `libpq-dev`: `sudo apt install libpq-dev` |
| Connection refused | Ensure PostgreSQL is running: `sudo systemctl status postgresql` |
| Authentication failed | Check username/password in `.env` match the DB user |
| `FATAL: database does not exist` | Create the database: `sudo -u postgres createdb expense_tracker` |
| Permission denied on schema | Grant privileges: `GRANT ALL ON SCHEMA public TO expense_user;` |
| SSL required (cloud) | Add `?sslmode=require` to connection or set `PGSSLMODE=require` |

---

## Production Notes

- Always use a strong, unique `SECRET_KEY` in production
- Set `DEBUG=False`
- Use environment variables — never commit `.env` files
- Enable SSL connections for cloud PostgreSQL providers
- Consider connection pooling (PgBouncer) for high-traffic deployments
