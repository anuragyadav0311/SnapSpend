# Sample Exports

This directory contains reference sample files showing the expected output format for each export type.

## Files

### `sample_transactions.csv`
- **Format:** UTF-8 encoded CSV
- **Columns:** Date, Type, Category, Title, Note, Amount
- **Purpose:** QA reference for CSV export functionality
- Use this to verify the CSV export endpoint (`GET /api/reports/export/csv/`) produces correct output

### Excel (.xlsx) — Expected Format
- **Sheet name:** `Transactions Report`
- **Layout:**
  - Row 1: Report title (e.g., "Expense Tracker — Transactions Report")
  - Row 2: Filter info (e.g., "Date Range: May 1, 2026 – May 31, 2026")
  - Row 3: Empty separator
  - Row 4: Summary totals (Total Income, Total Expense, Net Balance)
  - Row 5: Empty separator
  - Row 6: Column headers (Date, Type, Category, Title, Note, Amount)
  - Row 7+: Transaction data rows
- **Styling:** Bold headers, currency formatting on amounts, auto-sized columns

### PDF — Expected Format
- **Page size:** A4 portrait
- **Layout:**
  - Header: "Expense Tracker — Transactions Report"
  - User info block (Name, Email)
  - Date range and filter info
  - Summary section (Total Income, Total Expense, Net Balance)
  - Transaction table with zebra striping
  - Footer: "Generated on [timestamp]" with page numbers
- **Multi-page:** Yes, table should break across pages gracefully

## QA Checklist for Exports

- [ ] CSV downloads with `.csv` extension
- [ ] CSV opens correctly in Excel / Google Sheets
- [ ] CSV contains all filtered transactions
- [ ] CSV has correct column order (Date, Type, Category, Title, Note, Amount)
- [ ] Excel downloads with `.xlsx` extension
- [ ] Excel sheet is named "Transactions Report"
- [ ] Excel includes summary totals above the data table
- [ ] Excel amounts are formatted as numbers (not text)
- [ ] PDF downloads with `.pdf` extension
- [ ] PDF is A4 sized and printable
- [ ] PDF includes user info and date range
- [ ] PDF table breaks across pages correctly
- [ ] PDF shows generation timestamp in footer
- [ ] All exports respect applied filters (date range, type, category)
- [ ] Empty result set produces a valid file with headers but no data rows
