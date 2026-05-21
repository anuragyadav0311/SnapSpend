from __future__ import annotations

from collections import defaultdict
from dataclasses import dataclass
from datetime import date, datetime, time
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


MODEL_CACHE_VERSION = "2026-05-21-v3"
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


@dataclass(frozen=True)
class HeuristicAssessment:
    is_anomaly: bool
    anomaly_score: float
    reason: str
    consistent_pattern: bool = False


class TransactionAnomalyDetector:
    """Hybrid anomaly detector with richer behavioral features."""

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
            n_estimators=300,
            max_samples="auto",
            bootstrap=False,
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
        transaction_list = _sort_transactions(transactions)
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
                    transaction_id=getattr(transaction, "id", -1),
                    is_anomaly=is_anomaly,
                    anomaly_score=round(anomaly_score, 6),
                    reason=_build_model_reason(transaction, is_anomaly),
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


class HistoryPatternTracker:
    """Incrementally scores transactions against past user behavior."""

    def __init__(self, transactions: Iterable = ()):
        self.global_amounts: list[float] = []
        self.type_amounts: dict[str, list[float]] = defaultdict(list)
        self.category_amounts: dict[str, list[float]] = defaultdict(list)
        self.title_amounts: dict[str, list[float]] = defaultdict(list)
        self.category_weekdays: dict[str, list[int]] = defaultdict(lambda: [0] * 7)
        self.category_days_of_month: dict[str, list[int]] = defaultdict(list)
        self.category_last_seen: dict[str, date] = {}
        self.title_last_seen: dict[str, date] = {}
        self.category_intervals: dict[str, list[int]] = defaultdict(list)
        self.title_intervals: dict[str, list[int]] = defaultdict(list)

        for transaction in _sort_transactions(transactions):
            self.ingest(transaction)

    def ingest(self, transaction) -> None:
        amount = float(transaction.amount)
        tx_type = getattr(transaction, "type", "unknown") or "unknown"
        category_name = _category_name(transaction)
        title_name = _title_name(transaction)
        tx_date = _transaction_date(transaction)
        category_key = _category_key(tx_type, category_name)
        title_key = _title_key(tx_type, title_name)

        self.global_amounts.append(amount)
        self.type_amounts[tx_type].append(amount)
        self.category_amounts[category_key].append(amount)
        self.title_amounts[title_key].append(amount)
        self.category_weekdays[category_key][tx_date.weekday()] += 1
        self.category_days_of_month[category_key].append(tx_date.day)

        previous_category_date = self.category_last_seen.get(category_key)
        if previous_category_date:
            gap = max(0, (tx_date - previous_category_date).days)
            self.category_intervals[category_key].append(gap)
        self.category_last_seen[category_key] = tx_date

        previous_title_date = self.title_last_seen.get(title_key)
        if previous_title_date:
            gap = max(0, (tx_date - previous_title_date).days)
            self.title_intervals[title_key].append(gap)
        self.title_last_seen[title_key] = tx_date

    def assess(self, transaction) -> HeuristicAssessment:
        if not self.global_amounts:
            return _absolute_threshold_assessment(transaction)

        amount = float(transaction.amount)
        tx_type = getattr(transaction, "type", "unknown") or "unknown"
        category_name = _category_name(transaction)
        title_name = _title_name(transaction)
        tx_date = _transaction_date(transaction)

        category_key = _category_key(tx_type, category_name)
        title_key = _title_key(tx_type, title_name)

        type_values = self.type_amounts.get(tx_type, [])
        category_values = self.category_amounts.get(category_key, [])
        title_values = self.title_amounts.get(title_key, [])
        category_count = len(category_values)
        title_count = len(title_values)
        type_count = len(type_values)

        global_median = _median(self.global_amounts) or amount or 1.0
        type_median = _median(type_values) or global_median
        category_median = _median(category_values) or type_median
        title_median = _median(title_values) or category_median

        if title_count >= 2:
            context_label = f"previous \"{title_name}\" expenses"
            context_median = title_median
        elif category_count >= 3:
            context_label = f"usual {category_name.lower()} expenses"
            context_median = category_median
        elif type_count >= 6:
            context_label = f"usual {tx_type.lower()} expenses"
            context_median = type_median
        else:
            context_label = "recent expenses"
            context_median = global_median

        ratio = amount / _safe_denominator(context_median)
        category_z = _robust_z(amount, category_values)
        title_z = _robust_z(amount, title_values)
        weekday_share = 0.0
        category_weekdays = self.category_weekdays.get(category_key, [0] * 7)
        if category_count:
            weekday_share = category_weekdays[tx_date.weekday()] / category_count

        category_interval_median = _median(self.category_intervals.get(category_key, []))
        category_last_seen = self.category_last_seen.get(category_key)
        current_gap = (tx_date - category_last_seen).days if category_last_seen else None
        category_dom_median = _median(self.category_days_of_month.get(category_key, []))
        monthly_pattern = category_interval_median and 26 <= category_interval_median <= 32
        stable_amount = 0.65 <= ratio <= 1.6
        near_expected_gap = current_gap is not None and abs(current_gap - category_interval_median) <= 5 if category_interval_median else False
        near_expected_dom = bool(category_dom_median) and abs(tx_date.day - category_dom_median) <= 5

        risk_score = 0.0
        consistent_pattern = False
        triggers: list[str] = []
        stabilizers: list[str] = []

        if amount >= _ABSOLUTE_THRESHOLD_HIGH:
            risk_score += 4.0
            triggers.append(
                f"Amount Rs. {amount:,.0f} exceeds the safe threshold of Rs. {_ABSOLUTE_THRESHOLD_HIGH:,}."
            )

        if title_count >= 2 and ratio >= _TITLE_RATIO_THRESHOLD:
            risk_score += 2.4
            triggers.append(f"Amount is {ratio:.1f}x higher than the user's normal {title_name} expense.")
        elif category_count >= 3 and ratio >= _CATEGORY_RATIO_THRESHOLD:
            risk_score += 2.2
            triggers.append(f"Amount is {ratio:.1f}x higher than the user's usual {category_name.lower()} expense.")
        elif type_count >= 6 and ratio >= _TYPE_RATIO_THRESHOLD:
            risk_score += 1.6
            triggers.append(f"Amount is much higher than the user's normal {tx_type.lower()} spending.")

        if category_count >= 4 and category_z >= _ROBUST_Z_THRESHOLD:
            risk_score += 1.8
            triggers.append(f"Amount is far outside the normal {category_name.lower()} range.")
        if title_count >= 3 and title_z >= _TITLE_ROBUST_Z_THRESHOLD:
            risk_score += 1.1
            triggers.append(f"Amount is far outside the user's previous {title_name} amounts.")

        if category_count == 0 and amount >= max(global_median * _NEW_CATEGORY_RATIO_THRESHOLD, type_median * 3.0, _NEW_CATEGORY_AMOUNT_FLOOR):
            risk_score += 2.2
            triggers.append(f"This is the first {category_name.lower()} expense and it is unusually large.")
        elif category_count < 2 and amount >= max(type_median * 4.0, global_median * 4.0, 15000.0):
            risk_score += 0.9
            triggers.append(f"The user has very little {category_name.lower()} history for an expense this large.")

        if title_count == 0 and amount >= max(global_median * _NEW_TITLE_RATIO_THRESHOLD, 15000.0):
            risk_score += 1.0
            triggers.append(f"The user has never recorded a {title_name} expense this large before.")

        if monthly_pattern and stable_amount and (near_expected_gap or near_expected_dom):
            consistent_pattern = True
            risk_score -= 1.8
            stabilizers.append(f"Matches the user's usual monthly {category_name.lower()} pattern.")
        elif monthly_pattern and current_gap is not None and current_gap < max(7, int(category_interval_median * 0.45)) and ratio >= 2.0:
            risk_score += 0.8
            triggers.append(f"This {category_name.lower()} expense arrived much sooner than the usual recurring cycle.")

        if category_count >= 5 and ratio >= 2.0 and weekday_share <= 0.1:
            risk_score += 0.6
            triggers.append(f"The transaction day is unusual for the user's {category_name.lower()} pattern.")
        elif category_count >= 5 and stable_amount and weekday_share >= 0.2:
            consistent_pattern = True
            risk_score -= 0.3
            stabilizers.append(f"The transaction day matches the user's usual {category_name.lower()} timing.")

        if category_count >= 3 and ratio <= 1.75 and category_z <= 2.5:
            consistent_pattern = True
            stabilizers.append(f"Amount is within the user's normal {category_name.lower()} range.")

        risk_score = max(0.0, risk_score)
        is_anomaly = risk_score >= _HEURISTIC_ANOMALY_THRESHOLD

        if is_anomaly:
            reason = " ".join(dict.fromkeys(triggers[:2])) if triggers else f"Looks unusual compared with the user's {context_label}."
        elif consistent_pattern and stabilizers:
            reason = stabilizers[0]
        else:
            reason = "Looks consistent with recent transaction patterns."

        return HeuristicAssessment(
            is_anomaly=is_anomaly,
            anomaly_score=round(risk_score, 6),
            reason=reason,
            consistent_pattern=consistent_pattern,
        )


