from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from orders.views import (
    CustomerViewSet,
    CourierViewSet,
    OrderViewSet,
    home_view,
    customers_list_view,
    orders_list_view,
    couriers_list_view,
    map_view,
    ReactAppView,
    RegisterView, 
    LoginView, 
    UserDetailView,
)

# API роутер
router = DefaultRouter()
router.register(r'customers', CustomerViewSet)
router.register(r'couriers', CourierViewSet)
router.register(r'orders', OrderViewSet)

# URL-шаблоны
urlpatterns = [
    path('admin/', admin.site.urls),  # Админка
    path('', home_view, name='home'),  # Главная страница
    path('customers/', customers_list_view, name='customers_list'),  # Клиенты
    path('orders/', orders_list_view, name='orders_list'),  # Заказы
    path('couriers/', couriers_list_view, name='couriers_list'),  # Курьеры
    path('map/', map_view, name='map'),  # Карта
    path('api/', include(router.urls)),  # API маршруты
    path('react/', ReactAppView.as_view(), name='react'),  # React-приложение
        path('api/register/', RegisterView.as_view(), name='register'),
    path('api/login/', LoginView.as_view(), name='login'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/me/', UserDetailView.as_view(), name='user_detail'),

]