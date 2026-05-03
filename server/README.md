# Expense Tracker Backend

## Setup

```bash
cd server
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

Update `.env` with a valid PostgreSQL database URL and secure `SECRET_KEY`.

## Run

```bash
cd server
uvicorn main:app --reload
```

Swagger UI will be available at `http://127.0.0.1:8000/docs`.

## Phase 1 Test Flow

1. Open `/docs`.
2. Call `POST /auth/register` with a new user.
3. Call `POST /auth/login` and copy the `access_token`.
4. Click `Authorize` in Swagger and paste `Bearer <token>`.
5. Call `POST /expenses`, `GET /expenses`, `PUT /expenses/{id}`, and `DELETE /expenses/{id}`.
6. Call `POST /budget` and `GET /budget`.
7. Confirm protected routes reject requests without a bearer token.