def detect_anomalies(
    transactions: Iterable,
    contamination: float = DEFAULT_CONTAMINATION,
    min_training_samples: int = DEFAULT_MIN_TRAINING_SAMPLES,
    cache_key: str | None = None,
    use_cache: bool = DEFAULT_CACHE_ENABLED,
) -> list[AnomalyResult]:
    transaction_list = list(transactions)
    if not transaction_list:
        return []

    heuristic_results = _sequential_heuristic_results(transaction_list)
    if len(transaction_list) < min_training_samples:
        return [heuristic_results[getattr(transaction, "id", -1)] for transaction in transaction_list]

    detector = _load_or_train_detector(
        transaction_list,
        contamination=contamination,
        min_training_samples=min_training_samples,
        cache_key=cache_key,
        use_cache=use_cache,
    )
    model_results = {
        result.transaction_id: result
        for result in detector.predict(transaction_list)
    }

    return [
        _combine_model_and_history_result(
            transaction,
            model_results.get(getattr(transaction, "id", -1)),
            heuristic_results[getattr(transaction, "id", -1)],
        )
        for transaction in transaction_list
    ]


def score_new_transaction(
    history_transactions: Iterable,
    candidate_transaction,
    contamination: float = DEFAULT_CONTAMINATION,
    min_training_samples: int = DEFAULT_MIN_TRAINING_SAMPLES,
    cache_key: str | None = None,
    use_cache: bool = DEFAULT_CACHE_ENABLED,
) -> AnomalyResult:
    history_list = _sort_transactions(history_transactions)
    history_assessment = HistoryPatternTracker(history_list).assess(candidate_transaction)

    if not history_list:
        return _assessment_to_result(candidate_transaction, history_assessment)

    if len(history_list) < min_training_samples:
        return _assessment_to_result(candidate_transaction, history_assessment)

    detector = _load_or_train_detector(
        history_list,
        contamination=contamination,
        min_training_samples=min_training_samples,
        cache_key=cache_key,
        use_cache=use_cache,
    )
    model_result = detector.predict([candidate_transaction])[0]
    return _combine_model_and_history_result(candidate_transaction, model_result, history_assessment)


