from pydantic import BaseModel, ConfigDict, Field


class BudgetCreate(BaseModel):
    monthly_limit: float = Field(gt=0)
    month: str = Field(pattern=r"^\d{4}-\d{2}$")


class BudgetResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    monthly_limit: float
    month: str
