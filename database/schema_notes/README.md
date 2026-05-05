# Schema Notes

Database schema documentation for the Expense Tracker project.

## Documents

- **[ER Diagram](er_diagram.md)** — Visual entity-relationship diagram with relationship details, cascade rules, and recommended indexes
- **[Data Dictionary](data_dictionary.md)** — Complete reference of all tables, columns, types, constraints, and business rules

## Quick Reference

| Table | Description | Key Fields |
|-------|-------------|------------|
| `accounts_user` | Custom user model (email login) | email, name, password |
| `transactions_category` | Income/expense categories | name, type, user (nullable) |
| `transactions_transaction` | Financial records | amount, type, date, category |
| `budgets_budget` | Monthly spending limits | month, limit_amount |