def get_model_cache_path(cache_key: str) -> Path:
    normalized_key = hashlib.sha1(str(cache_key).encode("utf-8")).hexdigest()
    return _cache_dir() / f"{normalized_key}.joblib"


def build_reference_stats(transactions: Iterable) -> dict:
    type_amounts: dict[str, list[float]] = defaultdict(list)
    category_amounts: dict[str, list[float]] = defaultdict(list)
    title_amounts: dict[str, list[float]] = defaultdict(list)
    category_weekdays: dict[str, list[int]] = defaultdict(lambda: [0] * 7)
    category_days_of_month: dict[str, list[int]] = defaultdict(list)
    category_intervals: dict[str, list[int]] = defaultdict(list)
    title_intervals: dict[str, list[int]] = defaultdict(list)
    category_last_seen: dict[str, date] = {}
    title_last_seen: dict[str, date] = {}
    global_amounts: list[float] = []

    for transaction in _sort_transactions(transactions):
        amount = float(transaction.amount)
        tx_type = getattr(transaction, "type", "unknown") or "unknown"
        category_name = _category_name(transaction)
        title_name = _title_name(transaction)
        tx_date = _transaction_date(transaction)
        category_key = _category_key(tx_type, category_name)
        title_key = _title_key(tx_type, title_name)

        global_amounts.append(amount)
        type_amounts[tx_type].append(amount)
        category_amounts[category_key].append(amount)
        title_amounts[title_key].append(amount)
        category_weekdays[category_key][tx_date.weekday()] += 1
        category_days_of_month[category_key].append(tx_date.day)

        previous_category_date = category_last_seen.get(category_key)
        if previous_category_date:
            category_intervals[category_key].append(max(0, (tx_date - previous_category_date).days))
        category_last_seen[category_key] = tx_date

        previous_title_date = title_last_seen.get(title_key)
        if previous_title_date:
            title_intervals[title_key].append(max(0, (tx_date - previous_title_date).days))
        title_last_seen[title_key] = tx_date

    return {
        "global_median": _median(global_amounts),
        "global_std": _std(global_amounts),
        "global_mad": _mad(global_amounts),
        "type_medians": {key: _median(values) for key, values in type_amounts.items()},
        "type_stds": {key: _std(values) for key, values in type_amounts.items()},
        "type_mads": {key: _mad(values) for key, values in type_amounts.items()},
        "type_counts": {key: len(values) for key, values in type_amounts.items()},
        "category_medians": {key: _median(values) for key, values in category_amounts.items()},
        "category_stds": {key: _std(values) for key, values in category_amounts.items()},
        "category_mads": {key: _mad(values) for key, values in category_amounts.items()},
        "category_counts": {key: len(values) for key, values in category_amounts.items()},
        "title_medians": {key: _median(values) for key, values in title_amounts.items()},
        "title_stds": {key: _std(values) for key, values in title_amounts.items()},
        "title_mads": {key: _mad(values) for key, values in title_amounts.items()},
        "title_counts": {key: len(values) for key, values in title_amounts.items()},
        "category_weekdays": dict(category_weekdays),
        "category_dom_medians": {key: _median(values) for key, values in category_days_of_month.items()},
        "category_interval_medians": {key: _median(values) for key, values in category_intervals.items()},
        "title_interval_medians": {key: _median(values) for key, values in title_intervals.items()},
    }


