from datetime import date, timedelta
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from apps.transactions.models import Category, Transaction


User = get_user_model()


class BudgetApiTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(name="Budget User", email="budget@example.com", password="SecurePass@123")
        self.category = Category.objects.create(name="Groceries", type="expense", user=None)
        login_response = self.client.post(
            "/api/auth/login/",
            {"email": "budget@example.com", "password": "SecurePass@123"},
            format="json",
        )
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {login_response.data['access']}")

    def test_budget_create_normalizes_month_and_returns_spending_metrics(self):
        current_month = timezone.localdate().replace(day=1)
        Transaction.objects.create(
            user=self.user,
            type="expense",
            amount="250.00",
            category=self.category,
            title="Groceries",
            date=current_month + timedelta(days=2),
        )
        response = self.client.post(
            "/api/budgets/",
            {"month": (current_month + timedelta(days=17)).isoformat(), "limit_amount": "1000.00"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["month"], current_month.isoformat())
        self.assertEqual(response.data["spent_amount"], Decimal("250.00"))
        self.assertEqual(response.data["status"], "healthy")

    def test_budget_rejects_duplicate_month(self):
        current_month = timezone.localdate().replace(day=1)
        self.client.post("/api/budgets/", {"month": current_month.isoformat(), "limit_amount": "1000.00"}, format="json")
        response = self.client.post(
            "/api/budgets/",
            {"month": (current_month + timedelta(days=20)).isoformat(), "limit_amount": "2000.00"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("month", response.data)

    def test_budget_rejects_past_months(self):
        current_month = timezone.localdate().replace(day=1)
        previous_month = (current_month - timedelta(days=1)).replace(day=1)
        response = self.client.post(
            "/api/budgets/",
            {"month": previous_month.isoformat(), "limit_amount": "1000.00"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("month", response.data)
