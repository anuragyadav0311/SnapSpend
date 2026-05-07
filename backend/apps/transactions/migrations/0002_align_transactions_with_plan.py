import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("transactions", "0001_initial"),
    ]

    operations = [
        migrations.AlterUniqueTogether(
            name="category",
            unique_together={("user", "name", "type")},
        ),
        migrations.AddField(
            model_name="transaction",
            name="receipt",
            field=models.FileField(blank=True, null=True, upload_to="receipts/"),
        ),
        migrations.AlterField(
            model_name="transaction",
            name="category",
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.PROTECT,
                related_name="transactions",
                to="transactions.category",
            ),
        ),
    ]
