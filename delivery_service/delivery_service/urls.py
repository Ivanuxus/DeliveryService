from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from rest_framework.schemas import get_schema_view
from rest_framework.permissions import AllowAny

from orders.views import (
    CustomerViewSet,
    CourierViewSet,
    OrderViewSet,
    RegisterView, 
    LoginView, 
    UserProfileView,
    distribute_orders_view,
)

# Публичная схема API
# schema_view = get_schema_view(
#     title="API Schema",
#     description="OpenAPI Schema for Delivery Service",
#     version="1.0.0",
#     permission_classes=[AllowAny],  # Отключаем аутентификацию для схемы
# )

# API роутер
router = DefaultRouter()
router.register(r'customers', CustomerViewSet)
router.register(r'couriers', CourierViewSet)
router.register(r'orders', OrderViewSet)

# URL-шаблоны
urlpatterns = [
    path('admin/', admin.site.urls),  # Админка
    path('api/', include(router.urls)),  # API маршруты
    path('api/register/', RegisterView.as_view(), name='register'),
    path('api/login/', LoginView.as_view(), name='login'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/me/', UserProfileView.as_view(), name='user_profile'),
    path('api/distribute-orders/', distribute_orders_view, name='distribute-orders'),
    path('api/', include('orders.urls')),  # Include orders app URLs
    # path('api/schema/', schema_view, name='api-schema'),    
]