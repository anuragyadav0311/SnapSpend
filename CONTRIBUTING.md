# Contributing Guide

## Branch Strategy

Each team member works on their own feature branch:

| Member | Branch | Scope |
|--------|--------|-------|
| Member 1 | `feature/backend-auth-core` | Django project, auth, JWT, CORS, settings |
| Member 2 | `feature/backend-finance` | Transactions, budgets, reports, exports |
| Member 3 | `feature/frontend-ui` | React pages, components, services, hooks |
| Member 4 | `feature/database-docs-deploy` | Database docs, seeds, QA, README, deployment |

## Workflow

1. **Pull latest main:**
   ```bash
   git checkout main
   git pull origin main
   ```

2. **Switch to your branch:**
   ```bash
   git checkout feature/your-branch
   git merge main  # incorporate any merged changes
   ```

3. **Work and commit:**
   ```bash
   git add .
   git commit -m "feat(scope): description"
   ```

4. **Push and create PR:**
   ```bash
   git push origin feature/your-branch
   ```
   Then open a Pull Request on GitHub.

5. **Review and merge:**
   - Get at least one teammate review
   - Resolve conflicts if any
   - Merge via GitHub PR (not direct push)

## Commit Message Convention

Use the format: `type(scope): description`

### Types
- `feat` — New feature
- `fix` — Bug fix
- `docs` — Documentation changes
- `refactor` — Code refactoring
- `test` — Adding or updating tests
- `chore` — Maintenance tasks

### Scopes
- `auth` — Authentication related
- `transactions` — Transaction/category features
- `budgets` — Budget features
- `reports` — Reports and exports
- `dashboard` — Dashboard UI
- `database` — Database docs and seeds
- `deploy` — Deployment configuration

### Examples
```
feat(auth): add user registration API
fix(transactions): handle negative amount validation
docs(database): add ER diagram and data dictionary
refactor(dashboard): extract chart components
test(budgets): add budget calculation tests
chore(deploy): update Render build script
```

## File Ownership Rules

To minimize merge conflicts, each member owns specific files:

### Member 1 (initially owns)
- `backend/config/settings.py`
- `backend/config/urls.py`
- `backend/requirements.txt`
- `backend/apps/accounts/`

### Member 2
- `backend/apps/transactions/` (models, serializers, views, urls)
- `backend/apps/budgets/`
- `backend/apps/reports/`

### Member 3
- `frontend/src/` (all files)
- `frontend/package.json`

### Member 4
- `README.md`
- `database/`
- `.gitignore`
- `backend/build.sh`
- `frontend/vercel.json`

> **Rule:** If you need to edit a file owned by another member, communicate first and coordinate the change.

## Development Setup

See the [README](README.md) for full setup instructions.

### Quick Start

```bash
# Backend
cd backend && python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env  # edit with your DB credentials
python manage.py migrate
python manage.py seed_categories
python manage.py runserver

# Frontend (new terminal)
cd frontend && npm install
cp .env.example .env
npm run dev
```
