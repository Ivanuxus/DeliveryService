from django.db import models
from django.contrib.auth.models import AbstractUser
from decimal import Decimal  
from django.utils.timezone import now
from django.contrib.auth.hashers import make_password
from django.db.models import Avg

class User(AbstractUser):
    ROLE_CHOICES = [
        ('admin', 'Администратор'),
        ('customer', 'Клиент'),
        ('courier', 'Курьер'),
    ]
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='customer', verbose_name='Роль')
    email = models.EmailField(unique=True)
    username = models.CharField(max_length=150, unique=True, null=True, blank=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    def __str__(self):
        return f"{self.email} ({self.get_role_display()})"
    
class Customer(models.Model):
    name = models.CharField(max_length=255, verbose_name='ФИО')
    email = models.EmailField(verbose_name='Электронная почта')
    address = models.CharField(max_length=255, blank=True, null=True, verbose_name='Адрес')  
    phone = models.CharField(max_length=15, blank=True, null=True, verbose_name='Телефон')
    
    class Meta:
        verbose_name = 'Клиент'
        verbose_name_plural = 'Клиенты'
    
    def save(self, *args, **kwargs):
        # Create or update associated user
        user, created = User.objects.get_or_create(
            email=self.email,
            defaults={
                'username': None,
                'password': make_password('a'),  # Default password is 'a'
                'role': 'customer',
                'first_name': self.name,
                'is_active': True
            }
        )
        if not created:
            user.first_name = self.name
            user.save()
        super().save(*args, **kwargs)
    
    def __str__(self):
        return self.name
    
class Courier(models.Model):
    name = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=15)
    vehicle = models.CharField(max_length=50)
    balance = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    current_location_lat = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True, verbose_name='Текущая широта')
    current_location_lon = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True, verbose_name='Текущая долгота')
    user = models.OneToOneField(User, on_delete=models.CASCADE, null=True, blank=True)

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        # Create or update associated user
        user, created = User.objects.get_or_create(
            email=self.email,
            defaults={
                'username': None,
                'password': make_password('a'),  # Default password is 'a'
                'role': 'courier',
                'first_name': self.name,
                'is_active': True
            }
        )
        if not created:
            user.first_name = self.name
            user.save()
        self.user = user
        super().save(*args, **kwargs)

    def get_monthly_orders_count(self):
        today = now()
        start_of_month = today.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        return Order.objects.filter(
            courier=self,
            status='Delivered',
            delivery_date__gte=start_of_month,
            delivery_date__lte=today
        ).count()

    def get_monthly_earnings(self):
        today = now()
        start_of_month = today.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        delivered_orders = Order.objects.filter(
            courier=self,
            status='Delivered',
            delivery_date__gte=start_of_month,
            delivery_date__lte=today
        ).count()
        return delivered_orders * Decimal('10.00')
    
class Order(models.Model):
    STATUS_CHOICES = [
        ('Pending', 'Ожидает обработки'),
        ('In Progress', 'В процессе доставки'),
        ('Delivered', 'Доставлен'),
    ]

    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name="orders", verbose_name='Клиент', null=True, blank=True)
    courier = models.ForeignKey('Courier', on_delete=models.CASCADE, related_name="orders", verbose_name='Курьер', null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Pending', verbose_name='Статус')
    address = models.CharField(max_length=255, verbose_name='Адрес доставки')
    description = models.TextField(verbose_name='Описание заказа', help_text='Опишите содержимое заказа', blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Дата создания')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Дата обновления')
    delivery_date = models.DateTimeField(null=True, blank=True, verbose_name='Дата доставки')

    class Meta:
        verbose_name = 'Заказ'
        verbose_name_plural = 'Заказы'
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        if self.pk:
            old_status = Order.objects.get(pk=self.pk).status
            if old_status != 'Delivered' and self.status == 'Delivered':
                self.delivery_date = now()
                if self.courier:
                    self.courier.balance += Decimal('10.00')
                    self.courier.save()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Заказ №{self.id} - {self.get_status_display()}"

class CourierRating(models.Model):
    courier = models.ForeignKey(Courier, on_delete=models.CASCADE, related_name='ratings')
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='given_ratings')
    order = models.OneToOneField(Order, on_delete=models.CASCADE, related_name='rating')
    rating = models.IntegerField(choices=[(i, i) for i in range(1, 6)])
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('courier', 'order')

    def __str__(self):
        return f"Rating {self.rating} for {self.courier.name} by {self.customer.name}"

    @property
    def average_rating(self):
        return CourierRating.objects.filter(courier=self.courier).aggregate(Avg('rating'))['rating__avg'] or 0