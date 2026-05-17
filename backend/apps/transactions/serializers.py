from rest_framework import serializers
from django.utils import timezone

from .models import Category, Transaction
from .models import TransactionVerification


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ["id", "name", "type", "created_at"]
        read_only_fields = ["id", "created_at"]

    def validate_name(self, value):
        return value.strip()


class TransactionSerializer(serializers.ModelSerializer):
    category_name = serializers.ReadOnlyField(source="category.name")

    class Meta:
        model = Transaction
        fields = [
            "id",
            "type",
            "amount",
            "category",
            "category_name",
            "title",
            "note",
            "date",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def validate_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError("Amount must be positive.")
        return value

    def validate_date(self, value):
        if value > timezone.localdate():
            raise serializers.ValidationError("Transaction dates cannot be in the future.")
        return value

    def validate(self, attrs):
        request = self.context.get("request")
        instance = getattr(self, "instance", None)
        category = attrs.get("category", getattr(instance, "category", None))
        tx_type = attrs.get("type", getattr(instance, "type", None))

        if category:
            if request and category.user_id not in {None, request.user.id}:
                raise serializers.ValidationError({"category": "You cannot use another user's category."})
            if tx_type and category.type != tx_type:
                raise serializers.ValidationError({"category": "Category type must match transaction type."})

        return attrs

    def create(self, validated_data):
        request = self.context.get("request")
        validated_data["user"] = request.user
        return super().create(validated_data)


class TransactionVerificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = TransactionVerification
        fields = ["token", "proposed", "anomaly_reason", "is_verified", "created_at", "verified_at"]
        read_only_fields = ["token", "is_verified", "created_at", "verified_at"]
