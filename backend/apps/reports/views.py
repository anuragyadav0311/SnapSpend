from rest_framework import permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from .services import (
    build_category_summary_payload,
    build_dashboard_payload,
    build_monthly_payload,
    export_csv_response,
    export_pdf_response,
    export_xlsx_response,
    filter_transactions_for_user,
)


class DashboardReportView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response(build_dashboard_payload(request.user))


class MonthlyReportView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        queryset = filter_transactions_for_user(request.user, request.query_params)
        return Response(build_monthly_payload(queryset))


class CategorySummaryView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        queryset = filter_transactions_for_user(request.user, request.query_params)
        return Response(build_category_summary_payload(queryset))


class ExportCSVView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        queryset = filter_transactions_for_user(request.user, request.query_params)
        return export_csv_response(queryset)


class ExportXLSXView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        queryset = filter_transactions_for_user(request.user, request.query_params)
        return export_xlsx_response(queryset, request.query_params, request.user)


class ExportPDFView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        queryset = filter_transactions_for_user(request.user, request.query_params)
        return export_pdf_response(queryset, request.query_params, request.user)
