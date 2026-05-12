from django.db.models import Q
from rest_framework import permissions, status, viewsets
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response

from .models import Category, Transaction
from .serializers import CategorySerializer, TransactionSerializer


class CategoryViewSet(viewsets.ModelViewSet):
    serializer_class = CategorySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        base_queryset = Category.objects.order_by("type", "name")
        if self.action in {"list", "retrieve"}:
            return base_queryset.filter(Q(user=self.request.user) | Q(user__isnull=True))
        return base_queryset.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def perform_update(self, serializer):
        if serializer.instance.user_id != self.request.user.id:
            raise PermissionDenied("Default categories cannot be modified.")
        serializer.save()

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.user_id != request.user.id:
            raise PermissionDenied("Default categories cannot be deleted.")
        if instance.transactions.exists():
            return Response(
                {"detail": "Categories with transactions cannot be deleted."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return super().destroy(request, *args, **kwargs)


class TransactionViewSet(viewsets.ModelViewSet):
    serializer_class = TransactionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = Transaction.objects.filter(user=self.request.user).select_related("category")
        params = self.request.query_params
        tx_type = params.get("type")
        category_id = params.get("category")
        start_date = params.get("start_date")
        end_date = params.get("end_date")
        search = params.get("search")
        ordering = params.get("ordering")

        if tx_type in {"income", "expense"}:
            queryset = queryset.filter(type=tx_type)
        if category_id:
            queryset = queryset.filter(category_id=category_id)
        if start_date:
            queryset = queryset.filter(date__gte=start_date)
        if end_date:
            queryset = queryset.filter(date__lte=end_date)
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search)
                | Q(note__icontains=search)
                | Q(category__name__icontains=search)
            )

        ordering_map = {
            "newest": ("-date", "-created_at"),
            "oldest": ("date", "created_at"),
            "highest": ("-amount", "-date"),
            "lowest": ("amount", "-date"),
            "-date": ("-date", "-created_at"),
            "date": ("date", "created_at"),
            "-amount": ("-amount", "-date"),
            "amount": ("amount", "-date"),
        }
        if ordering in ordering_map:
            queryset = queryset.order_by(*ordering_map[ordering])
        return queryset

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def perform_update(self, serializer):
        if serializer.instance.user_id != self.request.user.id:
            raise PermissionDenied("You cannot modify another user's transaction.")
        serializer.save()

    def perform_destroy(self, instance):
        if instance.user_id != self.request.user.id:
            raise PermissionDenied("You cannot delete another user's transaction.")
        instance.delete()
