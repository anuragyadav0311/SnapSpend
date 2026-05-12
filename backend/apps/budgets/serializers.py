from datetime import timedelta
from decimal import Decimal

from django.db.models import Sum
from rest_framework import serializers

from apps.transactions.models import Transaction
from .models import Budget


class BudgetSerializer(serializers.ModelSerializer):
    spent_amount = serializers.SerializerMethodField()
    remaining_amount = serializers.SerializerMethodField()
    progress_percent = serializers.SerializerMethodField()
    status = serializers.SerializerMethodField()

    class Meta:
        model = Budget
        fields = [
            "id",
            "month",
            "limit_amount",
            "created_at",
            "updated_at",
            "spent_amount",
            "remaining_amount",
            "progress_percent",
            "status",
        ]
        read_only_fields = [
            "id",
            "created_at",
            "updated_at",
            "spent_amount",
            "remaining_amount",
            "progress_percent",
            "status",
        ]

    def validate_month(self, value):
        return value.replace(day=1)

    def validate_limit_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError("Budget limit must be positive.")
        return value

    def validate(self, attrs):
        request = self.context.get("request")
        month = attrs.get("month", getattr(self.instance, "month", None))
        if request and month:
            queryset = Budget.objects.filter(user=request.user, month=month)
            if self.instance:
                queryset = queryset.exclude(pk=self.instance.pk)
            if queryset.exists():
                raise serializers.ValidationError({"month": "A budget for this month already exists."})
        return attrs

    def create(self, validated_data):
        request = self.context.get("request")
        validated_data["user"] = request.user
        return super().create(validated_data)

    def _next_month(self, month):
        return (month.replace(day=28) + timedelta(days=4)).replace(day=1)

    def _expense_total(self, obj):
        total = (
            Transaction.objects.filter(
                user=obj.user,
                type="expense",
                date__gte=obj.month,
                date__lt=self._next_month(obj.month),
            )
            .aggregate(total=Sum("amount"))
            .get("total")
        )
        return total or Decimal("0")

    def get_spent_amount(self, obj):
        return self._expense_total(obj)

    def get_remaining_amount(self, obj):
        return obj.limit_amount - self._expense_total(obj)

    def get_progress_percent(self, obj):
        spent = self._expense_total(obj)
        if not obj.limit_amount:
            return 0
        return round(float((spent / obj.limit_amount) * 100), 2)

    def get_status(self, obj):
        spent = self._expense_total(obj)
        if spent > obj.limit_amount:
            return "exceeded"
        if obj.limit_amount and spent / obj.limit_amount >= Decimal("0.8"):
            return "near_limit"
        return "healthy"
