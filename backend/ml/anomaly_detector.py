from __future__ import annotations

from collections import defaultdict
from dataclasses import dataclass
from datetime import date
import hashlib
import math
from pathlib import Path
from typing import Iterable

from django.conf import settings
import joblib
import numpy as np
from sklearn.ensemble import IsolationForest
from sklearn.feature_extraction import DictVectorizer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler


MODEL_CACHE_VERSION = "2026-05-19-v2"
DEFAULT_CONTAMINATION = getattr(settings, "ML_ANOMALY_DEFAULT_CONTAMINATION", 0.05)
DEFAULT_MIN_TRAINING_SAMPLES = getattr(settings, "ML_ANOMALY_MIN_TRAINING_SAMPLES", 10)
DEFAULT_CACHE_ENABLED = getattr(settings, "ML_ANOMALY_CACHE_ENABLED", True)
DEFAULT_CACHE_DIR = Path(getattr(settings, "ML_ANOMALY_CACHE_DIR", "backend/ml/model_cache"))


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
        self.effective_contamination = contamination
        self.reference_stats: dict = {}
        self.training_fingerprint = ""
        self.training_count = 0
        self.pipeline = self._build_pipeline(self.effective_contamination)
        self._is_fit = False

    def _build_pipeline(self, contamination: float) -> Pipeline:
        model = IsolationForest(
            contamination=contamination,
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
        transaction_list = list(transactions)
        self.reference_stats = build_reference_stats(transaction_list)
        rows = transactions_to_feature_rows(transaction_list, reference_stats=self.reference_stats)
        if len(rows) < self.min_training_samples:
            raise ValueError(
                f"Isolation Forest needs at least {self.min_training_samples} transactions; "
                f"got {len(rows)}."
            )
        self.effective_contamination = _effective_contamination(self.contamination, len(rows))
        self.pipeline = self._build_pipeline(self.effective_contamination)
        self.pipeline.fit(rows)
        self.training_count = len(transaction_list)
        self._is_fit = True
        return self

    def predict(self, transactions: Iterable) -> list[AnomalyResult]:
        if not self._is_fit:
            raise ValueError("Fit or load the anomaly detector before calling predict.")

        transaction_list = list(transactions)
        rows = transactions_to_feature_rows(transaction_list, reference_stats=self.reference_stats)
        predictions = self.pipeline.predict(rows)
        decision_scores = self.pipeline.decision_function(rows)

        results = []
        for transaction, prediction, decision_score in zip(transaction_list, predictions, decision_scores):
            is_anomaly = prediction == -1
            anomaly_score = float(max(0.0, -decision_score))
            if is_anomaly and _should_suppress_model_anomaly(transaction, anomaly_score, self.reference_stats):
                is_anomaly = False
                anomaly_score = 0.0
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
                "effective_contamination": self.effective_contamination,
                "random_state": self.random_state,
                "min_training_samples": self.min_training_samples,
                "reference_stats": self.reference_stats,
                "training_fingerprint": self.training_fingerprint,
                "training_count": self.training_count,
                "model_cache_version": MODEL_CACHE_VERSION,
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
        detector.effective_contamination = payload.get("effective_contamination", detector.contamination)
        detector.reference_stats = payload.get("reference_stats", {})
        detector.training_fingerprint = payload.get("training_fingerprint", "")
        detector.training_count = payload.get("training_count", 0)
        detector._is_fit = True
        return detector


def detect_anomalies(
    transactions: Iterable,
    contamination: float = DEFAULT_CONTAMINATION,
    min_training_samples: int = DEFAULT_MIN_TRAINING_SAMPLES,
    cache_key: str | None = None,
    use_cache: bool = DEFAULT_CACHE_ENABLED,
) -> list[AnomalyResult]:
    transaction_list = list(transactions)
    if len(transaction_list) < min_training_samples:
        return _statistical_fallback(transaction_list)

    detector = _load_or_train_detector(
        transaction_list,
        contamination=contamination,
        min_training_samples=min_training_samples,
        cache_key=cache_key,
        use_cache=use_cache,
    )
    return detector.predict(transaction_list)


def score_new_transaction(
    history_transactions: Iterable,
    candidate_transaction,
    contamination: float = DEFAULT_CONTAMINATION,
    min_training_samples: int = DEFAULT_MIN_TRAINING_SAMPLES,
    cache_key: str | None = None,
    use_cache: bool = DEFAULT_CACHE_ENABLED,
) -> AnomalyResult:
    history_list = list(history_transactions)
    if not history_list:
        return _score_candidates_against_history([], [candidate_transaction])[0]

    if len(history_list) < min_training_samples:
        return _score_candidates_against_history(history_list, [candidate_transaction])[0]

    detector = _load_or_train_detector(
        history_list,
        contamination=contamination,
        min_training_samples=min_training_samples,
        cache_key=cache_key,
        use_cache=use_cache,
    )
    return detector.predict([candidate_transaction])[0]


def get_model_cache_path(cache_key: str) -> Path:
    normalized_key = hashlib.sha1(str(cache_key).encode("utf-8")).hexdigest()
    return _cache_dir() / f"{normalized_key}.joblib"


def build_reference_stats(transactions: Iterable) -> dict:
    type_amounts: dict[str, list[float]] = defaultdict(list)
    category_amounts: dict[str, list[float]] = defaultdict(list)
    global_amounts: list[float] = []

    for transaction in transactions:
        amount = float(transaction.amount)
        tx_type = getattr(transaction, "type", "unknown") or "unknown"
        category_name = _category_name(transaction)
        category_key = _category_key(tx_type, category_name)

        global_amounts.append(amount)
        type_amounts[tx_type].append(amount)
        category_amounts[category_key].append(amount)

    return {
        "global_median": _median(global_amounts),
        "global_std": _std(global_amounts),
        "type_medians": {key: _median(values) for key, values in type_amounts.items()},
        "type_stds": {key: _std(values) for key, values in type_amounts.items()},
        "type_counts": {key: len(values) for key, values in type_amounts.items()},
        "category_medians": {key: _median(values) for key, values in category_amounts.items()},
        "category_stds": {key: _std(values) for key, values in category_amounts.items()},
        "category_counts": {key: len(values) for key, values in category_amounts.items()},
    }


def transactions_to_feature_rows(transactions: Iterable, reference_stats: dict | None = None) -> list[dict]:
    transaction_list = list(transactions)
    stats = reference_stats or build_reference_stats(transaction_list)
    rows = []
    for transaction in transaction_list:
        category_name = _category_name(transaction)
        tx_type = getattr(transaction, "type", "unknown") or "unknown"
        amount = float(transaction.amount)
        tx_date = transaction.date or date.today()
        category_key = _category_key(tx_type, category_name)

        global_median = stats.get("global_median") or amount or 1.0
        type_median = stats.get("type_medians", {}).get(tx_type, global_median)
        category_median = stats.get("category_medians", {}).get(category_key, type_median)
        type_count = stats.get("type_counts", {}).get(tx_type, 0)
        category_count = stats.get("category_counts", {}).get(category_key, 0)

        rows.append(
            {
                "amount": amount,
                "log_amount": round(math.log1p(max(amount, 0.0)), 6),
                "type": tx_type,
                "category_name": category_name,
                "day_of_week": tx_date.weekday(),
                "day_of_month": tx_date.day,
                "month": tx_date.month,
                "is_weekend": int(tx_date.weekday() >= 5),
                "amount_vs_type_median": round(amount / _safe_denominator(type_median), 6),
                "amount_vs_category_median": round(amount / _safe_denominator(category_median), 6),
                "known_type_count": type_count,
                "known_category_count": category_count,
            }
        )
    return rows


# Absolute amount thresholds for anomaly detection fallback.
# Transactions exceeding these are always flagged, even with few data points.
_ABSOLUTE_THRESHOLD_HIGH = 500_000  # Rs. 5,00,000
_RATIO_THRESHOLD = 10
_CATEGORY_RATIO_THRESHOLD = 8
_Z_SCORE_THRESHOLD = 3.0
_LOW_CONFIDENCE_SCORE_THRESHOLD = 0.03
_LOW_CONFIDENCE_RATIO_THRESHOLD = 1.75


def _statistical_fallback(transactions: list) -> list[AnomalyResult]:
    if not transactions:
        return []

    results = _score_candidates_against_history(transactions, transactions)
    if any(result.is_anomaly for result in results):
        return results

    return [
        AnomalyResult(
            transaction_id=transaction.id,
            is_anomaly=False,
            anomaly_score=0.0,
            reason="Looks consistent with recent transaction patterns.",
        )
        for transaction in transactions
    ]


def _score_candidates_against_history(history_transactions: list, candidate_transactions: list) -> list[AnomalyResult]:
    if not candidate_transactions:
        return []

    if not history_transactions:
        return _absolute_threshold_only(candidate_transactions)

    history_stats = build_reference_stats(history_transactions)
    history_amounts = np.array([float(transaction.amount) for transaction in history_transactions], dtype=float)
    history_mean = float(history_amounts.mean())
    history_std = float(history_amounts.std())

    results = []
    for transaction in candidate_transactions:
        amount = float(transaction.amount)
        tx_type = getattr(transaction, "type", "unknown") or "unknown"
        category_name = _category_name(transaction)
        category_key = _category_key(tx_type, category_name)

        category_median = history_stats.get("category_medians", {}).get(category_key)
        category_count = history_stats.get("category_counts", {}).get(category_key, 0)
        type_median = history_stats.get("type_medians", {}).get(tx_type, history_stats.get("global_median", amount))
        context_median = category_median if category_count >= 3 else type_median
        ratio_threshold = _CATEGORY_RATIO_THRESHOLD if category_count >= 3 else _RATIO_THRESHOLD

        is_anomaly = False
        anomaly_score = 0.0
        reason = ""

        if amount >= _ABSOLUTE_THRESHOLD_HIGH:
            is_anomaly = True
            anomaly_score = max(anomaly_score, round(amount / _ABSOLUTE_THRESHOLD_HIGH, 6))
            reason = f"Amount Rs. {amount:,.0f} exceeds the safe threshold of Rs. {_ABSOLUTE_THRESHOLD_HIGH:,}."

        if context_median > 0 and amount >= context_median * ratio_threshold:
            ratio = amount / context_median
            is_anomaly = True
            anomaly_score = max(anomaly_score, round(ratio, 6))
            if not reason:
                reason = f"Amount is {ratio:.1f}x the usual {category_name.lower()} transaction amount."

        if history_std > 0:
            z_score = abs((amount - history_mean) / history_std)
            if z_score >= _Z_SCORE_THRESHOLD:
                is_anomaly = True
                anomaly_score = max(anomaly_score, round(float(z_score), 6))
                if not reason:
                    reason = "Amount is far from the user's historical average."

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


def _absolute_threshold_only(transactions: list) -> list[AnomalyResult]:
    results = []
    for transaction in transactions:
        amount = float(transaction.amount)
        is_anomaly = amount >= _ABSOLUTE_THRESHOLD_HIGH
        score = round(amount / _ABSOLUTE_THRESHOLD_HIGH, 6) if is_anomaly else 0.0
        reason = (
            f"Amount Rs. {amount:,.0f} exceeds the safe threshold of Rs. {_ABSOLUTE_THRESHOLD_HIGH:,}."
            if is_anomaly
            else "Not enough historical transactions yet to assess this entry confidently."
        )
        results.append(
            AnomalyResult(
                transaction_id=transaction.id,
                is_anomaly=is_anomaly,
                anomaly_score=score,
                reason=reason,
            )
        )
    return results


def _load_or_train_detector(
    transactions: list,
    contamination: float,
    min_training_samples: int,
    cache_key: str | None,
    use_cache: bool,
) -> TransactionAnomalyDetector:
    if not use_cache or not cache_key:
        return TransactionAnomalyDetector(
            contamination=contamination,
            min_training_samples=min_training_samples,
        ).fit(transactions)

    fingerprint = _build_training_fingerprint(
        transactions,
        contamination=contamination,
        min_training_samples=min_training_samples,
    )
    cache_path = get_model_cache_path(cache_key)

    if cache_path.exists():
        try:
            detector = TransactionAnomalyDetector.load(cache_path)
            if detector.training_fingerprint == fingerprint:
                return detector
        except Exception:
            pass

    detector = TransactionAnomalyDetector(
        contamination=contamination,
        min_training_samples=min_training_samples,
    ).fit(transactions)
    detector.training_fingerprint = fingerprint
    cache_path.parent.mkdir(parents=True, exist_ok=True)
    detector.save(cache_path)
    return detector


def _build_training_fingerprint(
    transactions: list,
    contamination: float,
    min_training_samples: int,
) -> str:
    chunks = [
        MODEL_CACHE_VERSION,
        f"contamination={round(float(contamination), 6)}",
        f"min_training_samples={min_training_samples}",
    ]
    for transaction in transactions:
        updated_at = getattr(transaction, "updated_at", "")
        if hasattr(updated_at, "isoformat"):
            updated_at = updated_at.isoformat()
        tx_date = getattr(transaction, "date", "")
        if hasattr(tx_date, "isoformat"):
            tx_date = tx_date.isoformat()
        chunks.append(
            "|".join(
                [
                    str(getattr(transaction, "id", "")),
                    getattr(transaction, "type", "") or "",
                    f"{float(transaction.amount):.2f}",
                    _category_name(transaction),
                    str(tx_date),
                    str(updated_at),
                ]
            )
        )
    payload = "\n".join(chunks).encode("utf-8")
    return hashlib.sha256(payload).hexdigest()


def _effective_contamination(requested: float, sample_count: int) -> float:
    requested_value = max(0.001, min(float(requested), 0.49))
    if sample_count <= 0:
        return requested_value
    if sample_count < 15:
        return min(requested_value, max(0.03, 1 / sample_count))
    if sample_count < 30:
        return min(requested_value, max(0.03, 2 / sample_count))
    if sample_count < 75:
        return min(requested_value, 0.08)
    return requested_value


def _build_reason(transaction, is_anomaly: bool) -> str:
    if not is_anomaly:
        return "Looks consistent with recent transaction patterns."

    category = _category_name(transaction)
    return f"Unusual combination of amount, timing, type, and category ({category})."


def _category_name(transaction) -> str:
    category = getattr(transaction, "category", None)
    return category.name if category else "Uncategorized"


def _category_key(tx_type: str, category_name: str) -> str:
    return f"{tx_type}::{category_name}"


def _safe_denominator(value: float) -> float:
    return max(float(value or 0.0), 1.0)


def _median(values: list[float]) -> float:
    if not values:
        return 0.0
    return float(np.median(np.array(values, dtype=float)))


def _std(values: list[float]) -> float:
    if len(values) < 2:
        return 0.0
    return float(np.std(np.array(values, dtype=float)))


def _cache_dir() -> Path:
    return Path(getattr(settings, "ML_ANOMALY_CACHE_DIR", DEFAULT_CACHE_DIR))


def _should_suppress_model_anomaly(transaction, anomaly_score: float, reference_stats: dict) -> bool:
    if anomaly_score >= _LOW_CONFIDENCE_SCORE_THRESHOLD:
        return False

    amount = float(transaction.amount)
    tx_type = getattr(transaction, "type", "unknown") or "unknown"
    category_name = _category_name(transaction)
    category_key = _category_key(tx_type, category_name)

    global_median = reference_stats.get("global_median") or amount or 1.0
    type_median = reference_stats.get("type_medians", {}).get(tx_type, global_median)
    category_median = reference_stats.get("category_medians", {}).get(category_key, type_median)
    context_median = category_median or type_median or global_median

    ratio = amount / _safe_denominator(context_median)
    inverse_ratio = context_median / _safe_denominator(amount)
    return max(ratio, inverse_ratio) <= _LOW_CONFIDENCE_RATIO_THRESHOLD
