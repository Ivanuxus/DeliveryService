import pytest
from django.urls import reverse
from rest_framework.test import APIClient
from orders.models import User, Customer, Courier, Order
from rest_framework_simplejwt.tokens import RefreshToken


@pytest.mark.django_db
def test_user_registration():
    client = APIClient()
    url = reverse('register')
    data = {
        "username": "testuser",
        "email": "test@example.com",
        "password": "testpass123",
        "role": "customer",
        "phone": "1234567890",
        "address": "Some street 123"
    }
    response = client.post(url, data, format='json')
    assert response.status_code == 201
    assert response.data["message"] == "Регистрация прошла успешно."
    assert User.objects.filter(username="testuser").exists()
    assert Customer.objects.filter(email="test@example.com").exists()


@pytest.mark.django_db
def test_user_login():
    user = User.objects.create_user(username="testuser2", email="test2@example.com", password="testpass123", role="customer")
    client = APIClient()
    url = reverse('login')
    data = {"username": "testuser2", "password": "testpass123"}
    response = client.post(url, data, format='json')
    assert response.status_code == 200
    assert "access" in response.data
    assert "refresh" in response.data


@pytest.mark.django_db
def test_customer_list():
    admin_user = User.objects.create_user(username="admin", email="admin@example.com", password="adminpass", role="admin")
    Customer.objects.create(name="Customer1", email="c1@example.com")
    Customer.objects.create(name="Customer2", email="c2@example.com")
    
    refresh = RefreshToken.for_user(admin_user)
    client = APIClient()
    client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
    
    url = reverse('customer-list')
    response = client.get(url, format='json')
    assert response.status_code == 200
    assert len(response.data) == 2


@pytest.mark.django_db
def test_order_creation():
    admin_user = User.objects.create_user(username="admin", email="admin@example.com", password="adminpass", role="admin")
    customer = Customer.objects.create(name="Test Customer", email="tc@example.com")
    courier = Courier.objects.create(name="Test Courier", phone="1234567890", vehicle="Car", email="courier@example.com")
    
    refresh = RefreshToken.for_user(admin_user)
    client = APIClient()
    client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
    
    url = reverse('order-list')
    data = {
        "status": "Pending",
        "address": "Delivery Street 45",
        "customer": customer.id,
        "courier": courier.id
    }
    response = client.post(url, data, format='json')
    assert response.status_code == 201
    assert Order.objects.count() == 1


@pytest.mark.django_db
def test_order_filter_by_status():
    admin_user = User.objects.create_user(username="admin", email="admin@example.com", password="adminpass", role="admin")
    customer = Customer.objects.create(name="Customer A", email="a@example.com")
    courier = Courier.objects.create(name="Courier A", phone="123", vehicle="Bike", email="a@courier.com")
    
    Order.objects.create(customer=customer, courier=courier, status="Pending", address="Addr1")
    Order.objects.create(customer=customer, courier=courier, status="In Progress", address="Addr2")
    
    refresh = RefreshToken.for_user(admin_user)
    client = APIClient()
    client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
    
    url = reverse('order-list') + "?status=Pending"
    response = client.get(url, format='json')
    assert response.status_code == 200
    assert len(response.data) == 1
    assert response.data[0]["status"] == "Pending"


@pytest.mark.django_db
def test_courier_detail_view():
    admin_user = User.objects.create_user(username="admin", email="admin@example.com", password="adminpass", role="admin")
    courier = Courier.objects.create(name="Detail Courier", phone="12345", vehicle="Car", email="detail@courier.com")
    
    refresh = RefreshToken.for_user(admin_user)
    client = APIClient()
    client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
    
    url = reverse('courier-detail', args=[courier.id])
    response = client.get(url, format='json')
    assert response.status_code == 200
    assert response.data["name"] == "Detail Courier"


@pytest.mark.django_db
def test_update_order_status():
    courier_user = User.objects.create_user(username="courier", email="courier@example.com", password="courierpass", role="courier")
    customer = Customer.objects.create(name="Customer A", email="customer@example.com")
    courier = Courier.objects.create(name="Courier A", phone="123", vehicle="Bike", email="courier@example.com")
    order = Order.objects.create(customer=customer, courier=courier, status="Pending", address="Addr1")
    
    refresh = RefreshToken.for_user(courier_user)
    client = APIClient()
    client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
    
    url = reverse('order-detail', args=[order.id])
    data = {"status": "Delivered"}
    response = client.patch(url, data, format='json')
    assert response.status_code == 200
    order.refresh_from_db()
    assert order.status == "Delivered"


@pytest.mark.django_db
def test_delete_customer():
    admin_user = User.objects.create_user(username="admin", email="admin@example.com", password="adminpass", role="admin")
    customer = Customer.objects.create(name="Customer Delete", email="delete@example.com")
    
    refresh = RefreshToken.for_user(admin_user)
    client = APIClient()
    client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
    
    url = reverse('customer-detail', args=[customer.id])
    response = client.delete(url)
    assert response.status_code == 204
    assert not Customer.objects.filter(id=customer.id).exists()