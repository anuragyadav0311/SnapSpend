from rest_framework import serializers

from .models import Budget


class BudgetSerializer(serializers.ModelSerializer):
    spent_amount = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    remaining_amount = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    usage_percentage = serializers.FloatField(read_only=True)
    status = serializers.CharField(read_only=True)

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
            "usage_percentage",
            "status",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def validate_month(self, value):
        return value.replace(day=1)

    def validate_limit_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError("Budget limit must be positive.")
        return value

    def validate(self, attrs):
        request = self.context["request"]
        month = attrs.get("month", getattr(self.instance, "month", None))
        if month:
            month = month.replace(day=1)
        queryset = Budget.objects.filter(user=request.user, month=month)
        if self.instance:
            queryset = queryset.exclude(pk=self.instance.pk)
        if queryset.exists():
            raise serializers.ValidationError(
                {"month": "A budget for this month already exists."}
            )
        return attrs
