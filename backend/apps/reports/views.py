"""Reports views TODO.

Member 2 will implement dashboard, monthly summary, category summary,
and CSV/XLSX/PDF export endpoints here.
"""
import csv
import io
from django.http import HttpResponse
from rest_framework import views, permissions
from transactions.models import Transaction
from openpyxl import Workbook
from reportlab.pdfgen import canvas


class ReportCSVView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        transactions = Transaction.objects.filter(user=request.user)
        response = HttpResponse(content_type="text/csv")
        response["Content-Disposition"] = 'attachment; filename="transactions.csv"'

        writer = csv.writer(response)
        writer.writerow(["Date", "Title", "Amount", "Type", "Category"])
        for t in transactions:
            writer.writerow([t.date, t.title, t.amount, t.type, t.category.name if t.category else ""])
        return response


class ReportExcelView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        transactions = Transaction.objects.filter(user=request.user)
        wb = Workbook()
        ws = wb.active
        ws.append(["Date", "Title", "Amount", "Type", "Category"])

        for t in transactions:
            ws.append([t.date, t.title, float(t.amount), t.type, t.category.name if t.category else ""])

        response = HttpResponse(content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
        response["Content-Disposition"] = 'attachment; filename="transactions.xlsx"'
        wb.save(response)
        return response


class ReportPDFView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        transactions = Transaction.objects.filter(user=request.user)
        response = HttpResponse(content_type="application/pdf")
        response["Content-Disposition"] = 'attachment; filename="transactions.pdf"'

        p = canvas.Canvas(response)
        p.drawString(100, 800, "Transactions Report")
        y = 750
        for t in transactions:
            line = f"{t.date} | {t.title} | {t.amount} | {t.type} | {t.category.name if t.category else ''}"
            p.drawString(100, y, line)
            y -= 20
        p.showPage()
        p.save()
        return response