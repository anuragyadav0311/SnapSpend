# Contributing to SnapSpend

Thanks for helping improve SnapSpend. This guide keeps contributions predictable, reviewable, and easy for the team to maintain.

## Ways to Contribute

- Fix bugs in authentication, transactions, budgets, reports, ML, OCR, or frontend workflows.
- Improve test coverage for backend APIs and frontend business flows.
- Refine documentation, setup notes, screenshots, and deployment guides.
- Improve accessibility, responsiveness, and form validation.
- Propose new finance features through an issue before starting large work.

## Development Setup

Follow the full setup in [README.md](README.md). The short version is:

```bash
# Backend
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
python manage.py migrate
python manage.py seed_categories
python manage.py runserver
```

```bash
# Frontend
cd frontend
npm install
cp .env.example .env
npm run dev
```

## Branch Strategy

Use short-lived branches from `main`:

```bash
git checkout main
git pull origin main
git checkout -b feature/short-description
```

Recommended prefixes:

- `feature/` for new behavior
- `fix/` for bug fixes
- `docs/` for documentation
- `test/` for test-only changes
- `chore/` for maintenance

## Commit Messages

Use this format:

```text
type(scope): short description
```

Common types:

- `feat` - new feature
- `fix` - bug fix
- `docs` - documentation
- `refactor` - internal code improvement
- `test` - tests
- `chore` - maintenance

Common scopes:

- `auth`
- `transactions`
- `budgets`
- `reports`
- `dashboard`
- `ml`
- `ocr`
- `frontend`
- `database`
- `deploy`

Examples:

```text
feat(transactions): add receipt verification status
fix(budgets): handle exceeded budget percentage
docs(readme): add architecture diagram
test(auth): cover refresh token rotation
```

## Pull Request Checklist

Before opening a PR:

- Keep the change focused on one problem or feature.
- Run backend tests when backend behavior changes.
- Run the frontend build when frontend code changes.
- Update docs when setup, APIs, environment variables, or workflows change.
- Add screenshots or GIFs for user-facing UI changes.
- Avoid committing secrets, local databases, virtual environments, logs, or generated build output.

Validation commands:

```bash
cd backend
python manage.py test
```

```bash
cd frontend
npm run build
```

## Code Style

- Match the style of the surrounding files.
- Prefer clear domain names over clever abstractions.
- Keep API behavior consistent across apps.
- Keep validation close to serializers/forms and business rules close to services/models where practical.
- Keep UI copy concise and action-oriented.
- Add comments only when they explain non-obvious decisions.

## File Ownership Guidance

To reduce merge conflicts, coordinate before changing another contributor's active area:

| Area | Files |
| --- | --- |
| Backend auth | `backend/apps/accounts/`, `backend/config/` |
| Finance API | `backend/apps/transactions/`, `backend/apps/budgets/`, `backend/apps/reports/` |
| Frontend | `frontend/src/`, `frontend/package.json` |
| ML and data | `backend/ml/`, `dataset/` |
| Database docs and seeds | `database/` |
| Project docs | `README.md`, `CONTRIBUTING.md`, `SECURITY.md` |

## Security

Do not open public issues with secrets, credentials, token dumps, or exploitable vulnerability details. Follow [SECURITY.md](SECURITY.md) for private reporting guidance.

## Community

All contributors are expected to follow the [Code of Conduct](CODE_OF_CONDUCT.md).
