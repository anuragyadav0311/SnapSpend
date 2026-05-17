from django.db import models
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.utils import timezone
import uuid
from django.db.models import JSONField

User = get_user_model()


def _generate_token():
    return uuid.uuid4().hex


class Category(models.Model):
    TYPE_CHOICES = (
        ('income', 'Income'),
        ('expense', 'Expense'),
    )

    name = models.CharField(max_length=100)
    type = models.CharField(max_length=10, choices=TYPE_CHOICES, db_index=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True, related_name="categories")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'name')
        ordering = ['type', 'name']
        verbose_name = "Category"
        verbose_name_plural = "Categories"

    def __str__(self):
        return f"{self.name} ({self.type})"


class Transaction(models.Model):
    TYPE_CHOICES = (
        ('income', 'Income'),
        ('expense', 'Expense'),
    )

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="transactions")
    type = models.CharField(max_length=10, choices=TYPE_CHOICES, db_index=True)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, related_name="transactions")
    title = models.CharField(max_length=255)
    note = models.TextField(blank=True)
    date = models.DateField(db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-date', '-created_at']
        verbose_name = "Transaction"
        verbose_name_plural = "Transactions"

    def __str__(self):
        return f"{self.title} - {self.amount} ({self.type})"

    def clean(self):
        if self.category and self.type != self.category.type:
            raise ValidationError("Transaction type must match category type.")


class TransactionVerification(models.Model):
    token = models.CharField(max_length=64, unique=True, default=_generate_token)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="transaction_verifications")
    proposed = JSONField()
    anomaly_reason = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    verified_at = models.DateTimeField(null=True, blank=True)
    is_verified = models.BooleanField(default=False)
    ocr_raw_text = models.TextField(blank=True)

    class Meta:
        ordering = ["-created_at"]

    def mark_verified(self, ocr_text: str | None = None):
        self.is_verified = True
        self.verified_at = timezone.now()
        if ocr_text:
            self.ocr_raw_text = ocr_text
        self.save()