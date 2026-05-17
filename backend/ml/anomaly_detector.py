from __future__ import annotations

from dataclasses import dataclass
from datetime import date
from pathlib import Path
from typing import Iterable

import joblib
import numpy as np
from sklearn.feature_extraction import DictVectorizer
from sklearn.ensemble import IsolationForest
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler


DEFAULT_CONTAMINATION = 0.08
DEFAULT_MIN_TRAINING_SAMPLES = 10


@dataclass(frozen=True)
class AnomalyResult:
    transaction_id: int
    is_anomaly: bool
    anomaly_score: float
    reason: str


class TransactionAnomalyDetector:
    """Isolation Forest based detector for suspicious expense/income entries."""

    def __init__(
        self,
        contamination: float = DEFAULT_CONTAMINATION,
        random_state: int = 42,
        min_training_samples: int = DEFAULT_MIN_TRAINING_SAMPLES,
    ):
        self.contamination = contamination
        self.random_state = random_state
        self.min_training_samples = min_training_samples
        self.pipeline = self._build_pipeline()
        self._is_fit = False

    def _build_pipeline(self) -> Pipeline:
        model = IsolationForest(
            contamination=self.contamination,
            n_estimators=200,
            random_state=self.random_state,
        )
        return Pipeline(
            [
                ("vectorizer", DictVectorizer(sparse=False)),
                ("scaler", StandardScaler()),
                ("model", model),
            ]
        )

    def fit(self, transactions: Iterable) -> "TransactionAnomalyDetector":
        rows = transactions_to_feature_rows(transactions)
        if len(rows) < self.min_training_samples:
            raise ValueError(
                f"Isolation Forest needs at least {self.min_training_samples} transactions; "
                f"got {len(rows)}."
            )
        self.pipeline.fit(rows)
        self._is_fit = True
        return self

    def predict(self, transactions: Iterable) -> list[AnomalyResult]:
        if not self._is_fit:
            raise ValueError("Fit or load the anomaly detector before calling predict.")

        transaction_list = list(transactions)
        rows = transactions_to_feature_rows(transaction_list)
        predictions = self.pipeline.predict(rows)
        decision_scores = self.pipeline.decision_function(rows)

        results = []
        for transaction, prediction, decision_score in zip(transaction_list, predictions, decision_scores):
            is_anomaly = prediction == -1
            anomaly_score = float(max(0.0, -decision_score))
            results.append(
                AnomalyResult(
                    transaction_id=transaction.id,
                    is_anomaly=is_anomaly,
                    anomaly_score=round(anomaly_score, 6),
                    reason=_build_reason(transaction, is_anomaly),
                )
            )
        return results

    def fit_predict(self, transactions: Iterable) -> list[AnomalyResult]:
        transaction_list = list(transactions)
        self.fit(transaction_list)
        return self.predict(transaction_list)

    def save(self, path: str | Path) -> None:
        if not self._is_fit:
            raise ValueError("Fit the anomaly detector before saving it.")
        joblib.dump(
            {
                "pipeline": self.pipeline,
                "contamination": self.contamination,
                "random_state": self.random_state,
                "min_training_samples": self.min_training_samples,
            },
            path,
        )

    @classmethod
    def load(cls, path: str | Path) -> "TransactionAnomalyDetector":
        payload = joblib.load(path)
        detector = cls(
            contamination=payload["contamination"],
            random_state=payload["random_state"],
            min_training_samples=payload["min_training_samples"],
        )
        detector.pipeline = payload["pipeline"]
        detector._is_fit = True
        return detector


def detect_anomalies(
    transactions: Iterable,
    contamination: float = DEFAULT_CONTAMINATION,
    min_training_samples: int = DEFAULT_MIN_TRAINING_SAMPLES,
) -> list[AnomalyResult]:
    transaction_list = list(transactions)
    if len(transaction_list) < min_training_samples:
        return _statistical_fallback(transaction_list)

    detector = TransactionAnomalyDetector(
        contamination=contamination,
        min_training_samples=min_training_samples,
    )
    return detector.fit_predict(transaction_list)


def transactions_to_feature_rows(transactions: Iterable) -> list[dict]:
    rows = []
    for transaction in transactions:
        category = getattr(transaction, "category", None)
        tx_date = transaction.date or date.today()
        rows.append(
            {
                "amount": float(transaction.amount),
                "type": transaction.type,
                "category_name": category.name if category else "Uncategorized",
                "day_of_week": tx_date.weekday(),
                "day_of_month": tx_date.day,
                "month": tx_date.month,
                "is_weekend": int(tx_date.weekday() >= 5),
            }
        )
    return rows


# Absolute amount thresholds for anomaly detection fallback.
# Transactions exceeding these are always flagged, even with few data points.
_ABSOLUTE_THRESHOLD_HIGH = 500_000   # Rs. 5,00,000
_RATIO_THRESHOLD = 10                # 10x the median = suspicious


def _statistical_fallback(transactions: list) -> list[AnomalyResult]:
    if not transactions:
        return []

    amounts = np.array([float(transaction.amount) for transaction in transactions], dtype=float)
    mean = float(amounts.mean())
    std = float(amounts.std())
    median = float(np.median(amounts))

    results = []
    for transaction, amount in zip(transactions, amounts):
        is_anomaly = False
        anomaly_score = 0.0
        reason = ""

        # Check 1: Absolute threshold for extremely large amounts.
        if amount >= _ABSOLUTE_THRESHOLD_HIGH:
            is_anomaly = True
            anomaly_score = max(anomaly_score, round(amount / _ABSOLUTE_THRESHOLD_HIGH, 6))
            reason = f"Amount Rs. {amount:,.0f} exceeds the safe threshold of Rs. {_ABSOLUTE_THRESHOLD_HIGH:,}."

        # Check 2: Ratio-based check against the median.
        if median > 0 and amount >= median * _RATIO_THRESHOLD:
            ratio = amount / median
            is_anomaly = True
            anomaly_score = max(anomaly_score, round(ratio, 6))
            if not reason:
                reason = f"Amount is {ratio:.1f}x the median transaction amount."

        # Check 3: Z-score check with a lower threshold for small datasets.
        if std > 0:
            z_score = abs((amount - mean) / std)
            if z_score >= 2.0:
                is_anomaly = True
                anomaly_score = max(anomaly_score, round(float(z_score), 6))
                if not reason:
                    reason = "Amount is far from the user's average for this small dataset."

        if not is_anomaly:
            reason = "Looks consistent with recent transaction patterns."

        results.append(
            AnomalyResult(
                transaction_id=transaction.id,
                is_anomaly=is_anomaly,
                anomaly_score=anomaly_score,
                reason=reason,
            )
        )
    return results


def _build_reason(transaction, is_anomaly: bool, fallback: bool = False) -> str:
    if not is_anomaly:
        return "Looks consistent with recent transaction patterns."

    category = transaction.category.name if transaction.category else "Uncategorized"
    if fallback:
        return "Amount is far from the user's average for this small dataset."
    return f"Unusual combination of amount, timing, type, and category ({category})."