def transactions_to_feature_rows(transactions: Iterable, reference_stats: dict | None = None) -> list[dict]:
    transaction_list = list(transactions)
    stats = reference_stats or build_reference_stats(transaction_list)
    rows = []
    for transaction in transaction_list:
        category_name = _category_name(transaction)
        title_name = _title_name(transaction)
        tx_type = getattr(transaction, "type", "unknown") or "unknown"
        amount = float(transaction.amount)
        tx_date = _transaction_date(transaction)
        category_key = _category_key(tx_type, category_name)
        title_key = _title_key(tx_type, title_name)

        global_median = stats.get("global_median") or amount or 1.0
        type_median = stats.get("type_medians", {}).get(tx_type, global_median)
        category_median = stats.get("category_medians", {}).get(category_key, type_median)
        title_median = stats.get("title_medians", {}).get(title_key, category_median)
        type_count = stats.get("type_counts", {}).get(tx_type, 0)
        category_count = stats.get("category_counts", {}).get(category_key, 0)
        title_count = stats.get("title_counts", {}).get(title_key, 0)
        category_weekdays = stats.get("category_weekdays", {}).get(category_key, [0] * 7)
        weekday_frequency = (category_weekdays[tx_date.weekday()] / category_count) if category_count else 0.0
        category_dom_median = stats.get("category_dom_medians", {}).get(category_key, tx_date.day)
        category_interval_median = stats.get("category_interval_medians", {}).get(category_key, 0.0)

        rows.append(
            {
                "amount": amount,
                "log_amount": round(math.log1p(max(amount, 0.0)), 6),
                "type": tx_type,
                "category_name": category_name,
                "title_name": title_name,
                "day_of_week": tx_date.weekday(),
                "day_of_month": tx_date.day,
                "month": tx_date.month,
                "is_weekend": int(tx_date.weekday() >= 5),
                "amount_vs_type_median": round(amount / _safe_denominator(type_median), 6),
                "amount_vs_category_median": round(amount / _safe_denominator(category_median), 6),
                "amount_vs_title_median": round(amount / _safe_denominator(title_median), 6),
                "type_amount_robust_z": round(_robust_z_from_stats(amount, type_median, stats.get("type_mads", {}).get(tx_type, 0.0)), 6),
                "category_amount_robust_z": round(_robust_z_from_stats(amount, category_median, stats.get("category_mads", {}).get(category_key, 0.0)), 6),
                "title_amount_robust_z": round(_robust_z_from_stats(amount, title_median, stats.get("title_mads", {}).get(title_key, 0.0)), 6),
                "category_weekday_frequency": round(weekday_frequency, 6),
                "category_dom_distance": round(abs(tx_date.day - category_dom_median), 6),
                "category_interval_median": round(float(category_interval_median or 0.0), 6),
                "known_type_count": type_count,
                "known_category_count": category_count,
                "known_title_count": title_count,
            }
        )
    return rows


