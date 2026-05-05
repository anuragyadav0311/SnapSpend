# Seed Data Guide

## Available Seeds

### 1. Default Categories (`default_categories.json`)

Contains 20 system-default categories:

**Income (6):** Salary, Freelance, Investments, Gifts Received, Refunds, Other Income

**Expense (14):** Food & Dining, Groceries, Transportation, Rent, Utilities, Healthcare, Entertainment, Shopping, Education, Subscriptions, Insurance, Gifts & Donations, Travel, Other Expense

#### Loading via management command (recommended):

```bash
cd backend/
python manage.py seed_categories
```

To clear and re-seed:

```bash
python manage.py seed_categories --clear
```

#### Loading via Django fixture:

```bash
cd backend/
python manage.py loaddata ../database/seeds/default_categories.json
```

---

### 2. Sample Data (`sample_data.json`)

Contains demo data for QA testing. **Requires a user with `id=1` and default categories to exist first.**

Includes:
- 10 transactions (3 income, 7 expense)
- 1 monthly budget (₹40,000 for May 2026)

#### Loading:

```bash
# First create a demo user
cd backend/
python manage.py createsuperuser
# Use: demo@example.com / Demo User / password123

# Then seed categories
python manage.py seed_categories

# Finally load sample data
python manage.py loaddata ../database/seeds/sample_data.json
```

---

## Creating Custom Seed Data

To export your current data as a fixture:

```bash
cd backend/

# Export all categories
python manage.py dumpdata transactions.Category --indent 2 > ../database/seeds/my_categories.json

# Export all transactions
python manage.py dumpdata transactions.Transaction --indent 2 > ../database/seeds/my_transactions.json

# Export everything
python manage.py dumpdata --indent 2 --exclude auth.permission --exclude contenttypes > ../database/seeds/full_dump.json
```
