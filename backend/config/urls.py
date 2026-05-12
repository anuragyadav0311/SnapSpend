from django.contrib import admin
from django.urls import include, path
from rest_framework.response import Response
from rest_framework.views import APIView


class HealthCheckView(APIView):
    permission_classes = []
    authentication_classes = []

    def get(self, request):
        return Response({"status": "ok"})


urlpatterns = [
    path("admin/", admin.site.urls),
    path("health/", HealthCheckView.as_view(), name="health-check"),
    path("api/auth/", include("apps.accounts.urls")),       # JWT auth
    path("api/", include("apps.transactions.urls")),        # Categories & Transactions
    path("api/", include("apps.budgets.urls")),             # Budgets
    path("api/reports/", include("apps.reports.urls")),     # Reports & Exports
]