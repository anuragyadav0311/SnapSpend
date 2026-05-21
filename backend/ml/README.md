# ML Anomaly Detection

This folder contains the transaction anomaly detector for the Django backend.

The detector is now a hybrid system:

- an `IsolationForest` model for broad outlier detection
- a history-aware rules layer that compares a transaction against the user's past expense behavior

The model and rules use richer signals such as:

- transaction amount and log-amount
- expense type, category, and normalized title
- amount versus the user's normal type/category/title medians
- robust z-scores based on median absolute deviation
- day of week, day of month, and recurring interval patterns
- whether a transaction matches a stable monthly expense pattern

This makes the scoring more realistic:

- recurring expenses like rent or subscriptions are less likely to be flagged
- first-time large category/title spends are treated more cautiously
- sudden spikes inside an otherwise stable category are easier to catch

For very small datasets, `detect_anomalies` still falls back to lightweight history-based heuristics so the API can return useful results before a user has enough data for model training.

Useful commands:

```bash
python manage.py detect_anomalies --user-email user@example.com
python manage.py detect_anomalies --user-email user@example.com --save-model ml/user_model.joblib
python backend/ml/preprocess_income_expense_dataset.py
```

API endpoint:

```text
GET /api/transactions/anomalies/
```
