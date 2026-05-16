# QA Test Checklist

Comprehensive testing checklist for the Expense Tracker application. Each section covers a feature area with specific test cases.

---

## 1. Authentication

### Registration
- [ ] Can register with valid email, name, and password
- [ ] Registration fails with duplicate email (shows error)
- [ ] Registration fails with weak password (shows validation error)
- [ ] Registration fails with missing required fields
- [ ] After successful registration, user is redirected to login

### Login
- [ ] Can login with valid email and password
- [ ] Login fails with wrong password (shows error)
- [ ] Login fails with non-existent email (shows error)
- [ ] After successful login, JWT tokens are stored
- [ ] After login, user is redirected to dashboard

### Token Management
- [ ] Access token is sent with every API request (Authorization header)
- [ ] Token refresh happens automatically when access token expires
- [ ] After refresh, new tokens are stored correctly
- [ ] If refresh token is expired, user is redirected to login

### Logout
- [ ] Logout clears stored tokens
- [ ] After logout, user cannot access protected routes
- [ ] After logout, visiting protected routes redirects to login

### Profile
- [ ] Can view current user profile (name, email)
- [ ] Can update user name
- [ ] Can change password with correct old password
- [ ] Password change fails with wrong old password
- [ ] Password change fails if new password is too weak

### Protected Routes
- [ ] Dashboard is not accessible without login
- [ ] Transactions page is not accessible without login
- [ ] Reports page is not accessible without login
- [ ] API calls without valid token return 401

---

## 2. Categories

### Default Categories
- [ ] System default categories are visible to all users
- [ ] Default categories include both income and expense types
- [ ] Default categories cannot be edited by users
- [ ] Default categories cannot be deleted by users

### Custom Categories
- [ ] Can create a new income category
- [ ] Can create a new expense category
- [ ] Can edit own custom category name
- [ ] Can delete own custom category (if no transactions use it)
- [ ] Cannot delete custom category that has transactions (PROTECT)
- [ ] Cannot see other users' custom categories

### Category Dropdown
- [ ] Transaction form shows combined list (defaults + custom)
- [ ] Categories are filtered by type (income categories for income, expense for expense)
- [ ] Newly created category appears in dropdown immediately

---

## 3. Transactions

### Create
- [ ] Can add an income transaction with all required fields
- [ ] Can add an expense transaction with all required fields
- [ ] Amount must be a positive number
- [ ] Date field works correctly
- [ ] Note field is optional
- [ ] Receipt upload is optional
- [ ] After creation, transaction appears in the list

### Read / List
- [ ] All user's transactions are listed
- [ ] Each transaction shows: date, type, category, title, amount
- [ ] Pagination works if many transactions exist
- [ ] Empty state is shown when no transactions exist

### Update
- [ ] Can edit transaction title, amount, date, category, note
- [ ] Can change transaction type (income ↔ expense)
- [ ] Changes are reflected immediately in the list
- [ ] Cannot edit another user's transactions

### Delete
- [ ] Can delete own transactions
- [ ] Confirmation dialog appears before deletion
- [ ] Deleted transaction is removed from the list
- [ ] Cannot delete another user's transactions

### Filtering
- [ ] Can filter by type: income only
- [ ] Can filter by type: expense only
- [ ] Can filter by specific category
- [ ] Can filter by date range (start date → end date)
- [ ] Combined filters work correctly
- [ ] Clearing filters shows all transactions

### Search
- [ ] Can search by transaction title
- [ ] Can search by note content
- [ ] Search is case-insensitive
- [ ] Empty search results show appropriate message

### Sorting
- [ ] Can sort by newest first (default)
- [ ] Can sort by oldest first
- [ ] Can sort by highest amount
- [ ] Can sort by lowest amount

### OCR Bill Scan
- [ ] Expense composer shows a **Scan Bill** action
- [ ] Uploading a clear receipt prefills amount, date, title, and category
- [ ] User can still edit OCR-filled values before saving
- [ ] Missing OCR runtime shows a readable error instead of crashing
- [ ] Uploading no image returns a validation error
- [ ] OCR flow is available only for expense creation, not income

---

## 4. Budgets

### Create
- [ ] Can create a monthly budget with a limit amount
- [ ] Budget is associated with a specific month
- [ ] Cannot create two budgets for the same month
- [ ] Limit amount must be positive

### Update
- [ ] Can update the budget limit for a month
- [ ] Updated limit reflects immediately in budget display

