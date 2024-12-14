from django.db import models
from django.contrib.auth.models import AbstractUser

class User(AbstractUser):
    ROLE_CHOICES = [
        ('admin', 'Admin'),
        ('customer', 'Customer'),
        ('courier', 'Courier'),
    ]
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='customer')

    def __str__(self):
        return f"{self.username} ({self.role})"
    
class Customer(models.Model):
    name = models.CharField(max_length=255)
    email = models.EmailField()
    address = models.CharField(max_length=255, blank=True, null=True)  # Новый атрибут
    phone = models.CharField(max_length=15, blank=True, null=True)  # Новый атрибут

    def __str__(self):
        return self.name

class Courier(models.Model):
    name = models.CharField(max_length=255)
    phone = models.CharField(max_length=15)
    vehicle = models.CharField(max_length=50)
    email = models.EmailField()  # Добавлено поле email
    balance = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)  # Баланс курьера

    def __str__(self):
        return self.name
    
class Order(models.Model):
    STATUS_CHOICES = [
        ('Pending', 'Pending'),
        ('In Progress', 'In Progress'),
        ('Delivered', 'Delivered'),
    ]

    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name="orders")
    courier = models.ForeignKey('Courier', on_delete=models.CASCADE, related_name="orders")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Pending')
    address = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    def save(self, *args, **kwargs):
        # Проверяем, был ли заказ доставлен
        if self.pk:
            old_status = Order.objects.get(pk=self.pk).status
            if old_status != 'Delivered' and self.status == 'Delivered':
                # Начисляем деньги курьеру
                self.courier.balance += 10.00  # Например, фиксированная сумма 10.00
                self.courier.save()

        super().save(*args, **kwargs)

    def __str__(self):
        return f"Order {self.id} - {self.status}"