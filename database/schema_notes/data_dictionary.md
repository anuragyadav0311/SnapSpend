# Data Dictionary

Complete reference of all database tables, columns, types, and constraints.

---

## Table: `accounts_user`

Extends Django's `AbstractUser`. Used as `AUTH_USER_MODEL`.

| Column | Type | Nullable | Default | Constraints | Description |
|--------|------|----------|---------|-------------|-------------|
| `id` | `BIGINT` | NO | auto | PK, auto-increment | Unique user identifier |
| `password` | `VARCHAR(128)` | NO | — | — | Hashed password |
| `last_login` | `TIMESTAMPTZ` | YES | `NULL` | — | Last login timestamp |
| `is_superuser` | `BOOLEAN` | NO | `FALSE` | — | Django superuser flag |
| `username` | `VARCHAR(150)` | NO | — | UNIQUE | Auto-set to email |
| `first_name` | `VARCHAR(150)` | NO | `''` | — | Inherited, unused |
| `last_name` | `VARCHAR(150)` | NO | `''` | — | Inherited, unused |
| `is_staff` | `BOOLEAN` | NO | `FALSE` | — | Admin site access |
| `is_active` | `BOOLEAN` | NO | `TRUE` | — | Account active status |
| `date_joined` | `TIMESTAMPTZ` | NO | `now()` | — | Inherited from AbstractUser |
| `email` | `VARCHAR(254)` | NO | — | UNIQUE | Login field (USERNAME_FIELD) |
| `name` | `VARCHAR(150)` | NO | — | — | Display name |
| `created_at` | `TIMESTAMPTZ` | NO | `now()` | auto_now_add | Record creation time |
| `updated_at` | `TIMESTAMPTZ` | NO | `now()` | auto_now | Record last update time |

---

## Table: `transactions_category`

Stores both system-default and user-custom categories.

| Column | Type | Nullable | Default | Constraints | Description |
|--------|------|----------|---------|-------------|-------------|
| `id` | `BIGINT` | NO | auto | PK, auto-increment | Unique category identifier |
| `user_id` | `BIGINT` | YES | `NULL` | FK → `accounts_user(id)` | Owner (NULL = system default) |
| `name` | `VARCHAR(100)` | NO | — | — | Category display name |
| `type` | `VARCHAR(7)` | NO | — | CHECK: `income` or `expense` | Category classification |
| `created_at` | `TIMESTAMPTZ` | NO | `now()` | auto_now_add | Record creation time |

**Business Rules:**
- Rows with `user_id = NULL` are system defaults visible to all users
- Rows with a `user_id` are custom categories visible only to that user
- When listing categories for a user, query: `WHERE user_id IS NULL OR user_id = <current_user>`

---

## Table: `transactions_transaction`

Core financial records for income and expenses.

| Column | Type | Nullable | Default | Constraints | Description |
|--------|------|----------|---------|-------------|-------------|
| `id` | `BIGINT` | NO | auto | PK, auto-increment | Unique transaction identifier |
| `user_id` | `BIGINT` | NO | — | FK → `accounts_user(id)` | Transaction owner |
| `category_id` | `BIGINT` | NO | — | FK → `transactions_category(id)` | Associated category |
| `type` | `VARCHAR(7)` | NO | — | CHECK: `income` or `expense` | Transaction classification |
| `amount` | `DECIMAL(12,2)` | NO | — | CHECK: `amount > 0` | Transaction amount (always positive) |
| `title` | `VARCHAR(200)` | NO | — | — | Short description |
| `note` | `TEXT` | YES | `''` | — | Optional detailed note |
| `date` | `DATE` | NO | — | — | Transaction date |
| `receipt` | `VARCHAR(100)` | YES | `NULL` | — | Optional receipt file path |
| `created_at` | `TIMESTAMPTZ` | NO | `now()` | auto_now_add | Record creation time |
| `updated_at` | `TIMESTAMPTZ` | NO | `now()` | auto_now | Record last update time |

**Business Rules:**
- `amount` is always positive; `type` determines income vs expense
- Users can only see/edit their own transactions
- Filtering supported by: `type`, `category_id`, `date` range
- Sorting supported by: `date`, `amount`, `created_at`

---

## Table: `budgets_budget`

Monthly spending limits per user.

| Column | Type | Nullable | Default | Constraints | Description |
|--------|------|----------|---------|-------------|-------------|
| `id` | `BIGINT` | NO | auto | PK, auto-increment | Unique budget identifier |
| `user_id` | `BIGINT` | NO | — | FK → `accounts_user(id)` | Budget owner |
| `month` | `DATE` | NO | — | UNIQUE with `user_id` | First day of the budget month |
| `limit_amount` | `DECIMAL(12,2)` | NO | — | CHECK: `limit_amount > 0` | Monthly spending cap |
| `created_at` | `TIMESTAMPTZ` | NO | `now()` | auto_now_add | Record creation time |
| `updated_at` | `TIMESTAMPTZ` | NO | `now()` | auto_now | Record last update time |

**Business Rules:**
- One budget per user per month (enforced via `UNIQUE(user_id, month)`)
- `month` is always the 1st of the month (e.g., `2026-05-01`)
- Remaining budget = `limit_amount` − sum of expenses in that month
- Warning thresholds: near-limit (≥80%), exceeded (>100%)

---

## Table: `token_blacklist_*`

Managed by `djangorestframework-simplejwt`. Stores blacklisted JWT refresh tokens for secure logout. No custom schema needed — handled entirely by the library's migrations.

---

## Summary Statistics

| Table | Estimated Growth | Key Queries |
|-------|-----------------|-------------|
| `accounts_user` | Low (tens/hundreds) | Login, profile fetch |
| `transactions_category` | Low (20-50 per user) | Dropdown lists, filtering |
| `transactions_transaction` | High (thousands per user) | List, filter, aggregate, export |
| `budgets_budget` | Low (12 per user per year) | Monthly budget check |
