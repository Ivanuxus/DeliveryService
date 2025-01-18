# Generated by Django 5.1.4 on 2025-01-15 09:24

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('orders', '0003_courier_balance'),
    ]

    operations = [
        migrations.AddField(
            model_name='courier',
            name='user',
            field=models.OneToOneField(null=True, on_delete=django.db.models.deletion.CASCADE, related_name='courier', to=settings.AUTH_USER_MODEL),
        ),
    ]
