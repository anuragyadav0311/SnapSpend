from __future__ import annotations

import csv
import json
import random
import re
from collections import Counter
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[2]
RAW_DATASET = PROJECT_ROOT / "dataset" / "Income_expense_data.csv"
PROCESSED_DIR = PROJECT_ROOT / "dataset" / "processed"
RANDOM_SEED = 42
TEST_SIZE = 0.2


RAW_TO_CLEAN_COLUMNS = {
    "REF_DATE": "year",
    "GEO": "geo",
    "Statistic": "statistic",
    "Before-tax household income quintile": "income_quintile",
    "Household expenditures, summary-level categories": "expense_category",
    "UOM": "unit",
    "COORDINATE": "coordinate",
    "Expense": "expense",
    "Family type": "family_type",
    "Age of older adult": "age_group",
    "Family income": "family_income_group",
    "Income": "income",
}

MODEL_COLUMNS = [
    "year",
    "year_index",
    "geo",
    "income_quintile",
    "expense_category",
    "coordinate",
    "expense",
    "log_expense",
    "age_group",
    "family_income_group",
    "income",
    "log_income",
    "expense_to_income_ratio",
]


def preprocess_dataset(
    raw_path: Path = RAW_DATASET,
    output_dir: Path = PROCESSED_DIR,
    test_size: float = TEST_SIZE,
    random_seed: int = RANDOM_SEED,
) -> dict:
    rows, quality = _load_and_clean_rows(raw_path)
    train_rows, test_rows = _split_rows(rows, test_size=test_size, random_seed=random_seed)

    output_dir.mkdir(parents=True, exist_ok=True)
    clean_path = output_dir / "income_expense_clean.csv"
    train_path = output_dir / "income_expense_train.csv"
    test_path = output_dir / "income_expense_test.csv"
    metadata_path = output_dir / "metadata.json"

    _write_csv(clean_path, rows)
    _write_csv(train_path, train_rows)
    _write_csv(test_path, test_rows)

    metadata = {
        **quality,
        "clean_rows": len(rows),
        "train_rows": len(train_rows),
        "test_rows": len(test_rows),
        "test_size": test_size,
        "random_seed": random_seed,
        "model_columns": MODEL_COLUMNS,
        "outputs": {
            "clean": str(clean_path.relative_to(PROJECT_ROOT)),
            "train": str(train_path.relative_to(PROJECT_ROOT)),
            "test": str(test_path.relative_to(PROJECT_ROOT)),
        },
    }
    metadata_path.write_text(json.dumps(metadata, indent=2), encoding="utf-8")
    return metadata


def _load_and_clean_rows(raw_path: Path) -> tuple[list[dict], dict]:
    with raw_path.open(newline="", encoding="utf-8-sig") as raw_file:
        reader = csv.DictReader(raw_file)
        raw_rows = list(reader)

    clean_rows = []
    missing_by_column = Counter()
    dropped_reasons = Counter()

    for row in raw_rows:
        for column, value in row.items():
            if value is None or value.strip() == "":
                missing_by_column[column] += 1

        expense = _parse_float(row.get("Expense"))
        income = _parse_float(row.get("Income"))
        year = _parse_int(row.get("REF_DATE"))

        if expense is None:
            dropped_reasons["missing_expense"] += 1
            continue
        if income is None:
            dropped_reasons["missing_income"] += 1
            continue
        if year is None:
            dropped_reasons["invalid_year"] += 1
            continue
        if expense <= 0:
            dropped_reasons["non_positive_expense"] += 1
            continue
        if income <= 0:
            dropped_reasons["non_positive_income"] += 1
            continue

        clean_row = {
            clean_name: _clean_text(row.get(raw_name, ""))
            for raw_name, clean_name in RAW_TO_CLEAN_COLUMNS.items()
        }
        clean_row["year"] = year
        clean_row["year_index"] = year - 2010
        clean_row["expense"] = round(expense, 2)
        clean_row["income"] = round(income, 2)
        clean_row["log_expense"] = round(_safe_log10(expense), 6)
        clean_row["log_income"] = round(_safe_log10(income), 6)
        clean_row["expense_to_income_ratio"] = round(expense / income, 8)
        clean_rows.append(clean_row)

    clean_rows.sort(key=lambda item: (item["year"], item["geo"], item["coordinate"]))

    return clean_rows, {
        "raw_rows": len(raw_rows),
        "dropped_rows": sum(dropped_reasons.values()),
        "dropped_reasons": dict(dropped_reasons),
        "missing_by_column": dict(missing_by_column),
        "year_range": [
            min(row["year"] for row in clean_rows) if clean_rows else None,
            max(row["year"] for row in clean_rows) if clean_rows else None,
        ],
        "unique_counts": _unique_counts(clean_rows),
    }


def _split_rows(rows: list[dict], test_size: float, random_seed: int) -> tuple[list[dict], list[dict]]:
    shuffled_rows = list(rows)
    random.Random(random_seed).shuffle(shuffled_rows)
    test_count = round(len(shuffled_rows) * test_size)
    test_rows = sorted(shuffled_rows[:test_count], key=lambda item: (item["year"], item["geo"], item["coordinate"]))
    train_rows = sorted(shuffled_rows[test_count:], key=lambda item: (item["year"], item["geo"], item["coordinate"]))
    return train_rows, test_rows


def _write_csv(path: Path, rows: list[dict]) -> None:
    with path.open("w", newline="", encoding="utf-8") as output_file:
        writer = csv.DictWriter(output_file, fieldnames=MODEL_COLUMNS)
        writer.writeheader()
        writer.writerows({column: row[column] for column in MODEL_COLUMNS} for row in rows)


def _parse_float(value: str | None) -> float | None:
    if value is None or value.strip() == "":
        return None
    try:
        return float(value.replace(",", ""))
    except ValueError:
        return None


def _parse_int(value: str | None) -> int | None:
    if value is None or value.strip() == "":
        return None
    try:
        return int(value)
    except ValueError:
        return None


def _clean_text(value: str | None) -> str:
    if value is None:
        return ""
    return re.sub(r"\s+", " ", value).strip()


def _safe_log10(value: float) -> float:
    import math

    return math.log10(max(value, 1e-9))


def _unique_counts(rows: list[dict]) -> dict:
    return {
        "years": len({row["year"] for row in rows}),
        "geos": len({row["geo"] for row in rows}),
        "income_quintiles": len({row["income_quintile"] for row in rows}),
        "expense_categories": len({row["expense_category"] for row in rows}),
        "age_groups": len({row["age_group"] for row in rows}),
        "family_income_groups": len({row["family_income_group"] for row in rows}),
    }


if __name__ == "__main__":
    summary = preprocess_dataset()
    print(json.dumps(summary, indent=2))
