import csv

from django.http import HttpResponse
from rest_framework import permissions, views
from rest_framework.response import Response

from apps.transactions.models import Transaction
from .services import (
    aggregate_total,
    apply_transaction_filters,
    build_category_summary_payload,
    build_csv_response_rows,
    build_dashboard_payload,
    build_monthly_report_payload,
    build_pdf_bytes,
    build_workbook,
    parse_month_param,
)


class DashboardReportView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response(build_dashboard_payload(request.user))


class MonthlyReportView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        month = parse_month_param(request.query_params.get("month"))
        return Response(build_monthly_report_payload(request.user, month))


class CategorySummaryView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        month = parse_month_param(request.query_params.get("month"))
        return Response(build_category_summary_payload(request.user, month))


class BaseExportView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def filtered_transactions(self, request):
        queryset = Transaction.objects.filter(user=request.user).select_related("category").order_by("-date", "-created_at")
        return apply_transaction_filters(queryset, request.query_params)

    def totals(self, transactions):
        return {
            "income": aggregate_total(transactions, "income"),
            "expense": aggregate_total(transactions, "expense"),
        }

    def filters_summary(self, request):
        month = request.query_params.get("month")
        start_date = request.query_params.get("start_date")
        end_date = request.query_params.get("end_date")
        tx_type = request.query_params.get("type") or "all"
        if month:
            return f"Month: {month} | Type: {tx_type}"
        return f"Range: {start_date or 'beginning'} to {end_date or 'today'} | Type: {tx_type}"


class ReportCSVView(BaseExportView):
    def get(self, request):
        transactions = list(self.filtered_transactions(request))
        response = HttpResponse(content_type="text/csv; charset=utf-8")
        response["Content-Disposition"] = 'attachment; filename="transactions-report.csv"'
        writer = csv.writer(response)
        writer.writerows(build_csv_response_rows(transactions))
        return response


class ReportExcelView(BaseExportView):
    def get(self, request):
        queryset = self.filtered_transactions(request)
        transactions = list(queryset)
        workbook = build_workbook(
            transactions,
            "Transactions Report",
            self.filters_summary(request),
            self.totals(queryset),
        )
        response = HttpResponse(
            workbook.getvalue(),
            content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        )
        response["Content-Disposition"] = 'attachment; filename="transactions-report.xlsx"'
        return response


class ReportPDFView(BaseExportView):
    def get(self, request):
        queryset = self.filtered_transactions(request)
        transactions = list(queryset)
        pdf_bytes = build_pdf_bytes(
            request.user,
            transactions,
            "Transactions Report",
            self.filters_summary(request),
            self.totals(queryset),
        )
        response = HttpResponse(pdf_bytes.getvalue(), content_type="application/pdf")
        response["Content-Disposition"] = 'attachment; filename="transactions-report.pdf"'
        return response
