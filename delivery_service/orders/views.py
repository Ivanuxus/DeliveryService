from rest_framework import viewsets
from .models import Customer,Courier, Order, User
from rest_framework.decorators import action
from .permissions import IsAdmin, IsCourier, IsCustomer
from .serializers import CustomerSerializer, CourierSerializer, OrderSerializer, RegisterSerializer, UserSerializer
from django.shortcuts import render
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import status
from rest_framework.viewsets import ModelViewSet
from django.views.generic import TemplateView
from datetime import datetime, timedelta
from django.utils.timezone import now
from django.http import HttpResponseNotFound
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
import logging
from rest_framework_simplejwt.tokens import RefreshToken
logger = logging.getLogger(__name__)
# Представление для карты
def map_view(request):
    return render(request, 'orders/map.html')

# Представление для списка клиентов
def customers_list_view(request):
    customers = Customer.objects.all()
    return render(request, 'orders/customers_list.html', {'customers': customers})

# Представление для списка заказов
def orders_list_view(request):
    orders = Order.objects.all()
    return render(request, 'orders/orders_list.html', {'orders': orders})

# Представление для списка курьеров
def couriers_list_view(request):
    couriers = Courier.objects.all()
    return render(request, 'orders/couriers_list.html', {'couriers': couriers})

# Главная страница
def home_view(request):
    return render(request, 'home.html')

# Класс для работы с React
class ReactAppView(TemplateView):
    template_name = "index.html"

    def get(self, request, *args, **kwargs):
        try:
            return super().get(request, *args, **kwargs)
        except Exception:
            return HttpResponseNotFound("React build not found.")

class CustomerViewSet(viewsets.ModelViewSet):
    queryset = Customer.objects.all()
    serializer_class = CustomerSerializer
    permission_classes = [IsAuthenticated] 

class CourierViewSet(viewsets.ModelViewSet):
    queryset = Courier.objects.all()
    serializer_class = CourierSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.role == 'courier':
            return Courier.objects.filter(email=user.email)
        return super().get_queryset()

class OrderViewSet(viewsets.ModelViewSet):
    queryset = Order.objects.all()
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['status']
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [IsAuthenticated()]
        elif self.action in ['create', 'update', 'delete']:
            return [IsAuthenticated(), IsAdmin()]
        return super().get_permissions()
    
    class RegisterView(APIView):
        permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            return Response({"message": "User registered successfully."})
        return Response(serializer.errors, status=400)
    def get_queryset(self):
        user = self.request.user
        if user.role == 'courier':
            return Order.objects.filter(courier__email=user.email)
        elif user.role == 'customer':
            return Order.objects.filter(customer__email=user.email)
        return super().get_queryset()
    
class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)  # Используем RegisterSerializer
        if serializer.is_valid():
            user = serializer.save()  # RegisterSerializer создаст Customer или Courier
            return Response({"message": "Регистрация прошла успешно."}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get("username")
        password = request.data.get("password")
        user = User.objects.filter(username=username).first()
        if user and user.check_password(password):
            refresh = RefreshToken.for_user(user)
            balance = None
            if user.role == 'courier':
                courier = Courier.objects.get(email=user.email)
                balance = courier.balance

            return Response({
                "refresh": str(refresh),
                "access": str(refresh.access_token),
                "user": {
                    "id": user.id,
                    "username": user.username,
                    "email": user.email,
                    "role": user.role,
                    "balance": balance,
                }
            })
        return Response({"error": "Invalid credentials"}, status=400)

class UserDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)