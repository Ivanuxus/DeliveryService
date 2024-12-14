from rest_framework import serializers
from .models import Customer, Courier, Order, User
from django.contrib.auth.hashers import make_password

class RegisterSerializer(serializers.ModelSerializer):
    phone = serializers.CharField(write_only=True, required=False, allow_blank=True)
    vehicle = serializers.CharField(write_only=True, required=False, allow_blank=True)
    address = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'role', 'phone', 'vehicle', 'address']
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        role = validated_data.pop('role', None)
        phone = validated_data.pop('phone', None)
        vehicle = validated_data.pop('vehicle', None)
        address = validated_data.pop('address', None)
        email = validated_data['email']  # Берем общее поле email

        # Создаем основного пользователя
        user = User.objects.create_user(
            username=validated_data['username'],
            email=email,
            password=validated_data['password'],
            role=role,
        )

        # Создаем записи в зависимости от роли
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
        """Возвращаем данные о пользователе после регистрации"""
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

class CustomerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = '__all__'

class CourierSerializer(serializers.ModelSerializer):
    class Meta:
        model = Courier
        fields = '__all__'


class OrderSerializer(serializers.ModelSerializer):
    # Поля для отображения имен (только чтение)
    customer_name = serializers.CharField(source='customer.name', read_only=True)
    courier_name = serializers.CharField(source='courier.name', read_only=True)

    # Поля для записи ID
    customer = serializers.PrimaryKeyRelatedField(queryset=Customer.objects.all())
    courier = serializers.PrimaryKeyRelatedField(queryset=Courier.objects.all())

    class Meta:
        model = Order
        fields = [
            'id', 'status', 'address', 'customer', 'courier',
            'customer_name', 'courier_name', 'created_at', 'updated_at'
        ]