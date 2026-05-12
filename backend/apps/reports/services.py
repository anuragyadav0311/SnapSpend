from calendar import monthrange
from datetime import date
from decimal import Decimal
import io

from django.db.models import Q, Sum
from django.utils import timezone
from openpyxl import Workbook
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas

from apps.budgets.models import Budget
from apps.transactions.models import Transaction


def month_start_for(value):
    return value.replace(day=1)


def next_month_for(value):
    if value.month == 12:
        return value.replace(year=value.year + 1, month=1, day=1)
    return value.replace(month=value.month + 1, day=1)


def parse_month_param(raw_value):
    if not raw_value:
        return month_start_for(timezone.localdate())
    if len(raw_value) == 7:
        year, month = raw_value.split("-")
        return date(int(year), int(month), 1)
    return month_start_for(date.fromisoformat(raw_value))


def format_money(value):
    numeric = value or Decimal("0")
    return round(float(numeric), 2)


def apply_transaction_filters(queryset, params):
    tx_type = params.get("type")
    category_id = params.get("category")
    start_date = params.get("start_date")
    end_date = params.get("end_date")
    search = params.get("search")
    month = params.get("month")

    if tx_type in {"income", "expense"}:
        queryset = queryset.filter(type=tx_type)
    if category_id:
        queryset = queryset.filter(category_id=category_id)
    if month:
        month_start = parse_month_param(month)
        queryset = queryset.filter(date__gte=month_start, date__lt=next_month_for(month_start))
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
    return queryset


def serialize_transaction(transaction):
    return {
        "id": transaction.id,
        "type": transaction.type,
        "amount": str(transaction.amount),
        "category": transaction.category_id,
        "category_name": transaction.category.name if transaction.category else "Uncategorized",
        "title": transaction.title,
        "note": transaction.note,
        "date": transaction.date.isoformat(),
        "created_at": transaction.created_at.isoformat(),
        "updated_at": transaction.updated_at.isoformat(),
    }


def aggregate_total(queryset, tx_type):
    return queryset.filter(type=tx_type).aggregate(total=Sum("amount")).get("total") or Decimal("0")


def budget_snapshot_for(user, month):
    budget = Budget.objects.filter(user=user, month=month).first()
    if not budget:
        return None

    spent = aggregate_total(
        Transaction.objects.filter(
            user=user,
            type="expense",
            date__gte=month,
            date__lt=next_month_for(month),
        ),
        "expense",
    )
    remaining = budget.limit_amount - spent
    progress = round(float((spent / budget.limit_amount) * 100), 2) if budget.limit_amount else 0
    if spent > budget.limit_amount:
        status = "exceeded"
    elif budget.limit_amount and spent / budget.limit_amount >= Decimal("0.8"):
        status = "near_limit"
    else:
        status = "healthy"

    return {
        "id": budget.id,
        "month": budget.month.isoformat(),
        "limit_amount": str(budget.limit_amount),
        "spent_amount": str(spent),
        "remaining_amount": str(remaining),
        "progress_percent": progress,
        "status": status,
    }


def build_dashboard_payload(user):
    today = timezone.localdate()
    month = month_start_for(today)
    all_transactions = Transaction.objects.filter(user=user).select_related("category")
    current_month_transactions = all_transactions.filter(date__gte=month, date__lt=next_month_for(month))

    total_income = aggregate_total(all_transactions, "income")
    total_expense = aggregate_total(all_transactions, "expense")
    month_income = aggregate_total(current_month_transactions, "income")
    month_expense = aggregate_total(current_month_transactions, "expense")

    category_rows = (
        current_month_transactions.filter(type="expense")
        .values("category__name")
        .annotate(total=Sum("amount"))
        .order_by("-total")
    )
    category_total = sum((row["total"] for row in category_rows), Decimal("0"))
    category_breakdown = [
        {
            "name": row["category__name"] or "Uncategorized",
            "amount": format_money(row["total"]),
            "percentage": round(float((row["total"] / category_total) * 100), 2) if category_total else 0,
        }
        for row in category_rows
    ]

    trend = []
    current_index = month.year * 12 + month.month - 1
    for offset in range(5, -1, -1):
        month_index = current_index - offset
        trend_year = month_index // 12
        trend_month = month_index % 12 + 1
        trend_start = date(trend_year, trend_month, 1)
        trend_queryset = all_transactions.filter(date__gte=trend_start, date__lt=next_month_for(trend_start))
        trend.append(
            {
                "month": trend_start.strftime("%b %Y"),
                "income": format_money(aggregate_total(trend_queryset, "income")),
                "expense": format_money(aggregate_total(trend_queryset, "expense")),
            }
        )

    return {
        "totals": {
            "income": format_money(total_income),
            "expense": format_money(total_expense),
            "balance": format_money(total_income - total_expense),
        },
        "current_month": {
            "month": month.strftime("%B %Y"),
            "income": format_money(month_income),
            "expense": format_money(month_expense),
            "balance": format_money(month_income - month_expense),
            "savings_rate": round(float(((month_income - month_expense) / month_income) * 100), 2)
            if month_income
            else 0,
        },
        "recent_transactions": [
            serialize_transaction(transaction)
            for transaction in all_transactions.order_by("-date", "-created_at")[:5]
        ],
        "category_breakdown": category_breakdown,
        "monthly_trend": trend,
        "budget": budget_snapshot_for(user, month),
    }


