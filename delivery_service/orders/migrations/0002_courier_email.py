# Generated by Django 5.1.4 on 2024-12-07 00:02

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('orders', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='courier',
            name='email',
            field=models.EmailField(default='default@example.com', max_length=254),
            preserve_default=False,
        ),
    ]