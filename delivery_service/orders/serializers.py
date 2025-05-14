from rest_framework import serializers
from .models import Customer, Courier, Order, User, CourierRating
from django.contrib.auth.hashers import make_password
from django.db.models import Avg

class RegisterSerializer(serializers.ModelSerializer):
    phone = serializers.CharField(write_only=True, required=False, allow_blank=True, help_text='Контактный телефон')
    vehicle = serializers.CharField(write_only=True, required=False, allow_blank=True, help_text='Транспортное средство')
    address = serializers.CharField(write_only=True, required=False, allow_blank=True, help_text='Адрес')

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'role', 'phone', 'vehicle', 'address']
        extra_kwargs = {
            'password': {'write_only': True},
            'username': {'help_text': 'Имя пользователя'},
            'email': {'help_text': 'Электронная почта'},
            'role': {'help_text': 'Роль пользователя'}
        }

    def create(self, validated_data):
        role = validated_data.pop('role', None)
        phone = validated_data.pop('phone', None)
        vehicle = validated_data.pop('vehicle', None)
        address = validated_data.pop('address', None)
        email = validated_data['email']

        user = User.objects.create_user(
            username=validated_data['username'],
            email=email,
            password=validated_data['password'],
            role=role,
        )

        if role == 'customer':
            Customer.objects.create(
                name=user.username,
                email=email,
                phone=phone,
                address=address,
            )
        elif role == 'courier':
            Courier.objects.create(
                name=user.username,
                email=email,
                phone=phone,
                vehicle=vehicle,
            )
        return user

    def to_representation(self, instance):
        return {
            'id': instance.id,
            'username': instance.username,
            'email': instance.email,
            'role': instance.role,
        }

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'role')
        extra_kwargs = {
            'username': {'help_text': 'Имя пользователя'},
            'email': {'help_text': 'Электронная почта'},
            'role': {'help_text': 'Роль пользователя'}
        }

class CustomerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = ('id', 'name', 'email', 'address', 'phone')

class CourierSerializer(serializers.ModelSerializer):
    monthly_orders = serializers.SerializerMethodField()
    monthly_earnings = serializers.SerializerMethodField()

    class Meta:
        model = Courier
        fields = ('id', 'name', 'email', 'phone', 'vehicle', 'balance', 'monthly_orders', 'monthly_earnings', 'current_location_lat', 'current_location_lon')
        read_only_fields = ('balance', 'monthly_orders', 'monthly_earnings')

    def get_monthly_orders(self, obj):
        return obj.get_monthly_orders_count()

    def get_monthly_earnings(self, obj):
        return float(obj.get_monthly_earnings())

class CourierRatingSerializer(serializers.ModelSerializer):
    courier_name = serializers.CharField(source='courier.name', read_only=True)
    customer_name = serializers.CharField(source='customer.name', read_only=True)

    class Meta:
        model = CourierRating
        fields = ['id', 'courier', 'courier_name', 'customer', 'customer_name', 'order', 'rating', 'created_at']
        read_only_fields = ['created_at']

    def validate(self, data):
        order = data.get('order')
        if order.status != 'Delivered':
            raise serializers.ValidationError("Можно оценить только доставленный заказ")
        if order.customer != data.get('customer'):
            raise serializers.ValidationError("Вы не можете оценить чужой заказ")
        if CourierRating.objects.filter(order=order).exists():
            raise serializers.ValidationError("Этот заказ уже оценен")
        return data

class CourierWithRatingSerializer(CourierSerializer):
    average_rating = serializers.SerializerMethodField()

    class Meta(CourierSerializer.Meta):
        fields = list(CourierSerializer.Meta.fields) + ['average_rating']

    def get_average_rating(self, obj):
        return CourierRating.objects.filter(courier=obj).aggregate(Avg('rating'))['rating__avg'] or 0

class OrderSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source='customer.name', read_only=True, allow_null=True)
    courier_name = serializers.CharField(source='courier.name', read_only=True, allow_null=True)
    customer = serializers.PrimaryKeyRelatedField(
        queryset=Customer.objects.all(),
        required=False,
        allow_null=True
    )
    courier = serializers.PrimaryKeyRelatedField(
        queryset=Courier.objects.all(),
        required=False,
        allow_null=True
    )
    address = serializers.CharField(required=False)
    description = serializers.CharField(required=False)

    class Meta:
        model = Order
        fields = [
            'id',
            'customer',
            'customer_name',
            'courier',
            'courier_name',
            'status',
            'address',
            'description',
            'created_at',
            'updated_at',
            'delivery_date'
        ]
        read_only_fields = ['created_at', 'updated_at', 'delivery_date']

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        if instance.customer:
            representation['customer'] = {
                'id': instance.customer.id,
                'name': instance.customer.name,
                'email': instance.customer.email,
                'phone': instance.customer.phone
            }
        else:
            representation['customer'] = None
            
        if instance.courier:
            representation['courier'] = {
                'id': instance.courier.id,
                'name': instance.courier.name,
                'email': instance.courier.email,
                'phone': instance.courier.phone,
                'vehicle': instance.courier.vehicle
            }
        else:
            representation['courier'] = None
            
        return representation

    def validate(self, data):
        # For couriers, only validate status field
        if self.context.get('request') and self.context['request'].user.role == 'courier':
            if len(data) > 1 or 'status' not in data:
                raise serializers.ValidationError("Couriers can only update order status")
            return data
            
        # For other users, validate all required fields
        if not self.partial and not data.get('address'):
            raise serializers.ValidationError({"address": "This field is required."})
        return data