def build_monthly_report_payload(user, month):
    next_month = next_month_for(month)
    transactions = (
        Transaction.objects.filter(user=user, date__gte=month, date__lt=next_month)
        .select_related("category")
        .order_by("-date", "-created_at")
    )
    income_total = aggregate_total(transactions, "income")
    expense_total = aggregate_total(transactions, "expense")

    return {
        "month": month.strftime("%B %Y"),
        "month_start": month.isoformat(),
        "month_end": date(month.year, month.month, monthrange(month.year, month.month)[1]).isoformat(),
        "totals": {
            "income": format_money(income_total),
            "expense": format_money(expense_total),
            "balance": format_money(income_total - expense_total),
        },
        "budget": budget_snapshot_for(user, month),
        "transactions": [serialize_transaction(transaction) for transaction in transactions],
    }


def build_category_summary_payload(user, month):
    transactions = Transaction.objects.filter(
        user=user,
        type="expense",
        date__gte=month,
        date__lt=next_month_for(month),
    )
    rows = transactions.values("category__name").annotate(total=Sum("amount")).order_by("-total")
    grand_total = sum((row["total"] for row in rows), Decimal("0"))
    categories = [
        {
            "name": row["category__name"] or "Uncategorized",
            "amount": format_money(row["total"]),
            "percentage": round(float((row["total"] / grand_total) * 100), 2) if grand_total else 0,
        }
        for row in rows
    ]
    return {
        "month": month.strftime("%B %Y"),
        "total_expense": format_money(grand_total),
        "categories": categories,
    }


def build_csv_response_rows(transactions):
    rows = [["Date", "Type", "Category", "Title", "Note", "Amount"]]
    rows.extend(
        [
            transaction.date.isoformat(),
            transaction.type,
            transaction.category.name if transaction.category else "Uncategorized",
            transaction.title,
            transaction.note,
            str(transaction.amount),
        ]
        for transaction in transactions
    )
    return rows


def build_workbook(transactions, title, filters_summary, totals):
    workbook = Workbook()
    sheet = workbook.active
    sheet.title = "Transactions Report"
    sheet.append([title])
    sheet.append([filters_summary])
    sheet.append(
        [
            f"Income: {format_money(totals['income'])}",
            f"Expense: {format_money(totals['expense'])}",
            f"Balance: {format_money(totals['income'] - totals['expense'])}",
        ]
    )
    sheet.append([])
    sheet.append(["Date", "Type", "Category", "Title", "Note", "Amount"])

    for transaction in transactions:
        sheet.append(
            [
                transaction.date.isoformat(),
                transaction.type,
                transaction.category.name if transaction.category else "Uncategorized",
                transaction.title,
                transaction.note,
                float(transaction.amount),
            ]
        )

    output = io.BytesIO()
    workbook.save(output)
    output.seek(0)
    return output


def build_pdf_bytes(user, transactions, title, filters_summary, totals):
    output = io.BytesIO()
    pdf = canvas.Canvas(output, pagesize=A4)
    width, height = A4
    y = height - 50

    def ensure_space(current_y, required=40):
        if current_y < required:
            pdf.showPage()
            return height - 50
        return current_y

    pdf.setFont("Helvetica-Bold", 14)
    pdf.drawString(40, y, title)
    y -= 20
    pdf.setFont("Helvetica", 10)
    pdf.drawString(40, y, f"User: {user.email}")
    y -= 14
    pdf.drawString(40, y, filters_summary)
    y -= 14
    pdf.drawString(
        40,
        y,
        f"Income: {format_money(totals['income'])}  Expense: {format_money(totals['expense'])}  Balance: {format_money(totals['income'] - totals['expense'])}",
    )
    y -= 24

    pdf.setFont("Helvetica-Bold", 10)
    pdf.drawString(40, y, "Date")
    pdf.drawString(110, y, "Type")
    pdf.drawString(170, y, "Category")
    pdf.drawString(290, y, "Title")
    pdf.drawRightString(width - 40, y, "Amount")
    y -= 16
    pdf.setFont("Helvetica", 9)

    for transaction in transactions:
        y = ensure_space(y)
        pdf.drawString(40, y, transaction.date.isoformat())
        pdf.drawString(110, y, transaction.type)
        pdf.drawString(170, y, (transaction.category.name if transaction.category else "Uncategorized")[:20])
        pdf.drawString(290, y, transaction.title[:28])
        pdf.drawRightString(width - 40, y, str(transaction.amount))
        y -= 14

    pdf.setFont("Helvetica-Oblique", 8)
    pdf.drawString(40, 20, f"Generated at {timezone.now().isoformat()}")
    pdf.save()
    output.seek(0)
    return output
