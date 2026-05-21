from datetime import date, timedelta
from decimal import Decimal
from pathlib import Path
from tempfile import TemporaryDirectory
from types import SimpleNamespace
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import SimpleTestCase, override_settings
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from apps.transactions.models import Category, Transaction, TransactionVerification
from apps.transactions.ocr import BillDraft, parse_bill_text


User = get_user_model()


def shift_to_month_start(reference_date, month_offset):
    month_index = reference_date.year * 12 + reference_date.month - 1 + month_offset
    return date(month_index // 12, month_index % 12 + 1, 1)


class TransactionApiTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(name="Finance User", email="finance@example.com", password="SecurePass@123")
        self.other_user = User.objects.create_user(name="Other User", email="other@example.com", password="SecurePass@123")
        self.default_expense = Category.objects.create(name="Food & Dining", type="expense", user=None)
        self.user_income = Category.objects.create(name="Salary", type="income", user=self.user)
        self.other_category = Category.objects.create(name="Secret", type="expense", user=self.other_user)
        login_response = self.client.post(
            "/api/auth/login/",
            {"email": "finance@example.com", "password": "SecurePass@123"},
            format="json",
        )
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {login_response.data['access']}")

    def test_category_list_includes_defaults_and_owned_categories_only(self):
        response = self.client.get("/api/categories/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        names = {item["name"] for item in response.data}
        self.assertIn("Food & Dining", names)
        self.assertIn("Salary", names)
        self.assertNotIn("Secret", names)

    def test_create_transaction_with_default_category(self):
        response = self.client.post(
            "/api/transactions/",
            {
                "type": "expense",
                "amount": "499.00",
                "category": self.default_expense.id,
                "title": "Groceries",
                "note": "Weekly run",
                "date": "2026-05-10",
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["category_name"], "Food & Dining")

    def test_reject_foreign_category_usage(self):
        response = self.client.post(
            "/api/transactions/",
            {
                "type": "expense",
                "amount": "499.00",
                "category": self.other_category.id,
                "title": "Blocked",
                "date": "2026-05-10",
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("category", response.data)

    def test_reject_future_transaction_date(self):
        future_date = timezone.localdate() + timedelta(days=1)
        response = self.client.post(
            "/api/transactions/",
            {
                "type": "expense",
                "amount": "499.00",
                "category": self.default_expense.id,
                "title": "Too early",
                "date": future_date.isoformat(),
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("date", response.data)

    def test_reject_invalid_future_filter_range(self):
        future_date = timezone.localdate() + timedelta(days=1)
        response = self.client.get(f"/api/transactions/?start_date={future_date.isoformat()}")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("start_date", response.data)

    def test_transaction_filters_support_search_type_and_ordering(self):
        Transaction.objects.create(
            user=self.user,
            type="expense",
            amount="1200.00",
            category=self.default_expense,
            title="Groceries run",
            note="Fresh market",
            date=date(2026, 5, 10),
        )
        Transaction.objects.create(
            user=self.user,
            type="income",
            amount="85000.00",
            category=self.user_income,
            title="Salary credit",
            note="May payroll",
            date=date(2026, 5, 1),
        )

        response = self.client.get("/api/transactions/?type=expense&search=grocer&ordering=highest")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["title"], "Groceries run")

    def test_parse_bill_text_extracts_expense_draft(self):
        groceries = Category.objects.create(name="Groceries", type="expense", user=None)
        draft = parse_bill_text(
            """
            Fresh Mart Supermarket
            Date: 12/05/2026
            Subtotal 1190.00
            GST 59.50
            Grand Total Rs. 1,249.50
            """,
            [self.default_expense, groceries],
        )

        self.assertEqual(draft.amount, Decimal("1249.50"))
        self.assertEqual(draft.date, "2026-05-12")
        self.assertEqual(draft.category_id, groceries.id)
        self.assertEqual(draft.title, "Fresh Mart Supermarket")

    def test_parse_bill_text_handles_missing_decimal_ocr_noise(self):
        groceries = Category.objects.create(name="Groceries", type="expense", user=None)
        draft = parse_bill_text(
            """
            Fresh Mart Supermarket
            Date 12/05/2026,
            subtotal 119000
            GST 5950
            Grand Totals 124950
            """,
            [self.default_expense, groceries],
        )

        self.assertEqual(draft.amount, Decimal("1249.50"))
        self.assertEqual(draft.date, "2026-05-12")
        self.assertEqual(draft.category_id, groceries.id)
        self.assertEqual(draft.title, "Fresh Mart Supermarket")

    def test_parse_bill_text_ignores_invoice_year_for_amount_and_separator_title(self):
        subscriptions = Category.objects.create(name="Subscriptions", type="expense", user=None)
        draft = parse_bill_text(
            """
            ==============================================================
            |                         NETFLIX
            ==============================================================
            Invoice Number: IN-2026-984721A
            Invoice Date: 01 May 2026
            --------------------------------------------------------------
            SOLD TO:
            Anurag Yadav
            --------------------------------------------------------------
            TOTAL AMOUNT PAID (INR) Rs. 649.00
            --------------------------------------------------------------
            Payment Status: SUCCESSFUL
            Thank you for your membership!
            """,
            [self.default_expense, subscriptions],
        )

        self.assertEqual(draft.amount, Decimal("649.00"))
        self.assertEqual(draft.date, "2026-05-01")
        self.assertEqual(draft.category_id, subscriptions.id)
        self.assertEqual(draft.title, "NETFLIX")

    def test_parse_bill_text_uses_nearby_total_label_for_split_amount_line(self):
        subscriptions = Category.objects.create(name="Subscriptions", type="expense", user=None)
        draft = parse_bill_text(
            """
            NETFLIX
            Invoice Number:
            IN-2026-984721A
            Invoice Date:
            01 May 2026
            SOLD TO:
            Anurag Yadav
            649.00
            TOTAL AMOUNT PAID (INR)
            Payment Status:
            SUCCESSFUL
            """,
            [self.default_expense, subscriptions],
        )

        self.assertEqual(draft.amount, Decimal("649.00"))
        self.assertEqual(draft.date, "2026-05-01")
        self.assertEqual(draft.category_id, subscriptions.id)
        self.assertEqual(draft.title, "NETFLIX")

    @patch("apps.transactions.views.extract_expense_from_bill")
    def test_scan_bill_returns_ocr_draft(self, mock_extract):
        mock_extract.return_value = BillDraft(
            amount=Decimal("499.00"),
            date="2026-05-12",
            title="Coffee House",
            category_id=self.default_expense.id,
            category_name="Food & Dining",
            note="Scanned from bill photo.",
            raw_text="Coffee House\nTotal 499.00",
        )
        image = SimpleUploadedFile("bill.jpg", b"fake-image", content_type="image/jpeg")

        response = self.client.post("/api/transactions/scan-bill/", {"image": image}, format="multipart")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["type"], "expense")
        self.assertEqual(response.data["amount"], "499.00")
        self.assertEqual(response.data["category"], self.default_expense.id)
        self.assertEqual(response.data["title"], "Coffee House")
        mock_extract.assert_called_once()

    def test_scan_bill_requires_image(self):
        response = self.client.post("/api/transactions/scan-bill/", {}, format="multipart")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["detail"], "Please upload a bill photo.")

    def test_create_transaction_with_normal_variation_skips_verification(self):
        for index in range(12):
            Transaction.objects.create(
                user=self.user,
                type="expense",
                amount=Decimal("450.00") + Decimal(index),
                category=self.default_expense,
                title=f"Regular grocery {index}",
                date=date(2026, 5, min(index + 1, 28)),
            )

        response = self.client.post(
            "/api/transactions/",
            {
                "type": "expense",
                "amount": "462.00",
                "category": self.default_expense.id,
                "title": "Regular grocery 12",
                "note": "Still within normal range",
                "date": "2026-05-16",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertFalse(TransactionVerification.objects.filter(user=self.user).exists())
        self.assertTrue(Transaction.objects.filter(user=self.user, title="Regular grocery 12").exists())

    def test_create_transaction_with_recurring_monthly_expense_skips_verification(self):
        housing = Category.objects.create(name="Housing", type="expense", user=None)
        target_month = timezone.localdate().replace(day=1)
        for month_offset in range(-10, 0):
            month_start = shift_to_month_start(target_month, month_offset)
            Transaction.objects.create(
                user=self.user,
                type="expense",
                amount=Decimal("12000.00") + Decimal("250.00") * Decimal(abs(month_offset) % 2),
                category=housing,
                title="Apartment Rent",
                date=month_start,
            )

        response = self.client.post(
            "/api/transactions/",
            {
                "type": "expense",
                "amount": "12200.00",
                "category": housing.id,
                "title": "Apartment Rent",
                "note": "Usual monthly rent",
                "date": target_month.isoformat(),
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertFalse(TransactionVerification.objects.filter(user=self.user).exists())
        self.assertTrue(Transaction.objects.filter(user=self.user, title="Apartment Rent", date=target_month).exists())

    @patch("apps.transactions.views.score_new_transaction")
    def test_create_income_skips_anomaly_detection(self, mock_score):
        response = self.client.post(
            "/api/transactions/",
            {
                "type": "income",
                "amount": "9999999.00",
                "category": self.user_income.id,
                "title": "Large bonus",
                "note": "No bill verification needed",
                "date": "2026-05-16",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertFalse(TransactionVerification.objects.filter(user=self.user).exists())
        self.assertTrue(Transaction.objects.filter(user=self.user, title="Large bonus").exists())
        mock_score.assert_not_called()

    def test_anomalies_endpoint_flags_unusual_transaction(self):
        for index in range(12):
            Transaction.objects.create(
                user=self.user,
                type="expense",
                amount=Decimal("450.00") + Decimal(index),
                category=self.default_expense,
                title=f"Regular grocery {index}",
                date=date(2026, 5, min(index + 1, 28)),
            )
        unusual = Transaction.objects.create(
            user=self.user,
            type="expense",
            amount=Decimal("25000.00"),
            category=self.default_expense,
            title="Unexpected appliance repair",
            date=date(2026, 5, 15),
        )

        response = self.client.get("/api/transactions/anomalies/?contamination=0.15")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        anomaly_ids = {item["id"] for item in response.data["results"]}
        self.assertIn(unusual.id, anomaly_ids)
        self.assertEqual(response.data["total_checked"], 13)

    def test_anomalies_endpoint_ignores_income_transactions(self):
        for index in range(12):
            Transaction.objects.create(
                user=self.user,
                type="expense",
                amount=Decimal("450.00") + Decimal(index),
                category=self.default_expense,
                title=f"Regular grocery {index}",
                date=date(2026, 5, min(index + 1, 28)),
            )
        income = Transaction.objects.create(
            user=self.user,
            type="income",
            amount=Decimal("9999999.00"),
            category=self.user_income,
            title="Large bonus",
            date=date(2026, 5, 15),
        )

        response = self.client.get("/api/transactions/anomalies/?contamination=0.15")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        anomaly_ids = {item["id"] for item in response.data["results"]}
        self.assertNotIn(income.id, anomaly_ids)
        self.assertEqual(response.data["total_checked"], 12)

    def test_anomalies_endpoint_excludes_ocr_verified_transactions(self):
        for index in range(12):
            Transaction.objects.create(
                user=self.user,
                type="expense",
                amount=Decimal("450.00") + Decimal(index),
                category=self.default_expense,
                title=f"Regular grocery {index}",
                date=date(2026, 5, min(index + 1, 28)),
            )
        unusual = Transaction.objects.create(
            user=self.user,
            type="expense",
            amount=Decimal("25000.00"),
            category=self.default_expense,
            title="Unexpected appliance repair",
            date=date(2026, 5, 15),
        )
        verification = TransactionVerification.objects.create(
            user=self.user,
            proposed={
                "transaction_id": unusual.id,
                "type": "expense",
                "amount": 25000.0,
                "category": self.default_expense.id,
                "category_name": self.default_expense.name,
                "title": unusual.title,
                "note": "",
                "date": unusual.date.isoformat(),
            },
            anomaly_reason="Unusual amount.",
        )
        verification.mark_verified("Unexpected appliance repair\nTotal 25000.00")

        response = self.client.get("/api/transactions/anomalies/?contamination=0.15")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        anomaly_ids = {item["id"] for item in response.data["results"]}
        self.assertNotIn(unusual.id, anomaly_ids)

    def test_anomalies_endpoint_validates_contamination(self):
        response = self.client.get("/api/transactions/anomalies/?contamination=0.75")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("contamination", response.data)

    def test_detect_anomalies_fallback(self):
        # small synthetic dataset to trigger statistical fallback
        from ml.anomaly_detector import detect_anomalies

        txs = [SimpleNamespace(id=i, amount=amt, type="expense", category=SimpleNamespace(name="Groceries"), date=None) for i, amt in enumerate([10, 12, 11, 10000])]
        results = detect_anomalies(txs, min_training_samples=2)
        self.assertEqual(len(results), 4)
        self.assertTrue(any(r.is_anomaly for r in results))

    def test_score_new_transaction_uses_history_only(self):
        from ml.anomaly_detector import score_new_transaction

        history = [
            SimpleNamespace(
                id=index,
                amount=Decimal("450.00") + Decimal(index),
                type="expense",
                category=SimpleNamespace(name="Food & Dining"),
                title=f"regular grocery {index}",
                date=date(2026, 5, min(index + 1, 28)),
            )
            for index in range(12)
        ]
        regular_candidate = SimpleNamespace(
            id=100,
            amount=Decimal("462.00"),
            type="expense",
            category=SimpleNamespace(name="Food & Dining"),
            title="regular grocery 12",
            date=date(2026, 5, 16),
        )
        outlier_candidate = SimpleNamespace(
            id=101,
            amount=Decimal("25000.00"),
            type="expense",
            category=SimpleNamespace(name="Food & Dining"),
            title="appliance repair",
            date=date(2026, 5, 16),
        )

        regular_result = score_new_transaction(history, regular_candidate)
        outlier_result = score_new_transaction(history, outlier_candidate)

        self.assertFalse(regular_result.is_anomaly)
        self.assertTrue(outlier_result.is_anomaly)

    def test_score_new_transaction_flags_large_first_time_category_expense(self):
        from ml.anomaly_detector import score_new_transaction

        history = [
            SimpleNamespace(
                id=index,
                amount=Decimal("12000.00") + Decimal(index % 2) * Decimal("250.00"),
                type="expense",
                category=SimpleNamespace(name="Housing"),
                title="apartment rent",
                date=date(2025, index + 1, 1),
            )
            for index in range(10)
        ]
        candidate = SimpleNamespace(
            id=200,
            amount=Decimal("45000.00"),
            type="expense",
            category=SimpleNamespace(name="Travel"),
            title="emergency flight",
            date=date(2025, 11, 3),
        )

        result = score_new_transaction(history, candidate, min_training_samples=5)

        self.assertTrue(result.is_anomaly)
        self.assertIn("first travel expense", result.reason.lower())

    def test_detect_anomalies_reuses_saved_model_cache(self):
        from ml.anomaly_detector import detect_anomalies, get_model_cache_path

        txs = [
            SimpleNamespace(
                id=index,
                amount=Decimal("450.00") + Decimal(index),
                type="expense",
                category=SimpleNamespace(name="Food & Dining"),
                date=date(2026, 5, min(index + 1, 28)),
            )
            for index in range(12)
        ]
        txs.append(
            SimpleNamespace(
                id=100,
                amount=Decimal("25000.00"),
                type="expense",
                category=SimpleNamespace(name="Food & Dining"),
                date=date(2026, 5, 15),
            )
        )

        with TemporaryDirectory() as temp_dir:
            with override_settings(ML_ANOMALY_CACHE_DIR=temp_dir, ML_ANOMALY_CACHE_ENABLED=True):
                detect_anomalies(txs, min_training_samples=2, cache_key="user-1", use_cache=True)
                cache_path = get_model_cache_path("user-1")
                self.assertTrue(Path(cache_path).exists())

                with patch("ml.anomaly_detector.TransactionAnomalyDetector.fit", side_effect=AssertionError("fit should not run")):
                    results = detect_anomalies(txs, min_training_samples=2, cache_key="user-1", use_cache=True)

        self.assertEqual(len(results), len(txs))
        self.assertTrue(any(result.is_anomaly for result in results))

    @patch("apps.transactions.views.extract_expense_from_bill")
    def test_verification_flow_creates_verification_and_then_transaction(self, mock_extract):
        # Post a clearly anomalous transaction
        data = {
            "type": "expense",
            "amount": "9999999.00",
            "category": self.default_expense.id,
            "title": "Huge Grocery Purchase",
            "note": "Test",
            "date": "2024-01-01",
        }

        resp = self.client.post("/api/transactions/", data, format="json")
        # Expect 202 Accepted with verification info
        self.assertEqual(resp.status_code, status.HTTP_202_ACCEPTED)
        token = resp.data["verification"]["token"]

        # Mock OCR to return matching draft
        mock_extract.return_value = BillDraft(
            amount=Decimal("9999999.00"),
            date="2024-01-01",
            title="Huge Grocery Purchase",
            category_id=self.default_expense.id,
            category_name=self.default_expense.name,
            note="Scanned from bill photo.",
            raw_text="Huge Grocery Purchase\nTotal 9999999.00",
        )

        image = SimpleUploadedFile("bill.jpg", b"fake-image", content_type="image/jpeg")
        verify_resp = self.client.post("/api/transactions/verify/", {"token": token, "image": image}, format="multipart")
        # Should create transaction
        self.assertIn(verify_resp.status_code, (status.HTTP_200_OK, status.HTTP_201_CREATED))
        self.assertTrue(Transaction.objects.filter(title=data["title"]).exists())

    @patch("apps.transactions.views.extract_expense_from_bill")
    def test_verification_accepts_bill_date_and_amount_format_variants(self, mock_extract):
        subscriptions = Category.objects.create(name="Subscriptions", type="expense", user=None)
        verification = TransactionVerification.objects.create(
            user=self.user,
            proposed={
                "type": "expense",
                "amount": 649.0,
                "category": subscriptions.id,
                "category_name": subscriptions.name,
                "title": "Netflix",
                "note": "",
                "date": "2026-05-01",
            },
            anomaly_reason="Unusual combination of amount, timing, type, and category.",
        )
        mock_extract.return_value = BillDraft(
            amount=None,
            date=timezone.localdate().isoformat(),
            title="NETFLIX",
            category_id=subscriptions.id,
            category_name=subscriptions.name,
            note="Scanned from bill photo.",
            raw_text="""
            NETFLIX
            Invoice Number: IN-2026-984721A
            Invoice Date: 01 May 2026
            TOTAL AMOUNT PAID (INR) Rs. 649.00
            Payment Status: SUCCESSFUL
            """,
        )

        image = SimpleUploadedFile("netflix.png", b"fake-image", content_type="image/png")
        response = self.client.post(
            "/api/transactions/verify/",
            {"token": verification.token, "image": image},
            format="multipart",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["amount"], "649.00")
        self.assertEqual(response.data["date"], "2026-05-01")
        self.assertTrue(Transaction.objects.filter(title="Netflix", amount=Decimal("649.00")).exists())

    @patch("apps.transactions.views.extract_expense_from_bill")
    def test_verification_checks_only_amount_and_date(self, mock_extract):
        verification = TransactionVerification.objects.create(
            user=self.user,
            proposed={
                "type": "expense",
                "amount": 2500.0,
                "category": self.default_expense.id,
                "category_name": self.default_expense.name,
                "title": "Office chair",
                "note": "",
                "date": "2026-05-12",
            },
            anomaly_reason="Unusual amount.",
        )
        mock_extract.return_value = BillDraft(
            amount=Decimal("2500.00"),
            date="2026-05-12",
            title="Different merchant",
            category_id=None,
            category_name="Uncategorized",
            note="Scanned from bill photo.",
            raw_text="Different merchant\nDate 12/05/2026\nTotal 2500.00",
        )

        image = SimpleUploadedFile("chair.jpg", b"fake-image", content_type="image/jpeg")
        response = self.client.post(
            "/api/transactions/verify/",
            {"token": verification.token, "image": image},
            format="multipart",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["amount"], "2500.00")
        self.assertEqual(response.data["date"], "2026-05-12")

    @patch("apps.transactions.views.extract_expense_from_bill")
    def test_verification_rejects_when_date_mismatches_even_if_title_matches(self, mock_extract):
        verification = TransactionVerification.objects.create(
            user=self.user,
            proposed={
                "type": "expense",
                "amount": 2500.0,
                "category": self.default_expense.id,
                "category_name": self.default_expense.name,
                "title": "Office chair",
                "note": "",
                "date": "2026-05-12",
            },
            anomaly_reason="Unusual amount.",
        )
        mock_extract.return_value = BillDraft(
            amount=Decimal("2500.00"),
            date="2026-05-11",
            title="Office chair",
            category_id=self.default_expense.id,
            category_name=self.default_expense.name,
            note="Scanned from bill photo.",
            raw_text="Office chair\nDate 11/05/2026\nTotal 2500.00",
        )

        image = SimpleUploadedFile("chair.jpg", b"fake-image", content_type="image/jpeg")
        response = self.client.post(
            "/api/transactions/verify/",
            {"token": verification.token, "image": image},
            format="multipart",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["matches"], {"amount": True, "date": False})

    @patch("apps.transactions.views.extract_expense_from_bill")
    def test_verify_existing_flagged_transaction_with_ocr(self, mock_extract):
        transaction = Transaction.objects.create(
            user=self.user,
            type="expense",
            amount=Decimal("25000.00"),
            category=self.default_expense,
            title="Unexpected appliance repair",
            date=date(2026, 5, 15),
        )
        mock_extract.return_value = BillDraft(
            amount=Decimal("25000.00"),
            date="2026-05-15",
            title="Unexpected appliance repair",
            category_id=self.default_expense.id,
            category_name=self.default_expense.name,
            note="Scanned from bill photo.",
            raw_text="Unexpected appliance repair\nDate 15/05/2026\nTotal 25000.00",
        )

        image = SimpleUploadedFile("repair.jpg", b"fake-image", content_type="image/jpeg")
        response = self.client.post(
            f"/api/transactions/{transaction.id}/verify-ocr/",
            {"image": image, "anomaly_reason": "Unusual amount."},
            format="multipart",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["id"], transaction.id)
        verification = next(
            item
            for item in TransactionVerification.objects.filter(user=self.user)
            if item.proposed.get("transaction_id") == transaction.id
        )
        self.assertTrue(verification.is_verified)


class AnomalyDetectorTests(SimpleTestCase):
    def test_recurring_monthly_expense_stays_clean(self):
        from ml.anomaly_detector import score_new_transaction

        history = [
            SimpleNamespace(
                id=index,
                amount=Decimal("12000.00") + Decimal(index % 2) * Decimal("250.00"),
                type="expense",
                category=SimpleNamespace(name="Housing"),
                title="apartment rent",
                date=date(2025, index + 1, 1),
            )
            for index in range(10)
        ]
        candidate = SimpleNamespace(
            id=100,
            amount=Decimal("12200.00"),
            type="expense",
            category=SimpleNamespace(name="Housing"),
            title="apartment rent",
            date=date(2025, 11, 1),
        )

        result = score_new_transaction(history, candidate, min_training_samples=5, use_cache=False)

        self.assertFalse(result.is_anomaly)
        self.assertIn("monthly housing pattern", result.reason.lower())

    def test_large_first_time_category_gets_flagged(self):
        from ml.anomaly_detector import score_new_transaction

        history = [
            SimpleNamespace(
                id=index,
                amount=Decimal("12000.00") + Decimal(index % 2) * Decimal("250.00"),
                type="expense",
                category=SimpleNamespace(name="Housing"),
                title="apartment rent",
                date=date(2025, index + 1, 1),
            )
            for index in range(10)
        ]
        candidate = SimpleNamespace(
            id=200,
            amount=Decimal("45000.00"),
            type="expense",
            category=SimpleNamespace(name="Travel"),
            title="emergency flight",
            date=date(2025, 11, 3),
        )

        result = score_new_transaction(history, candidate, min_training_samples=5, use_cache=False)

        self.assertTrue(result.is_anomaly)
        self.assertIn("first travel expense", result.reason.lower())
