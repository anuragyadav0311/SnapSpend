from datetime import date, timedelta
from decimal import Decimal
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from apps.transactions.models import Category, Transaction
from apps.transactions.ocr import BillDraft, parse_bill_text


User = get_user_model()


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

    def test_anomalies_endpoint_validates_contamination(self):
        response = self.client.get("/api/transactions/anomalies/?contamination=0.75")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("contamination", response.data)

    def test_detect_anomalies_fallback(self):
        # small synthetic dataset to trigger statistical fallback
        from types import SimpleNamespace
        from ml.anomaly_detector import detect_anomalies

        txs = [SimpleNamespace(id=i, amount=amt, type="expense", category=SimpleNamespace(name="Groceries"), date=None) for i, amt in enumerate([10, 12, 11, 10000])]
        results = detect_anomalies(txs, min_training_samples=2)
        self.assertEqual(len(results), 4)
        self.assertTrue(any(r.is_anomaly for r in results))

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
