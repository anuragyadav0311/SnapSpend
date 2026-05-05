# Entity-Relationship Diagram

## Visual ER Diagram

```
┌──────────────────────────────┐
│            User              │
├──────────────────────────────┤
│ PK  id          BIGINT       │
│     username    VARCHAR(150) │
│     email       VARCHAR(254) │
│     name        VARCHAR(150) │
│     password    VARCHAR(128) │
│     is_active   BOOLEAN      │
│     is_staff    BOOLEAN      │
│     created_at  TIMESTAMPTZ  │
│     updated_at  TIMESTAMPTZ  │
│     last_login  TIMESTAMPTZ  │
└──────────┬───────────────────┘
           │
           │ 1
           │
     ┌─────┴──────┬────────────────┐
     │            │                │
     │ *          │ *              │ *
┌────▼──────────────────┐  ┌──────▼──────────────┐  ┌──────▼──────────────┐
│      Category         │  │    Transaction      │  │      Budget         │
├───────────────────────┤  ├─────────────────────┤  ├─────────────────────┤
│ PK  id      BIGINT    │  │ PK  id      BIGINT  │  │ PK  id      BIGINT │
│ FK  user    BIGINT    │  │ FK  user    BIGINT  │  │ FK  user    BIGINT │
│     name    VARCHAR   │  │ FK  category BIGINT │  │     month   DATE   │
│     type    VARCHAR   │  │     type    VARCHAR  │  │     limit_  DECIMAL│
│     created_at TS     │  │     amount  DECIMAL  │  │     created_at TS  │
│                       │  │     title   VARCHAR  │  │     updated_at TS  │
│  * user nullable for  │  │     note    TEXT     │  │                    │
│    system defaults    │  │     date    DATE     │  │  UNIQUE(user,month)│
└───────────────────────┘  │     receipt FILE     │  └────────────────────┘
           │               │     created_at TS    │
           │ 1             │     updated_at TS    │
           │               └─────────────────────┘
           │ *
     ┌─────▼──────┐
     │ Transaction │ (FK category)
     └────────────┘
```

## Relationships

| From | To | Relationship | Constraint |
|------|----|-------------|------------|
| User | Category | One-to-Many | `user_id` FK, nullable (system defaults have `user=NULL`) |
| User | Transaction | One-to-Many | `user_id` FK, NOT NULL, CASCADE on delete |
| User | Budget | One-to-Many | `user_id` FK, NOT NULL, CASCADE on delete |
| Category | Transaction | One-to-Many | `category_id` FK, NOT NULL, PROTECT on delete |

## Key Design Decisions

### 1. Custom User Model

- Extends `AbstractUser` to add `name`, `created_at`, `updated_at`
- `email` is the login field (`USERNAME_FIELD = "email"`)
- `username` is auto-set to `email` on save (for compatibility with Django's auth framework)

### 2. Category Ownership

- Categories with `user=NULL` are **system defaults** (visible to all users)
- Categories with a `user` FK are **custom categories** (visible only to that user)
- Category `type` is either `income` or `expense`

### 3. Transaction Types

- `type` field uses choices: `income` or `expense`
- `amount` is always stored as a positive `Decimal` value
- `receipt` is an optional `FileField` for image uploads

### 4. Budget Uniqueness

- Each user can have only **one budget per month**
- Enforced via `UNIQUE(user, month)` constraint
- `month` is stored as the first day of the month (`DATE`)

### 5. Cascade Rules

| Parent | Child | On Delete |
|--------|-------|-----------|
| User | Category | CASCADE — user's custom categories are deleted |
| User | Transaction | CASCADE — all user transactions are deleted |
| User | Budget | CASCADE — all user budgets are deleted |
| Category | Transaction | PROTECT — cannot delete a category that has transactions |

## Indexes (Recommended)

```sql
-- Fast lookups for user-specific data
CREATE INDEX idx_transaction_user ON transactions_transaction(user_id);
CREATE INDEX idx_transaction_date ON transactions_transaction(date);
CREATE INDEX idx_transaction_type ON transactions_transaction(type);
CREATE INDEX idx_transaction_category ON transactions_transaction(category_id);
CREATE INDEX idx_category_user ON transactions_category(user_id);
CREATE INDEX idx_category_type ON transactions_category(type);
CREATE INDEX idx_budget_user ON budgets_budget(user_id);
CREATE INDEX idx_budget_month ON budgets_budget(month);
```

> **Note:** Django automatically creates indexes on FK fields and fields with `unique=True`. The indexes above are supplementary for query optimization.
