"""Management command to seed default categories.

Usage:
    python manage.py seed_categories
    python manage.py seed_categories --clear  # remove existing defaults first
"""

from django.core.management.base import BaseCommand

# Default system categories (user=NULL)
DEFAULT_CATEGORIES = [
    # Income categories
    {"name": "Salary", "type": "income"},
    {"name": "Freelance", "type": "income"},
    {"name": "Investments", "type": "income"},
    {"name": "Gifts Received", "type": "income"},
    {"name": "Refunds", "type": "income"},
    {"name": "Other Income", "type": "income"},
    # Expense categories
    {"name": "Food & Dining", "type": "expense"},
    {"name": "Groceries", "type": "expense"},
    {"name": "Transportation", "type": "expense"},
    {"name": "Rent", "type": "expense"},
    {"name": "Utilities", "type": "expense"},
    {"name": "Healthcare", "type": "expense"},
    {"name": "Entertainment", "type": "expense"},
    {"name": "Shopping", "type": "expense"},
    {"name": "Education", "type": "expense"},
    {"name": "Subscriptions", "type": "expense"},
    {"name": "Insurance", "type": "expense"},
    {"name": "Gifts & Donations", "type": "expense"},
    {"name": "Travel", "type": "expense"},
    {"name": "Other Expense", "type": "expense"},
]


class Command(BaseCommand):
    help = "Seed the database with default system categories"

    def add_arguments(self, parser):
        parser.add_argument(
            "--clear",
            action="store_true",
            help="Remove existing default categories before seeding",
        )

    def handle(self, *args, **options):
        # Import here to avoid issues if the model doesn't exist yet
        from apps.transactions.models import Category

        if options["clear"]:
            deleted_count, _ = Category.objects.filter(user__isnull=True).delete()
            self.stdout.write(
                self.style.WARNING(f"Deleted {deleted_count} existing default categories")
            )

        created_count = 0
        skipped_count = 0

        for cat_data in DEFAULT_CATEGORIES:
            _, created = Category.objects.get_or_create(
                user=None,
                name=cat_data["name"],
                type=cat_data["type"],
            )
            if created:
                created_count += 1
            else:
                skipped_count += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"Seeding complete: {created_count} created, {skipped_count} already existed"
            )
        )
