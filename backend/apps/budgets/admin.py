from django.contrib import admin

from .models import Budget


@admin.register(Budget)
class BudgetAdmin(admin.ModelAdmin):
    list_display = ("user", "month", "limit_amount", "created_at", "updated_at")
    list_filter = ("month",)
    search_fields = ("user__email",)
