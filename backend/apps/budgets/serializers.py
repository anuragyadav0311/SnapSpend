"""Budget serializers TODO."""
from rest_framework import serializers
from .models import Budget


class BudgetSerializer(serializers.ModelSerializer):
    class Meta:
        model = Budget
        fields = ["id", "month", "limit", "created_at"]
        read_only_fields = ["id", "created_at"]

    def validate_limit(self, value):
        if value <= 0:
            raise serializers.ValidationError("Budget limit must be positive")
        return value

    def create(self, validated_data):
        request = self.context.get("request")
        validated_data["user"] = request.user
        return super().create(validated_data)