from rest_framework import serializers

from .models import Category, Transaction


class CategorySerializer(serializers.ModelSerializer):
    is_system_default = serializers.ReadOnlyField()

    class Meta:
        model = Category
        fields = ["id", "name", "type", "created_at", "is_system_default"]
        read_only_fields = ["id", "created_at", "is_system_default"]

    def validate(self, attrs):
        request = self.context["request"]
        category_type = attrs.get("type", getattr(self.instance, "type", None))
        category_name = attrs.get("name", getattr(self.instance, "name", None))

        queryset = Category.objects.filter(
            user=request.user,
            name__iexact=category_name,
            type=category_type,
        )
        if self.instance:
            queryset = queryset.exclude(pk=self.instance.pk)

        if queryset.exists():
            raise serializers.ValidationError(
                {"name": "You already have a category with this name for that type."}
            )
        return attrs


class TransactionSerializer(serializers.ModelSerializer):
    category_name = serializers.ReadOnlyField(source="category.name")
    receipt = serializers.FileField(required=False, allow_null=True)

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
            "receipt",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def validate_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError("Amount must be positive")
        return value

    def validate_category(self, value):
        request = self.context["request"]
        if value.user_id not in {None, request.user.id}:
            raise serializers.ValidationError(
                "You can only use your own categories or system defaults."
            )
        return value

    def validate(self, attrs):
        request = self.context["request"]
        category = attrs.get("category", getattr(self.instance, "category", None))
        transaction_type = attrs.get("type", getattr(self.instance, "type", None))

        if category and transaction_type and category.type != transaction_type:
            raise serializers.ValidationError(
                {"category": "Category type must match the transaction type."}
            )

        if self.instance and self.instance.user_id != request.user.id:
            raise serializers.ValidationError("You can only edit your own transactions.")

        return attrs
