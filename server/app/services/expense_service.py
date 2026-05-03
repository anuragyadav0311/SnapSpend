from datetime import datetime, timezone

from fastapi import status
from sqlalchemy.orm import Session

from app.models.expense import Expense
from app.models.user import User
from app.schemas.expense import ExpenseCreate, ExpenseUpdate
from app.utils.exceptions import AppException


def list_expenses(db: Session, user: User) -> list[Expense]:
    return (
        db.query(Expense)
        .filter(Expense.user_id == user.id)
        .order_by(Expense.date.desc())
        .all()
    )


def create_expense(payload: ExpenseCreate, db: Session, user: User) -> Expense:
    expense = Expense(
        user_id=user.id,
        amount=payload.amount,
        category=payload.category,
        description=payload.description,
        date=payload.date or datetime.now(timezone.utc),
    )
    db.add(expense)
    db.commit()
    db.refresh(expense)
    return expense


def update_expense(
    expense_id: int,
    payload: ExpenseUpdate,
    db: Session,
    user: User,
) -> Expense:
    expense = (
        db.query(Expense)
        .filter(Expense.id == expense_id, Expense.user_id == user.id)
        .first()
    )
    if expense is None:
        raise AppException(status.HTTP_404_NOT_FOUND, "Expense not found")

    updates = payload.model_dump(exclude_unset=True)
    for field, value in updates.items():
        setattr(expense, field, value)

    db.commit()
    db.refresh(expense)
    return expense


def delete_expense(expense_id: int, db: Session, user: User) -> None:
    expense = (
        db.query(Expense)
        .filter(Expense.id == expense_id, Expense.user_id == user.id)
        .first()
    )
    if expense is None:
        raise AppException(status.HTTP_404_NOT_FOUND, "Expense not found")

    db.delete(expense)
    db.commit()
