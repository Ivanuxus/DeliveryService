from django.core.management.base import BaseCommand
from orders.models import Courier

class Command(BaseCommand):
    help = 'Сбрасывает месячный счетчик заказов у курьеров'

    def handle(self, *args, **kwargs):
        Courier.objects.update(monthly_order_count=0)
        self.stdout.write(self.style.SUCCESS('Счетчики заказов сброшены'))