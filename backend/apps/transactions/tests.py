from datetime import date

from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from apps.transactions.models import Category, Transaction


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
