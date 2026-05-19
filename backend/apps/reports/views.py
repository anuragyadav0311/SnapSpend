import csv
from datetime import date

from django.http import HttpResponse
from django.utils import timezone
from rest_framework import permissions, serializers, views
from rest_framework.response import Response

from apps.transactions.models import Transaction
from .services import (
    aggregate_total,
    apply_transaction_filters,
    build_filters_summary,
    build_report_filename,
    build_report_title,
    build_category_summary_payload,
    build_csv_response_rows,
    build_dashboard_payload,
    build_monthly_report_payload,
    build_pdf_bytes,
    build_transaction_report_rows,
    build_workbook,
    parse_month_param,
    resolve_export_window,
)


def parse_iso_date_or_error(raw_value, field_name):
    if not raw_value:
        return None
    try:
        return date.fromisoformat(raw_value)
    except ValueError as exc:
        raise serializers.ValidationError({field_name: "Enter a valid date."}) from exc


def validate_report_request_params(params):
    today = timezone.localdate()
    month_raw = params.get("month")
    start_date = parse_iso_date_or_error(params.get("start_date"), "start_date")
    end_date = parse_iso_date_or_error(params.get("end_date"), "end_date")
    reference_date = parse_iso_date_or_error(params.get("reference_date"), "reference_date")

    if month_raw:
        try:
            month = parse_month_param(month_raw)
        except ValueError as exc:
            raise serializers.ValidationError({"month": "Enter a valid month."}) from exc
        if month > today.replace(day=1):
            raise serializers.ValidationError({"month": "Future months are not allowed in reports."})

    if reference_date and reference_date > today:
        raise serializers.ValidationError({"reference_date": "Future dates are not allowed in reports."})
    if start_date and start_date > today:
        raise serializers.ValidationError({"start_date": "Future dates are not allowed in reports."})
    if end_date and end_date > today:
        raise serializers.ValidationError({"end_date": "Future dates are not allowed in reports."})
    if start_date and end_date and start_date > end_date:
        raise serializers.ValidationError({"end_date": "The end date must be on or after the start date."})


class DashboardReportView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response(build_dashboard_payload(request.user))


class MonthlyReportView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        validate_report_request_params(request.query_params)
        month = parse_month_param(request.query_params.get("month"))
        return Response(build_monthly_report_payload(request.user, month))


class CategorySummaryView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        validate_report_request_params(request.query_params)
        month = parse_month_param(request.query_params.get("month"))
        return Response(build_category_summary_payload(request.user, month))


class BaseExportView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def filtered_transactions(self, request):
        validate_report_request_params(request.query_params)
        queryset = Transaction.objects.filter(user=request.user).select_related("category").order_by("date", "created_at", "id")
        return apply_transaction_filters(queryset, request.query_params)

    def totals(self, transactions):
        return {
            "income": aggregate_total(transactions, "income"),
            "expense": aggregate_total(transactions, "expense"),
        }

    def report_descriptor(self, request):
        start_date, end_date, period = resolve_export_window(request.query_params)
        tx_type = request.query_params.get("type") or "all"
        return {
            "title": build_report_title(period),
            "filters_summary": build_filters_summary(period, start_date, end_date, tx_type),
            "filename_stem": build_report_filename(period, start_date, end_date),
        }


class ReportCSVView(BaseExportView):
    def get(self, request):
        queryset = self.filtered_transactions(request)
        transactions = build_transaction_report_rows(request.user, list(queryset))
        totals = self.totals(queryset)
        descriptor = self.report_descriptor(request)
        response = HttpResponse(content_type="text/csv; charset=utf-8")
        response["Content-Disposition"] = f'attachment; filename="{descriptor["filename_stem"]}.csv"'
        writer = csv.writer(response)
        writer.writerows(build_csv_response_rows(transactions, totals))
        return response


class ReportExcelView(BaseExportView):
    def get(self, request):
        queryset = self.filtered_transactions(request)
        transactions = build_transaction_report_rows(request.user, list(queryset))
        descriptor = self.report_descriptor(request)
        workbook = build_workbook(
            transactions,
            descriptor["title"],
            descriptor["filters_summary"],
            self.totals(queryset),
        )
        response = HttpResponse(
            workbook.getvalue(),
            content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        )
        response["Content-Disposition"] = f'attachment; filename="{descriptor["filename_stem"]}.xlsx"'
        return response


class ReportPDFView(BaseExportView):
    def get(self, request):
        queryset = self.filtered_transactions(request)
        transactions = build_transaction_report_rows(request.user, list(queryset))
        descriptor = self.report_descriptor(request)
        pdf_bytes = build_pdf_bytes(
            request.user,
            transactions,
            descriptor["title"],
            descriptor["filters_summary"],
            self.totals(queryset),
        )
        response = HttpResponse(pdf_bytes.getvalue(), content_type="application/pdf")
        response["Content-Disposition"] = f'attachment; filename="{descriptor["filename_stem"]}.pdf"'
        return response
