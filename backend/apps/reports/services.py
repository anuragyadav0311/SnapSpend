import csv
from collections import defaultdict
from datetime import datetime
from decimal import Decimal
from io import BytesIO, StringIO

from django.db.models import Q
from django.db.models import Sum
from django.http import FileResponse, HttpResponse
from openpyxl import Workbook
from openpyxl.styles import Font
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.platypus import SimpleDocTemplate, Spacer, Table, TableStyle, Paragraph
from reportlab.lib.styles import getSampleStyleSheet

from apps.transactions.models import Transaction


def filter_transactions_for_user(user, params):
    queryset = Transaction.objects.filter(user=user).select_related("category")

    transaction_type = params.get("type")
    category_id = params.get("category")
    start_date = params.get("start_date")
    end_date = params.get("end_date")
    search = params.get("search")
    ordering = params.get("ordering")

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
    return queryset.order_by(*allowed_ordering.get(ordering, ("-date", "-created_at")))


def build_summary(queryset):
    income_total = queryset.filter(type="income").aggregate(total=Sum("amount"))["total"] or Decimal("0.00")
    expense_total = queryset.filter(type="expense").aggregate(total=Sum("amount"))["total"] or Decimal("0.00")
    return {
        "total_income": income_total,
        "total_expense": expense_total,
        "net_balance": income_total - expense_total,
        "transaction_count": queryset.count(),
    }


def build_dashboard_payload(user):
    queryset = Transaction.objects.filter(user=user).select_related("category")
    summary = build_summary(queryset)

    recent_transactions = [
        {
            "id": tx.id,
            "title": tx.title,
            "type": tx.type,
            "amount": tx.amount,
            "date": tx.date,
            "category": tx.category.name if tx.category else None,
        }
        for tx in queryset[:5]
    ]

    category_totals = (
        queryset.filter(type="expense")
        .values("category__name")
        .annotate(total=Sum("amount"))
        .order_by("-total")
    )

    monthly_map = defaultdict(lambda: {"income": Decimal("0.00"), "expense": Decimal("0.00")})
    for tx in queryset:
        key = tx.date.strftime("%Y-%m")
        monthly_map[key][tx.type] += tx.amount

    monthly_trend = [
        {
            "month": month,
            "income": values["income"],
            "expense": values["expense"],
        }
        for month, values in sorted(monthly_map.items())
    ]

    return {
        **summary,
        "recent_transactions": recent_transactions,
        "category_breakdown": [
            {"category": item["category__name"] or "Uncategorized", "amount": item["total"]}
            for item in category_totals
        ],
        "monthly_trend": monthly_trend,
    }


def build_monthly_payload(queryset):
    monthly = defaultdict(lambda: {"income": Decimal("0.00"), "expense": Decimal("0.00")})
    for tx in queryset:
        key = tx.date.strftime("%Y-%m")
        monthly[key][tx.type] += tx.amount
    return [
        {
            "month": month,
            "income": values["income"],
            "expense": values["expense"],
            "net_balance": values["income"] - values["expense"],
        }
        for month, values in sorted(monthly.items())
    ]


def build_category_summary_payload(queryset):
    category_rows = (
        queryset.filter(type="expense")
        .values("category__name")
        .annotate(total=Sum("amount"))
        .order_by("-total")
    )
    total_expense = sum((row["total"] for row in category_rows), Decimal("0.00"))
    return [
        {
            "category": row["category__name"] or "Uncategorized",
            "amount": row["total"],
            "percentage": round(float((row["total"] / total_expense) * 100), 2) if total_expense else 0.0,
        }
        for row in category_rows
    ]


def export_csv_response(queryset):
    buffer = StringIO()
    writer = csv.writer(buffer)
    writer.writerow(["Date", "Type", "Category", "Title", "Note", "Amount"])
    for tx in queryset:
        writer.writerow(
            [
                tx.date.isoformat(),
                tx.type,
                tx.category.name if tx.category else "",
                tx.title,
                tx.note,
                f"{tx.amount:.2f}",
            ]
        )

    response = HttpResponse(buffer.getvalue(), content_type="text/csv; charset=utf-8")
    response["Content-Disposition"] = 'attachment; filename="transactions_report.csv"'
    return response


