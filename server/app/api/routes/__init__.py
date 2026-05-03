from fastapi import APIRouter

from app.api.routes.auth import router as auth_router
from app.api.routes.budget import router as budget_router
from app.api.routes.expenses import router as expenses_router

api_router = APIRouter()
api_router.include_router(auth_router)
api_router.include_router(expenses_router)
api_router.include_router(budget_router)

__all__ = ["api_router"]
