from django.db.models import Q
from rest_framework import permissions, viewsets
from rest_framework.exceptions import PermissionDenied

from .models import Category, Transaction
from .serializers import CategorySerializer, TransactionSerializer


class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = self.queryset.filter(Q(user__isnull=True) | Q(user=self.request.user))
        category_type = self.request.query_params.get("type")
        if category_type in {"income", "expense"}:
            queryset = queryset.filter(type=category_type)
        return queryset.order_by("type", "name")

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def perform_update(self, serializer):
        if serializer.instance.user_id is None:
            raise PermissionDenied("System default categories cannot be edited.")
        serializer.save()

    def perform_destroy(self, instance):
        if instance.user_id is None:
            raise PermissionDenied("System default categories cannot be deleted.")
        instance.delete()


class TransactionViewSet(viewsets.ModelViewSet):
    queryset = Transaction.objects.all()
    serializer_class = TransactionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = self.queryset.filter(user=self.request.user).select_related("category")

        transaction_type = self.request.query_params.get("type")
        category_id = self.request.query_params.get("category")
        start_date = self.request.query_params.get("start_date")
        end_date = self.request.query_params.get("end_date")
        search = self.request.query_params.get("search")
        ordering = self.request.query_params.get("ordering")

        if transaction_type in {"income", "expense"}:
            queryset = queryset.filter(type=transaction_type)
        if category_id:
            queryset = queryset.filter(category_id=category_id)
        if start_date:
            queryset = queryset.filter(date__gte=start_date)
        if end_date:
            queryset = queryset.filter(date__lte=end_date)
        if search:
            queryset = queryset.filter(Q(title__icontains=search) | Q(note__icontains=search))

        allowed_ordering = {
            "newest": ("-date", "-created_at"),
            "oldest": ("date", "created_at"),
            "highest": ("-amount", "-date"),
            "lowest": ("amount", "-date"),
        }
        queryset = queryset.order_by(*allowed_ordering.get(ordering, ("-date", "-created_at")))
        return queryset

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