def export_xlsx_response(queryset, params, user):
    workbook = Workbook()
    sheet = workbook.active
    sheet.title = "Transactions Report"

    summary = build_summary(queryset)
    sheet["A1"] = "Expense Tracker - Transactions Report"
    sheet["A1"].font = Font(bold=True, size=14)
    sheet["A2"] = (
        f"Filters: type={params.get('type', 'all')}, category={params.get('category', 'all')}, "
        f"date={params.get('start_date', '-') } to {params.get('end_date', '-')}"
    )
    sheet["A4"] = f"User: {user.name} ({user.email})"
    sheet["A5"] = f"Total Income: {summary['total_income']}"
    sheet["B5"] = f"Total Expense: {summary['total_expense']}"
    sheet["C5"] = f"Net Balance: {summary['net_balance']}"

    headers = ["Date", "Type", "Category", "Title", "Note", "Amount"]
    header_row = 7
    for col, header in enumerate(headers, start=1):
        cell = sheet.cell(row=header_row, column=col, value=header)
        cell.font = Font(bold=True)

    for row_index, tx in enumerate(queryset, start=8):
        sheet.cell(row=row_index, column=1, value=tx.date.isoformat())
        sheet.cell(row=row_index, column=2, value=tx.type)
        sheet.cell(row=row_index, column=3, value=tx.category.name if tx.category else "")
        sheet.cell(row=row_index, column=4, value=tx.title)
        sheet.cell(row=row_index, column=5, value=tx.note)
        amount_cell = sheet.cell(row=row_index, column=6, value=float(tx.amount))
        amount_cell.number_format = '#,##0.00'

    for column_letter, width in {"A": 14, "B": 12, "C": 20, "D": 28, "E": 32, "F": 14}.items():
        sheet.column_dimensions[column_letter].width = width

    output = BytesIO()
    workbook.save(output)
    output.seek(0)

    response = HttpResponse(
        output.read(),
        content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    )
    response["Content-Disposition"] = 'attachment; filename="transactions_report.xlsx"'
    return response


def export_pdf_response(queryset, params, user):
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, leftMargin=12 * mm, rightMargin=12 * mm)
    styles = getSampleStyleSheet()
    story = [
        Paragraph("Expense Tracker - Transactions Report", styles["Title"]),
        Spacer(1, 8),
        Paragraph(f"User: {user.name} ({user.email})", styles["Normal"]),
        Paragraph(
            f"Filters: type={params.get('type', 'all')}, category={params.get('category', 'all')}, "
            f"date={params.get('start_date', '-') } to {params.get('end_date', '-')}",
            styles["Normal"],
        ),
        Paragraph(f"Generated on {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}", styles["Normal"]),
        Spacer(1, 10),
    ]

    summary = build_summary(queryset)
    story.extend(
        [
            Paragraph(f"Total Income: {summary['total_income']}", styles["Normal"]),
            Paragraph(f"Total Expense: {summary['total_expense']}", styles["Normal"]),
            Paragraph(f"Net Balance: {summary['net_balance']}", styles["Normal"]),
            Spacer(1, 10),
        ]
    )

    rows = [["Date", "Type", "Category", "Title", "Note", "Amount"]]
    for tx in queryset:
        rows.append(
            [
                tx.date.isoformat(),
                tx.type,
                tx.category.name if tx.category else "",
                tx.title,
                tx.note[:40],
                f"{tx.amount:.2f}",
            ]
        )

    table = Table(rows, repeatRows=1)
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1f2937")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.whitesmoke),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f5f5f5")]),
            ]
        )
    )
    story.append(table)
    doc.build(story)
    buffer.seek(0)
    return FileResponse(buffer, as_attachment=True, filename="transactions_report.pdf")
