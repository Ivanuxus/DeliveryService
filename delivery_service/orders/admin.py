from django.contrib import admin
from .models import Customer, Order, Courier

@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'email', 'address', 'phone')  # Обновлено
    search_fields = ('name', 'email', 'address', 'phone')

@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ('id', 'customer', 'courier', 'status', 'address', 'created_at', 'updated_at')  # Обновлено
    list_filter = ('status', 'created_at')
    search_fields = ('customer__name', 'courier__name', 'address')

@admin.register(Courier)
class CourierAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'phone', 'vehicle', 'balance')
    search_fields = ('name', 'phone', 'vehicle', 'email') 