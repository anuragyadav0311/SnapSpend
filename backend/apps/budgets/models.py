from django.contrib.auth import get_user_model
from django.db import models


User = get_user_model()


class Budget(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="budgets")
    month = models.DateField(help_text="First day of the month")
    limit_amount = models.DecimalField(max_digits=12, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("user", "month")
        ordering = ["-month"]
        verbose_name = "Budget"
        verbose_name_plural = "Budgets"

    def __str__(self):
        return f"{self.user.email} - {self.month.strftime('%B %Y')} ({self.limit_amount})"
