from django.urls import path

from .views import (
    CategorySummaryView,
    DashboardReportView,
    ExportCSVView,
    ExportPDFView,
    ExportXLSXView,
    MonthlyReportView,
)

urlpatterns = [
    path("dashboard/", DashboardReportView.as_view(), name="reports-dashboard"),
    path("monthly/", MonthlyReportView.as_view(), name="reports-monthly"),
    path("category-summary/", CategorySummaryView.as_view(), name="reports-category-summary"),
    path("export/csv/", ExportCSVView.as_view(), name="reports-export-csv"),
    path("export/xlsx/", ExportXLSXView.as_view(), name="reports-export-xlsx"),
    path("export/pdf/", ExportPDFView.as_view(), name="reports-export-pdf"),
]
