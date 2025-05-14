from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CustomerViewSet,
    CourierViewSet,
    OrderViewSet,
    RegisterView,
    LoginView,
    UserProfileView,
    distribute_orders_view,
    CourierRatingViewSet,
)

router = DefaultRouter()
router.register(r"customers", CustomerViewSet)
router.register(r"couriers", CourierViewSet)
router.register(r"orders", OrderViewSet)
router.register(r"ratings", CourierRatingViewSet, basename='rating')
router.register(r'courier-ratings', CourierRatingViewSet, basename='courier-rating')

urlpatterns = [
    path("", include(router.urls)),
    path("register/", RegisterView.as_view(), name="register"),
    path("login/", LoginView.as_view(), name="login"),
    path("users/me/", UserProfileView.as_view(), name="user-profile"),
    path('distribute-orders/', distribute_orders_view, name='distribute-orders'),
] 