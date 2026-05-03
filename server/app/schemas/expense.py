from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class ExpenseCreate(BaseModel):
    amount: float = Field(gt=0)
    category: str = Field(min_length=2, max_length=100)
    description: str | None = Field(default=None, max_length=500)
    date: datetime | None = None


class ExpenseUpdate(BaseModel):
    amount: float | None = Field(default=None, gt=0)
    category: str | None = Field(default=None, min_length=2, max_length=100)
    description: str | None = Field(default=None, max_length=500)
    date: datetime | None = None


class ExpenseResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    amount: float
    category: str
    description: str | None
    date: datetime
