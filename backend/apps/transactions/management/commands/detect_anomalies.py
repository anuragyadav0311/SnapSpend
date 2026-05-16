from pathlib import Path

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError

from apps.transactions.models import Transaction
from ml.anomaly_detector import TransactionAnomalyDetector, detect_anomalies


class Command(BaseCommand):
    help = "Detect anomalous transactions for a user with the ML Isolation Forest model."

    def add_arguments(self, parser):
        parser.add_argument("--user-email", required=True, help="Email of the user to analyze.")
        parser.add_argument(
            "--contamination",
            type=float,
            default=0.08,
            help="Expected anomaly ratio. Must be greater than 0 and less than 0.5.",
        )
        parser.add_argument(
            "--save-model",
            help="Optional path to save the fitted Isolation Forest model as a joblib file.",
        )

    def handle(self, *args, **options):
        contamination = options["contamination"]
        if not 0 < contamination < 0.5:
            raise CommandError("--contamination must be greater than 0 and less than 0.5.")

        user_model = get_user_model()
        try:
            user = user_model.objects.get(email=options["user_email"])
        except user_model.DoesNotExist as exc:
            raise CommandError("No user found with that email.") from exc

        transactions = list(
            Transaction.objects.filter(user=user)
            .select_related("category")
            .order_by("date", "created_at")
        )
        if not transactions:
            self.stdout.write(self.style.WARNING("No transactions found for this user."))
            return

        if options["save_model"]:
            detector = TransactionAnomalyDetector(contamination=contamination)
            detector.fit(transactions)
            model_path = Path(options["save_model"])
            model_path.parent.mkdir(parents=True, exist_ok=True)
            detector.save(model_path)
            results = detector.predict(transactions)
            self.stdout.write(self.style.SUCCESS(f"Saved model to {model_path}"))
        else:
            results = detect_anomalies(transactions, contamination=contamination)

        result_map = {result.transaction_id: result for result in results}
        anomalies = [
            transaction
            for transaction in transactions
            if result_map[transaction.id].is_anomaly
        ]
        anomalies.sort(key=lambda transaction: result_map[transaction.id].anomaly_score, reverse=True)

        self.stdout.write(f"Checked {len(transactions)} transactions. Found {len(anomalies)} anomalies.")
        for transaction in anomalies:
            result = result_map[transaction.id]
            category = transaction.category.name if transaction.category else "Uncategorized"
            self.stdout.write(
                f"- #{transaction.id} {transaction.date} {transaction.type} "
                f"{transaction.amount} {category}: score={result.anomaly_score} "
                f"{transaction.title}"
            )
