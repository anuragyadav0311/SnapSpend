from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models


class Budget(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="budgets",
    )
    month = models.DateField()
    limit_amount = models.DecimalField(max_digits=12, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("user", "month")
        ordering = ["-month", "-created_at"]

    def clean(self):
        if self.limit_amount <= 0:
            raise ValidationError("Budget limit must be positive.")
        self.month = self.month.replace(day=1)

    def save(self, *args, **kwargs):
        self.full_clean()
        return super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.user.email} - {self.month:%Y-%m} - {self.limit_amount}"
