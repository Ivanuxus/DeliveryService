from django.test import TestCase
from django.contrib.auth import get_user_model
from orders.models import Customer, Courier, Order
from orders.order_distribution import distribute_orders, calculate_distance
from decimal import Decimal
from django.utils import timezone

User = get_user_model()

class OrderDistributionTests(TestCase):
    def setUp(self):
        # Create test users
        self.admin_user = User.objects.create_user(
            username='admin',
            email='admin@example.com',
            password='admin',
            role='admin'
        )
        
        # Create test customers
        self.customer1 = Customer.objects.create(
            name='Иван Петров',
            email='ivan@example.com',
            phone='+79991234567',
            address='ул. Ленина, 1'
        )
        
        self.customer2 = Customer.objects.create(
            name='Мария Сидорова',
            email='maria@example.com',
            phone='+79991234568',
            address='пр. Мира, 25'
        )
        
        # Create test couriers with different vehicle types
        self.car_courier = Courier.objects.create(
            name='Сергей Волков',
            email='sergey@example.com',
            phone='+79991234570',
            vehicle='Автомобиль',
            current_location_lat=Decimal('55.7558'),
            current_location_lon=Decimal('37.6173')
        )
        
        self.moto_courier = Courier.objects.create(
            name='Елена Кузнецова',
            email='elena@example.com',
            phone='+79991234571',
            vehicle='Мотоцикл',
            current_location_lat=Decimal('55.7517'),
            current_location_lon=Decimal('37.6178')
        )
        
        self.bike_courier = Courier.objects.create(
            name='Дмитрий Соколов',
            email='dmitry@example.com',
            phone='+79991234572',
            vehicle='Велосипед',
            current_location_lat=Decimal('55.7539'),
            current_location_lon=Decimal('37.6208')
        )
        
        # Create test orders
        self.order1 = Order.objects.create(
            customer=self.customer1,
            status='Pending',
            address='ул. Тверская, 1, Москва'
        )
        
        self.order2 = Order.objects.create(
            customer=self.customer2,
            status='Pending',
            address='ул. Арбат, 20, Москва'
        )
        
        self.order3 = Order.objects.create(
            customer=self.customer1,
            status='Pending',
            address='ул. Новый Арбат, 15, Москва'
        )

    def test_calculate_distance(self):
        """Test distance calculation between two points"""
        # Test distance between two points in Moscow
        distance = calculate_distance(
            55.7558, 37.6173,  # Center of Moscow
            55.7517, 37.6178   # South of Moscow
        )
        self.assertGreater(distance, 0)
        self.assertLess(distance, 1)  # Should be less than 1 km

    def test_distribute_orders(self):
        """Test order distribution algorithm"""
        # Run distribution
        result = distribute_orders()
        self.assertEqual(result['message'], "Заказы успешно распределены")
        
        # Check that orders were assigned
        assigned_orders = Order.objects.filter(courier__isnull=False)
        self.assertGreater(assigned_orders.count(), 0)
        
        # Check that no courier has more than 5 orders
        for courier in Courier.objects.all():
            active_orders = Order.objects.filter(
                courier=courier,
                status='In Progress'
            ).count()
            self.assertLessEqual(active_orders, 5)

    def test_courier_capacity(self):
        """Test that courier cannot have more than max_orders orders"""
        MAX_ORDERS = 5  # Maximum number of orders per courier
        
        # Create more orders than max_orders
        for i in range(6):
            Order.objects.create(
                customer=self.customer1,
                address=f'Test Address {i}',
                status='pending'
            )
        
        # Distribute orders
        distribute_orders()
        
        # Check that courier has no more than max_orders
        courier_orders = Order.objects.filter(courier=self.car_courier, status='in_progress')
        self.assertLessEqual(courier_orders.count(), MAX_ORDERS)

    def test_order_status_update(self):
        """Test order status update when assigned"""
        # Run distribution
        distribute_orders()
        
        # Check that assigned orders have 'In Progress' status
        assigned_orders = Order.objects.filter(courier__isnull=False)
        for order in assigned_orders:
            self.assertEqual(order.status, 'In Progress')

    def test_courier_balance_update(self):
        """Test courier balance update when order is delivered"""
        # Assign order to courier
        self.order1.courier = self.car_courier
        self.order1.status = 'Delivered'
        self.order1.save()
        
        # Check that courier's balance was updated
        self.car_courier.refresh_from_db()
        self.assertEqual(self.car_courier.balance, Decimal('10.00')) 