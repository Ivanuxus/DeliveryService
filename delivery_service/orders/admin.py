from django.contrib import admin
from .models import Customer, Courier, Order, User

@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ('username', 'email', 'role')
    list_filter = ('role',)
    search_fields = ('username', 'email')

@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):
    list_display = ('name', 'email', 'phone', 'address')
    search_fields = ('name', 'email', 'phone')

@admin.register(Courier)
class CourierAdmin(admin.ModelAdmin):
    list_display = ('name', 'email', 'phone', 'vehicle', 'balance', 'get_monthly_orders_count')
    search_fields = ('name', 'email', 'phone')

@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ('id', 'customer', 'courier', 'status', 'address', 'description', 'created_at', 'delivery_date')
    list_filter = ('status', 'created_at', 'delivery_date')
    search_fields = ('customer__name', 'courier__name', 'address', 'description')
    ordering = ('-created_at',)
    readonly_fields = ('created_at', 'updated_at') 