from django.urls import path

from .views import (
    CategorySummaryView,
    DashboardReportView,
    MonthlyReportView,
    ReportCSVView,
    ReportExcelView,
    ReportPDFView,
)


urlpatterns = [
    path("dashboard/", DashboardReportView.as_view(), name="reports-dashboard"),
    path("monthly/", MonthlyReportView.as_view(), name="reports-monthly"),
    path("category-summary/", CategorySummaryView.as_view(), name="reports-category-summary"),
    path("export/csv/", ReportCSVView.as_view(), name="reports-export-csv"),
    path("export/xlsx/", ReportExcelView.as_view(), name="reports-export-xlsx"),
    path("export/pdf/", ReportPDFView.as_view(), name="reports-export-pdf"),
]
