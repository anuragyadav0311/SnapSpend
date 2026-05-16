# ML Anomaly Detection

This folder contains the transaction anomaly detector for the Django backend.

The main model is `TransactionAnomalyDetector`, an Isolation Forest pipeline that uses:

- transaction amount
- transaction type
- category name
- day of week
- day of month
- month
- weekend flag

For very small datasets, `detect_anomalies` falls back to a simple statistical score so the API can still return useful results before a user has enough transactions for Isolation Forest.

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