_ABSOLUTE_THRESHOLD_HIGH = 500_000  # Rs. 5,00,000
_TYPE_RATIO_THRESHOLD = 7.5
_CATEGORY_RATIO_THRESHOLD = 5.5
_TITLE_RATIO_THRESHOLD = 4.5
_ROBUST_Z_THRESHOLD = 4.5
_TITLE_ROBUST_Z_THRESHOLD = 4.0
_NEW_CATEGORY_RATIO_THRESHOLD = 3.5
_NEW_CATEGORY_AMOUNT_FLOOR = 20_000.0
_NEW_TITLE_RATIO_THRESHOLD = 2.75
_HEURISTIC_ANOMALY_THRESHOLD = 3.0
_LOW_CONFIDENCE_SCORE_THRESHOLD = 0.03
_LOW_CONFIDENCE_RATIO_THRESHOLD = 1.75


def _assessment_to_result(transaction, assessment: HeuristicAssessment) -> AnomalyResult:
    return AnomalyResult(
        transaction_id=getattr(transaction, "id", -1),
        is_anomaly=assessment.is_anomaly,
        anomaly_score=round(float(assessment.anomaly_score), 6),
        reason=assessment.reason,
    )


def _combine_model_and_history_result(
    transaction,
    model_result: AnomalyResult | None,
    history_assessment: HeuristicAssessment,
) -> AnomalyResult:
    if history_assessment.is_anomaly:
        return AnomalyResult(
            transaction_id=getattr(transaction, "id", -1),
            is_anomaly=True,
            anomaly_score=round(max(history_assessment.anomaly_score, model_result.anomaly_score if model_result else 0.0), 6),
            reason=history_assessment.reason,
        )

    if model_result and model_result.is_anomaly:
        if history_assessment.consistent_pattern:
            return AnomalyResult(
                transaction_id=getattr(transaction, "id", -1),
                is_anomaly=False,
                anomaly_score=0.0,
                reason=history_assessment.reason,
            )
        return AnomalyResult(
            transaction_id=getattr(transaction, "id", -1),
            is_anomaly=True,
            anomaly_score=round(max(model_result.anomaly_score, history_assessment.anomaly_score), 6),
            reason=model_result.reason,
        )

    return AnomalyResult(
        transaction_id=getattr(transaction, "id", -1),
        is_anomaly=False,
        anomaly_score=0.0,
        reason=history_assessment.reason,
    )


def _absolute_threshold_assessment(transaction) -> HeuristicAssessment:
    amount = float(transaction.amount)
    is_anomaly = amount >= _ABSOLUTE_THRESHOLD_HIGH
    score = round(amount / _ABSOLUTE_THRESHOLD_HIGH, 6) if is_anomaly else 0.0
    reason = (
        f"Amount Rs. {amount:,.0f} exceeds the safe threshold of Rs. {_ABSOLUTE_THRESHOLD_HIGH:,}."
        if is_anomaly
        else "Not enough historical transactions yet to assess this entry confidently."
    )
    return HeuristicAssessment(
        is_anomaly=is_anomaly,
        anomaly_score=score,
        reason=reason,
        consistent_pattern=False,
    )


def _sequential_heuristic_results(transactions: Iterable) -> dict[int, AnomalyResult]:
    tracker = HistoryPatternTracker()
    ordered_transactions = _sort_transactions(transactions)
    results: dict[int, AnomalyResult] = {}
    for transaction in ordered_transactions:
        assessment = tracker.assess(transaction)
        results[getattr(transaction, "id", -1)] = _assessment_to_result(transaction, assessment)
        tracker.ingest(transaction)
    return results


