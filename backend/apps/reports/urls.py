from django.urls import path
from .views import ReportCSVView, ReportExcelView, ReportPDFView

urlpatterns = [
    path("reports/csv/", ReportCSVView.as_view(), name="report-csv"),
    path("reports/excel/", ReportExcelView.as_view(), name="report-excel"),
    path("reports/pdf/", ReportPDFView.as_view(), name="report-pdf"),
]