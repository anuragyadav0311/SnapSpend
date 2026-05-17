from __future__ import annotations

from pathlib import Path
from types import SimpleNamespace

from django.core.management.base import BaseCommand

from ...models import Transaction
from ml.anomaly_detector import TransactionAnomalyDetector


class Command(BaseCommand):
    help = "Train an IsolationForest anomaly detector on existing transactions and save the model."

    def add_arguments(self, parser):
        parser.add_argument(
            "--output",
            default="backend/ml/anomaly_model.joblib",
            help="Path to save the trained model (default: backend/ml/anomaly_model.joblib)",
        )

    def handle(self, *args, **options):
        output = Path(options["output"]).resolve()
        self.stdout.write("Collecting transactions from database...")

        qs = Transaction.objects.select_related("category").order_by("date", "created_at")
        transactions = []
        for tx in qs:
            transactions.append(
                SimpleNamespace(
                    id=tx.id,
                    amount=float(tx.amount),
                    type=tx.type,
                    category=SimpleNamespace(name=tx.category.name if tx.category else "Uncategorized"),
                    date=tx.date,
                )
            )

        if len(transactions) < 10:
            self.stderr.write("Not enough transactions to train the detector (need >= 10).")
            return

        detector = TransactionAnomalyDetector()
        self.stdout.write(f"Training detector on {len(transactions)} transactions...")
        detector.fit(transactions)
        output.parent.mkdir(parents=True, exist_ok=True)
        detector.save(output)
        self.stdout.write(self.style.SUCCESS(f"Anomaly detector saved to {output}"))
