from decimal import Decimal

from django.db.models import Sum
from rest_framework import permissions, viewsets

from apps.transactions.models import Transaction

from .models import Budget
from .serializers import BudgetSerializer


class BudgetViewSet(viewsets.ModelViewSet):
    serializer_class = BudgetSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Budget.objects.filter(user=self.request.user).order_by("-month")

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["request"] = self.request
        return context

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def perform_update(self, serializer):
        serializer.save(user=self.request.user)

    def list(self, request, *args, **kwargs):
        response = super().list(request, *args, **kwargs)
        for item, budget in zip(response.data, self.get_queryset()):
            self._attach_budget_metrics(item, budget)
        return response

    def retrieve(self, request, *args, **kwargs):
        response = super().retrieve(request, *args, **kwargs)
        self._attach_budget_metrics(response.data, self.get_object())
        return response

    def _attach_budget_metrics(self, payload, budget):
        month_start = budget.month.replace(day=1)
        if budget.month.month == 12:
            next_month = budget.month.replace(year=budget.month.year + 1, month=1, day=1)
        else:
            next_month = budget.month.replace(month=budget.month.month + 1, day=1)

        spent_amount = (
            Transaction.objects.filter(
                user=budget.user,
                type="expense",
                date__gte=month_start,
                date__lt=next_month,
            ).aggregate(total=Sum("amount"))["total"]
            or Decimal("0.00")
        )

        remaining_amount = budget.limit_amount - spent_amount
        usage_percentage = float((spent_amount / budget.limit_amount) * 100) if budget.limit_amount else 0.0
        status = "safe"
        if usage_percentage >= 100:
            status = "exceeded"
        elif usage_percentage >= 80:
            status = "warning"

        payload["spent_amount"] = spent_amount
        payload["remaining_amount"] = remaining_amount
        payload["usage_percentage"] = round(usage_percentage, 2)
        payload["status"] = status
