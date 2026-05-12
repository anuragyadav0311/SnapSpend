# API Services Layer

This folder contains the **Axios service functions** used to interact with the Django REST API.

## Base Setup
- All requests are made to `/api/` (configured in `axios.create`).
- JWT authentication is handled automatically:
  - The token is stored in `localStorage` after login.
  - An Axios interceptor attaches `Authorization: Bearer <token>` to every request.

## Available Services

### Categories
- `getCategories()` → Fetch all categories for the logged-in user.
- `createCategory(data)` → Create a new category.
- `updateCategory(id, data)` → Update an existing category.
- `deleteCategory(id)` → Delete a category.

### Transactions
- `getTransactions(params)` → Fetch transactions (supports filters, search, sort).
- `createTransaction(data)` → Create a new transaction.
- `updateTransaction(id, data)` → Update an existing transaction.
- `deleteTransaction(id)` → Delete a transaction.

### Budgets
- `getBudgets()` → Fetch all budgets for the logged-in user.
- `createBudget(data)` → Create a new monthly budget.

### Reports
- `downloadCSV()` → Download transactions report in CSV format.
- `downloadExcel()` → Download transactions report in Excel format.
- `downloadPDF()` → Download transactions report in PDF format.

## Usage Example
```javascript
import { getTransactions, createTransaction } from "../services/api";

// Fetch transactions
getTransactions({ type: "expense" })
  .then(res => console.log(res.data))
  .catch(err => console.error(err));

// Create a transaction
createTransaction({
  type: "expense",
  amount: 250,
  category: 1,
  title: "Groceries",
  date: "2026-05-12"
});