### Display
- [ ] Shows total budget limit for current month
- [ ] Shows total expenses for current month
- [ ] Shows remaining budget (limit − expenses)
- [ ] Progress bar or indicator shows budget usage

### Warnings
- [ ] Near-limit warning appears when ≥80% of budget is spent
- [ ] Exceeded warning appears when >100% of budget is spent
- [ ] No warning when spending is under 80%

---

## 5. Dashboard

### Summary Cards
- [ ] Total income is calculated correctly
- [ ] Total expense is calculated correctly
- [ ] Current balance (income − expense) is correct
- [ ] Current month summary is accurate

### Recent Transactions
- [ ] Shows the 5-10 most recent transactions
- [ ] Each shows date, title, amount, type indicator
- [ ] Clicking a transaction navigates to detail/edit view

### Charts
- [ ] Category breakdown chart renders (pie/donut chart)
- [ ] Chart shows expense distribution across categories
- [ ] Monthly trend chart renders (line/bar chart)
- [ ] Chart shows income vs expense over recent months
- [ ] Charts handle empty data gracefully

---

## 6. Reports

### Monthly Report
- [ ] Shows income/expense breakdown for selected month
- [ ] Totals are accurate
- [ ] Can navigate between months

### Category Summary
- [ ] Shows spending per category
- [ ] Percentages are calculated correctly
- [ ] Categories are sorted by amount (highest first)

### Export — CSV
- [ ] Download button triggers file download
- [ ] File has `.csv` extension
- [ ] File opens correctly in Excel / Google Sheets
- [ ] Columns: Date, Type, Category, Title, Note, Amount
- [ ] All filtered transactions are included
- [ ] UTF-8 encoding handles special characters

### Export — Excel (.xlsx)
- [ ] Download button triggers file download
- [ ] File has `.xlsx` extension
- [ ] File opens in Excel without errors
- [ ] Sheet name is "Transactions Report"
- [ ] Includes title and filter information
- [ ] Includes summary totals
- [ ] Data table has correct columns
- [ ] Amounts are formatted as numbers

### Export — PDF
- [ ] Download button triggers file download
- [ ] File has `.pdf` extension
- [ ] PDF opens in browser / PDF reader
- [ ] A4 page size, printable
- [ ] Includes user info and date range
- [ ] Includes summary totals
- [ ] Transaction table is readable
- [ ] Multi-page output works for many transactions
- [ ] Generation timestamp in footer

---

## 7. Data Isolation

- [ ] User A cannot see User B's transactions
- [ ] User A cannot see User B's custom categories
- [ ] User A cannot see User B's budgets
- [ ] API endpoints enforce user ownership
- [ ] Attempting to access another user's data returns 403 or 404

---

## 8. Responsive Design

- [ ] Dashboard looks good on desktop (≥1024px)
- [ ] Dashboard looks good on tablet (768px-1023px)
- [ ] Dashboard looks good on mobile (≤767px)
- [ ] Navigation is usable on all screen sizes
- [ ] Forms are usable on mobile
- [ ] Tables scroll horizontally on small screens
- [ ] Charts resize appropriately

---

## 9. Integration / Production

- [ ] Frontend connects to deployed backend correctly
- [ ] CORS is configured — no CORS errors in console
- [ ] PostgreSQL is used (not SQLite)
- [ ] Health check endpoint responds with `{"status": "ok"}`
- [ ] Static files load on production
- [ ] SSL is working (HTTPS)
- [ ] Export downloads work on production
- [ ] Token refresh works after page reload
- [ ] Browser back/forward navigation works correctly

---

## 10. Edge Cases

- [ ] Very long transaction titles are handled (truncation/wrapping)
- [ ] Very large amounts display correctly
- [ ] Zero amount is rejected
- [ ] Negative amount is rejected
- [ ] Future dates are accepted for transactions
- [ ] Very old dates are accepted for transactions
- [ ] Special characters in notes don't break the app
- [ ] Empty database state shows appropriate empty states
- [ ] Rapid form submissions don't create duplicates
- [ ] Network errors show user-friendly messages

---

## Test Results

| Area | Pass | Fail | Blocked | Notes |
|------|------|------|---------|-------|
| Authentication | | | | |
| Categories | | | | |
| Transactions | | | | |
| Budgets | | | | |
| Dashboard | | | | |
| Reports & Export | | | | |
| Data Isolation | | | | |
| Responsive Design | | | | |
| Integration | | | | |
| Edge Cases | | | | |
| **Total** | | | | |
