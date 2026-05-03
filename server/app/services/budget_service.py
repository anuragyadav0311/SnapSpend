from sqlalchemy.orm import Session

from app.models.budget import Budget
from app.models.user import User
from app.schemas.budget import BudgetCreate


def list_budgets(db: Session, user: User) -> list[Budget]:
    return (
        db.query(Budget)
        .filter(Budget.user_id == user.id)
        .order_by(Budget.month.desc())
        .all()
    )


def create_or_update_budget(payload: BudgetCreate, db: Session, user: User) -> Budget:
    budget = (
        db.query(Budget)
        .filter(Budget.user_id == user.id, Budget.month == payload.month)
        .first()
    )
    if budget is None:
        budget = Budget(
            user_id=user.id,
            monthly_limit=payload.monthly_limit,
            month=payload.month,
        )
        db.add(budget)
    else:
        budget.monthly_limit = payload.monthly_limit

    db.commit()
    db.refresh(budget)
    return budget
