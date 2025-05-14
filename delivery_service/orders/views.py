from rest_framework import viewsets
from .models import Customer,Courier, Order, User, CourierRating
from rest_framework.decorators import action, api_view, permission_classes
from .permissions import IsAdmin, IsCourier, IsCustomer, CanUpdateOrderStatus
from .serializers import CustomerSerializer, CourierSerializer, OrderSerializer, RegisterSerializer, UserSerializer, CourierRatingSerializer, CourierWithRatingSerializer
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
from django.contrib.auth import authenticate
from decimal import Decimal
from .order_distribution import distribute_orders
from rest_framework.permissions import IsAdminUser
from django.db.models import Avg
from rest_framework.exceptions import PermissionDenied

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
            return HttpResponseNotFound("Сборка React не найдена.")

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

    def get_serializer_class(self):
        if self.action == 'list' or self.action == 'retrieve':
            return CourierWithRatingSerializer
        return CourierSerializer

    @action(detail=False, methods=['post'])
    def update_location(self, request):
        if request.user.role != 'courier':
            return Response(
                {"error": "Only couriers can update their location"},
                status=status.HTTP_403_FORBIDDEN
            )

        try:
            courier = Courier.objects.get(email=request.user.email)
            lat = request.data.get('lat')
            lon = request.data.get('lon')

            if lat is None or lon is None:
                return Response(
                    {"error": "Both latitude and longitude are required"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            try:
                lat = float(lat)
                lon = float(lon)
            except ValueError:
                return Response(
                    {"error": "Latitude and longitude must be valid numbers"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            courier.current_location_lat = lat
            courier.current_location_lon = lon
            courier.save()

            return Response({
                "message": "Location updated successfully",
                "lat": lat,
                "lon": lon
            })

        except Courier.DoesNotExist:
            return Response(
                {"error": "Courier not found"},
                status=status.HTTP_404_NOT_FOUND
            )

    @action(detail=False, methods=['get'])
    def best_courier(self, request):
        """Получить курьера с наивысшим рейтингом"""
        best_courier = Courier.objects.annotate(
            avg_rating=Avg('ratings__rating')
        ).order_by('-avg_rating').first()
        
        if best_courier:
            serializer = CourierWithRatingSerializer(best_courier)
            return Response(serializer.data)
        return Response({'message': 'Нет курьеров с оценками'}, status=404)

class OrderViewSet(viewsets.ModelViewSet):
    queryset = Order.objects.all()
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = {
        'status': ['exact'],
        'delivery_date': ['exact', 'gte', 'lte'],
        'created_at': ['exact', 'gte', 'lte']
    }

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [IsAuthenticated()]
        elif self.action in ['update', 'partial_update']:
            if self.request.user.role == 'admin':
                return [IsAuthenticated()]
            elif self.request.user.role == 'courier':
                return [IsAuthenticated(), CanUpdateOrderStatus()]
            else:
                return [IsAuthenticated()]
        elif self.action in ['create']:
            return [IsAuthenticated()]
        elif self.action in ['destroy']:
            if self.request.user.role == 'admin':
                return [IsAuthenticated()]
            elif self.request.user.role == 'customer':
                return [IsAuthenticated()]
            else:
                return [IsAuthenticated(), IsAdmin()]
        return super().get_permissions()
    
    def get_queryset(self):
        user = self.request.user
        queryset = Order.objects.all()
        
        # Date range filtering
        start_date = self.request.query_params.get('start_date', None)
        end_date = self.request.query_params.get('end_date', None)
        
        if start_date:
            try:
                start = datetime.strptime(start_date, '%Y-%m-%d').date()
                queryset = queryset.filter(delivery_date__date__gte=start)
            except ValueError:
                pass
                
        if end_date:
            try:
                end = datetime.strptime(end_date, '%Y-%m-%d').date()
                queryset = queryset.filter(delivery_date__date__lte=end)
            except ValueError:
                pass
        
        if user.role == 'courier':
            queryset = queryset.filter(courier__email=user.email)
        elif user.role == 'customer':
            queryset = queryset.filter(customer__email=user.email)
        
        return queryset

    def perform_create(self, serializer):
        user = self.request.user
        if user.role == 'customer':
            try:
                # Get the customer instance for the current user
                customer = Customer.objects.get(email=user.email)
                serializer.save(customer=customer)
            except Customer.DoesNotExist:
                # If customer doesn't exist, create it
                customer = Customer.objects.create(
                    name=user.username,
                    email=user.email,
                    phone=user.phone if hasattr(user, 'phone') else None
                )
                serializer.save(customer=customer)
        else:
            serializer.save()

    def create(self, request, *args, **kwargs):
        # Validate required fields
        if not request.data.get('address'):
            return Response(
                {"error": "Address is required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # For customers, ensure they can only create orders for themselves
        if request.user.role == 'customer':
            try:
                customer = Customer.objects.get(email=request.user.email)
                request.data['customer'] = customer.id
            except Customer.DoesNotExist:
                return Response(
                    {"error": "Customer profile not found"},
                    status=status.HTTP_400_BAD_REQUEST
                )

        return super().create(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        user = request.user
        
        # Allow admin to delete any order
        if user.role == 'admin':
            self.perform_destroy(instance)
            return Response(status=status.HTTP_204_NO_CONTENT)
            
        # Allow customer to delete only their own orders
        if user.role == 'customer' and instance.customer and instance.customer.email == user.email:
            self.perform_destroy(instance)
            return Response(status=status.HTTP_204_NO_CONTENT)
            
        return Response(
            {"error": "You don't have permission to delete this order"},
            status=status.HTTP_403_FORBIDDEN
        )

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        
        # If user is a courier, only allow status update
        if request.user.role == 'courier':
            if len(request.data) > 1 or 'status' not in request.data:
                return Response(
                    {"error": "Couriers can only update order status"},
                    status=status.HTTP_403_FORBIDDEN
                )
        
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        
        # Handle customer and courier updates
        if 'customer' in request.data:
            customer_id = request.data.get('customer')
            if customer_id:
                try:
                    customer = Customer.objects.get(id=customer_id)
                    instance.customer = customer
                except Customer.DoesNotExist:
                    return Response(
                        {"error": f"Customer with id {customer_id} does not exist"},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            else:
                instance.customer = None
                
        if 'courier' in request.data:
            courier_id = request.data.get('courier')
            if courier_id:
                try:
                    courier = Courier.objects.get(id=courier_id)
                    instance.courier = courier
                except Courier.DoesNotExist:
                    return Response(
                        {"error": f"Courier with id {courier_id} does not exist"},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            else:
                instance.courier = None
        
        self.perform_update(serializer)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def statistics(self, request):
        user = request.user
        if user.role != 'courier':
            return Response({"error": "Only couriers can view statistics"}, status=403)

        # Calculate statistics for the current month
        today = now()
        start_of_month = today.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        
        courier = Courier.objects.get(email=user.email)
        monthly_orders = Order.objects.filter(
            courier=courier,
            status='Delivered',
            delivery_date__gte=start_of_month,
            delivery_date__lte=today
        )
        
        monthly_stats = {
            'total_orders': monthly_orders.count(),
            'total_earnings': float(monthly_orders.count() * Decimal('10.00')),
            'period': {
                'start': start_of_month.strftime('%Y-%m-%d'),
                'end': today.strftime('%Y-%m-%d')
            }
        }
        
        return Response(monthly_stats)

class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            return Response({"message": "Регистрация успешно завершена."}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get("email")
        password = request.data.get("password")
        
        logger.info(f"Login attempt - Request data: {request.data}")
        logger.info(f"Login attempt for email: {email}")
        
        if not email or not password:
            logger.warning("Login attempt failed: Missing email or password")
            return Response(
                {"error": "Необходимо указать email и пароль", "code": "missing_credentials"}, 
                status=400
            )
            
        try:
            # First try to find the user by email
            user = User.objects.get(email=email)
            logger.info(f"User found: {user.email}, role: {user.role}, is_active: {user.is_active}")
            
            # Check if the password is correct
            if user.check_password(password):
                logger.info(f"Password check successful for user: {user.email}")
                refresh = RefreshToken.for_user(user)
                balance = None
                
                # If user is a courier, get their balance
                if user.role == 'courier':
                    try:
                        courier = Courier.objects.get(email=user.email)
                        balance = courier.balance
                        logger.info(f"Courier balance retrieved: {balance}")
                    except Courier.DoesNotExist:
                        logger.warning(f"Courier profile not found for user: {user.email}")

                response_data = {
                    "refresh": str(refresh),
                    "access": str(refresh.access_token),
                    "user": {
                        "id": user.id,
                        "email": user.email,
                        "role": user.role,
                        "balance": balance,
                    }
                }
                logger.info(f"Login successful for user: {user.email}")
                return Response(response_data)
            else:
                logger.warning(f"Invalid password for user: {user.email}")
                return Response(
                    {"error": "Неверный пароль", "code": "invalid_password"}, 
                    status=401
                )
        except User.DoesNotExist:
            logger.warning(f"User not found with email: {email}")
            # Log all users in the database for debugging
            all_users = User.objects.all()
            logger.info(f"All users in database: {[{'email': u.email, 'is_active': u.is_active} for u in all_users]}")
            return Response(
                {"error": "Пользователь с таким email не найден", "code": "user_not_found"}, 
                status=401
            )

class UserDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

class UserProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        data = {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'role': user.role,
        }

        # Try to get phone number from either Customer or Courier model
        try:
            if user.role == 'courier':
                courier = Courier.objects.get(email=user.email)
                data.update({
                    'phone': courier.phone,
                    'vehicle': courier.vehicle,
                })
            elif user.role == 'customer':
                customer = Customer.objects.get(email=user.email)
                data.update({
                    'phone': customer.phone,
                    'address': customer.address,
                })
            else:  # For admin, try to get phone from Customer
                try:
                    customer = Customer.objects.get(email=user.email)
                    data['phone'] = customer.phone
                except Customer.DoesNotExist:
                    pass
        except (Customer.DoesNotExist, Courier.DoesNotExist):
            pass

        return Response(data)

    def put(self, request):
        user = request.user
        data = request.data

        # Update basic user info
        if 'username' in data:
            user.username = data['username']
        if 'email' in data:
            user.email = data['email']

        # Update password if provided
        if 'new_password' in data:
            if not user.check_password(data.get('current_password', '')):
                return Response(
                    {"error": "Неверный текущий пароль"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            user.set_password(data['new_password'])

        user.save()

        # Update role-specific data
        if 'phone' in data:
            if user.role == 'courier':
                courier, _ = Courier.objects.get_or_create(email=user.email)
                courier.phone = data['phone']
                if 'vehicle' in data:
                    courier.vehicle = data['vehicle']
                courier.save()
            elif user.role == 'customer':
                customer, _ = Customer.objects.get_or_create(email=user.email)
                customer.phone = data['phone']
                if 'address' in data:
                    customer.address = data['address']
                customer.save()
            else:  # For admin
                customer, _ = Customer.objects.get_or_create(email=user.email)
                customer.phone = data['phone']
                customer.save()

        return Response({"message": "Профиль успешно обновлен"})

class CourierRatingViewSet(viewsets.ModelViewSet):
    serializer_class = CourierRatingSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'customer':
            customer = Customer.objects.get(email=user.email)
            return CourierRating.objects.filter(customer=customer)
        elif user.role == 'courier':
            courier = Courier.objects.get(email=user.email)
            return CourierRating.objects.filter(courier=courier)
        return CourierRating.objects.all()

    def perform_create(self, serializer):
        user = self.request.user
        if user.role != 'customer':
            raise PermissionDenied("Только клиенты могут оценивать курьеров")
        customer = Customer.objects.get(email=user.email)
        serializer.save(customer=customer)

    @action(detail=False, methods=['get'])
    def top_rated(self, request):
        """Get top rated couriers"""
        couriers = Courier.objects.annotate(
            avg_rating=Avg('ratings__rating')
        ).filter(
            avg_rating__isnull=False
        ).order_by('-avg_rating')[:5]
        
        serializer = CourierWithRatingSerializer(couriers, many=True)
        return Response(serializer.data)

@api_view(['POST'])
@permission_classes([IsAdminUser])
def distribute_orders_view(request):
    result = distribute_orders()
    return Response(result)