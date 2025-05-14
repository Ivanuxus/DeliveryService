from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from django.contrib.auth import get_user_model
from orders.models import Customer, Courier, Order
from decimal import Decimal
from django.utils import timezone

User = get_user_model()

class APITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        
        # Create admin user
        self.admin_user = User.objects.create_user(
            username='admin',
            email='admin@example.com',
            password='admin',
            role='admin',
            is_staff=True,
            is_superuser=True
        )
        
        # Create courier user
        self.courier_user = User.objects.create_user(
            username='courier',
            email='sergey@example.com',
            password='courier',
            role='courier'
        )
        
        # Create customer user
        self.customer_user = User.objects.create_user(
            username='customer',
            email='customer@example.com',
            password='customer',
            role='customer'
        )
        
        # Create test data
        self.customer = Customer.objects.create(
            name='Иван Петров',
            email='ivan@example.com',
            phone='+79991234567',
            address='ул. Ленина, 1'
        )
        
        self.courier = Courier.objects.create(
            name='Сергей Волков',
            email='sergey@example.com',
            phone='+79991234570',
            vehicle='Автомобиль',
            current_location_lat=Decimal('55.7558'),
            current_location_lon=Decimal('37.6173')
        )
        
        self.order = Order.objects.create(
            customer=self.customer,
            status='Pending',
            address='ул. Тверская, 1, Москва'
        )

    def test_login(self):
        """Test user login"""
        url = reverse('login')
        data = {
            'email': 'admin@example.com',
            'password': 'admin'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)

    def test_get_customers(self):
        """Test getting customers list"""
        # Login as admin
        self.client.force_authenticate(user=self.admin_user)
        
        url = reverse('customer-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    def test_get_couriers(self):
        """Test getting couriers list"""
        # Login as admin
        self.client.force_authenticate(user=self.admin_user)
        
        url = reverse('courier-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    def test_get_orders(self):
        """Test getting orders list"""
        # Login as admin
        self.client.force_authenticate(user=self.admin_user)
        
        url = reverse('order-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    def test_create_order(self):
        """Test creating new order"""
        # Login as admin
        self.client.force_authenticate(user=self.admin_user)
        
        url = reverse('order-list')
        data = {
            'customer': self.customer.id,
            'address': 'ул. Новый Арбат, 15, Москва'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Order.objects.count(), 2)

    def test_update_order_status(self):
        """Test updating order status"""
        # Create an order first
        order = Order.objects.create(
            customer=self.customer,
            address='Test Address',
            status='Pending',
            courier=self.courier  # Assign order to courier
        )
        
        # Login as courier
        self.client.force_authenticate(user=self.courier_user)
        
        # Update order status
        url = reverse('order-detail', args=[order.id])
        response = self.client.patch(url, {'status': 'In Progress'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'In Progress')

    def test_courier_statistics(self):
        """Test getting courier statistics"""
        # Login as courier
        self.client.force_authenticate(user=self.courier_user)
        
        url = reverse('order-statistics')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('total_orders', response.data)
        self.assertIn('total_earnings', response.data)

    def test_unauthorized_access(self):
        """Test unauthorized access to protected endpoints"""
        # Try to access without authentication
        url = reverse('order-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_customer_access(self):
        """Test customer access to their own orders"""
        # Login as customer
        self.client.force_authenticate(user=self.customer_user)
        
        url = reverse('order-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 0)  # Customer has no orders yet 