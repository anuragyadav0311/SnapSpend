from datetime import date

from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from apps.budgets.models import Budget
from apps.transactions.models import Category, Transaction


User = get_user_model()


class ReportsApiTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(name="Reports User", email="reports@example.com", password="SecurePass@123")
        self.expense_category = Category.objects.create(name="Food & Dining", type="expense", user=None)
        self.income_category = Category.objects.create(name="Salary", type="income", user=None)
        Transaction.objects.create(
            user=self.user,
            type="income",
            amount="90000.00",
            category=self.income_category,
            title="Salary",
            date=date(2026, 5, 1),
        )
        Transaction.objects.create(
            user=self.user,
            type="expense",
            amount="1200.00",
            category=self.expense_category,
            title="Groceries",
            note="Week one",
            date=date(2026, 5, 5),
        )
        Transaction.objects.create(
            user=self.user,
            type="expense",
            amount="800.00",
            category=self.expense_category,
            title="Dining out",
            date=date(2026, 4, 28),
        )
        Budget.objects.create(user=self.user, month=date(2026, 5, 1), limit_amount="5000.00")
        login_response = self.client.post(
            "/api/auth/login/",
            {"email": "reports@example.com", "password": "SecurePass@123"},
            format="json",
        )
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {login_response.data['access']}")

    def test_dashboard_returns_expected_sections(self):
        response = self.client.get("/api/reports/dashboard/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("totals", response.data)
        self.assertIn("recent_transactions", response.data)
        self.assertIn("budget", response.data)

    def test_monthly_report_respects_month_filter(self):
        response = self.client.get("/api/reports/monthly/?month=2026-05")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["month"], "May 2026")
        self.assertEqual(len(response.data["transactions"]), 2)

    def test_category_summary_returns_sorted_expense_categories(self):
        response = self.client.get("/api/reports/category-summary/?month=2026-05")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["categories"][0]["name"], "Food & Dining")

    def test_export_endpoints_return_expected_content_types(self):
        csv_response = self.client.get("/api/reports/export/csv/?month=2026-05")
        xlsx_response = self.client.get("/api/reports/export/xlsx/?month=2026-05")
        pdf_response = self.client.get("/api/reports/export/pdf/?month=2026-05")

        self.assertEqual(csv_response.status_code, status.HTTP_200_OK)
        self.assertIn("text/csv", csv_response["Content-Type"])
        self.assertEqual(xlsx_response.status_code, status.HTTP_200_OK)
        self.assertIn("spreadsheetml", xlsx_response["Content-Type"])
        self.assertEqual(pdf_response.status_code, status.HTTP_200_OK)
        self.assertIn("application/pdf", pdf_response["Content-Type"])
