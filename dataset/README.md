# Income/Expense Dataset

Raw files are kept in this folder unchanged:

- `Income_expense_data.csv`
- `data_dictionary.txt`
- `income_expense_dashboard.pbix`

Processed ML-ready files are generated under `dataset/processed/` with:

```bash
python backend/ml/preprocess_income_expense_dataset.py
```

The preprocessing step:

- normalizes column names
- trims text fields
- drops rows missing `Expense`, `Income`, or `REF_DATE`
- drops non-positive expense/income rows
- adds `year_index`, `log_expense`, `log_income`, and `expense_to_income_ratio`
- writes deterministic 80/20 train/test splits using seed `42`

Generated files:

- `processed/income_expense_clean.csv`
- `processed/income_expense_train.csv`
- `processed/income_expense_test.csv`
- `processed/metadata.json`