def _load_or_train_detector(
    transactions: list,
    contamination: float,
    min_training_samples: int,
    cache_key: str | None,
    use_cache: bool,
) -> TransactionAnomalyDetector:
    sorted_transactions = _sort_transactions(transactions)
    if not use_cache or not cache_key:
        return TransactionAnomalyDetector(
            contamination=contamination,
            min_training_samples=min_training_samples,
        ).fit(sorted_transactions)

    fingerprint = _build_training_fingerprint(
        sorted_transactions,
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
    ).fit(sorted_transactions)
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
                    _title_name(transaction),
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


def _build_model_reason(transaction, is_anomaly: bool) -> str:
    if not is_anomaly:
        return "Looks consistent with recent transaction patterns."
    category = _category_name(transaction)
    return f"Unusual combination of amount, timing, title, and category ({category})."


def _category_name(transaction) -> str:
    category = getattr(transaction, "category", None)
    return category.name if category else "Uncategorized"


def _title_name(transaction) -> str:
    raw_title = getattr(transaction, "title", "") or "Untitled"
    normalized = " ".join(str(raw_title).strip().lower().split())
    return normalized[:80] or "untitled"


def _category_key(tx_type: str, category_name: str) -> str:
    return f"{tx_type}::{category_name}"


def _title_key(tx_type: str, title_name: str) -> str:
    return f"{tx_type}::{title_name}"


def _transaction_date(transaction) -> date:
    tx_date = getattr(transaction, "date", None)
    if isinstance(tx_date, datetime):
        return tx_date.date()
    return tx_date or date.today()


def _created_at_sort_value(transaction) -> datetime:
    created_at = getattr(transaction, "created_at", None)
    if isinstance(created_at, datetime):
        return created_at
    if isinstance(created_at, date):
        return datetime.combine(created_at, time.min)
    return datetime.min


def _sort_transactions(transactions: Iterable) -> list:
    return sorted(
        list(transactions),
        key=lambda transaction: (
            _transaction_date(transaction),
            _created_at_sort_value(transaction),
            getattr(transaction, "id", 0),
        ),
    )


def _safe_denominator(value: float) -> float:
    return max(float(value or 0.0), 1.0)


def _median(values: list[float | int]) -> float:
    if not values:
        return 0.0
    return float(np.median(np.array(values, dtype=float)))


def _std(values: list[float]) -> float:
    if len(values) < 2:
        return 0.0
    return float(np.std(np.array(values, dtype=float)))


def _mad(values: list[float]) -> float:
    if len(values) < 2:
        return 0.0
    arr = np.array(values, dtype=float)
    median = np.median(arr)
    return float(np.median(np.abs(arr - median)))


def _robust_z(value: float, values: list[float]) -> float:
    if len(values) < 3:
        return 0.0
    return _robust_z_from_stats(value, _median(values), _mad(values))


def _robust_z_from_stats(value: float, median: float, mad: float) -> float:
    if mad <= 0:
        return 0.0
    return abs(value - median) / max(mad * 1.4826, 1.0)


def _cache_dir() -> Path:
    return Path(getattr(settings, "ML_ANOMALY_CACHE_DIR", DEFAULT_CACHE_DIR))


def _should_suppress_model_anomaly(transaction, anomaly_score: float, reference_stats: dict) -> bool:
    if anomaly_score >= _LOW_CONFIDENCE_SCORE_THRESHOLD:
        return False

    amount = float(transaction.amount)
    tx_type = getattr(transaction, "type", "unknown") or "unknown"
    category_name = _category_name(transaction)
    title_name = _title_name(transaction)
    category_key = _category_key(tx_type, category_name)
    title_key = _title_key(tx_type, title_name)

    global_median = reference_stats.get("global_median") or amount or 1.0
    type_median = reference_stats.get("type_medians", {}).get(tx_type, global_median)
    category_median = reference_stats.get("category_medians", {}).get(category_key, type_median)
    title_median = reference_stats.get("title_medians", {}).get(title_key, category_median)
    context_median = title_median if reference_stats.get("title_counts", {}).get(title_key, 0) >= 2 else category_median

    ratio = amount / _safe_denominator(context_median)
    inverse_ratio = context_median / _safe_denominator(amount)
    return max(ratio, inverse_ratio) <= _LOW_CONFIDENCE_RATIO_THRESHOLD
