import os
import django
from django.contrib.auth.hashers import make_password
from django.core.management import call_command
from django.utils.timezone import now

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'delivery_service.settings')
django.setup()

from orders.models import User, Customer, Courier, Order

def setup_database():
    print("Flushing database...")
    call_command('flush', '--no-input')
    print("Creating example data...")

    # --- Admin ---
    admin = User.objects.create(
        username='admin',
        email='admin@example.com',
        password=make_password('admin'),
        role='admin',
        is_staff=True,
        is_superuser=True,
        is_active=True
    )
    print(f"Created admin user: {admin.email}")

    # --- Customers ---
    customers_data = [
        {
            'username': 'ivan',
            'name': 'Иван Петров',
            'email': 'ivan@example.com',
            'password': 'customer',
            'phone': '+79991234567',
            'address': 'ул. Ленина, 1'
        },
        {
            'username': 'maria',
            'name': 'Мария Сидорова',
            'email': 'maria@example.com',
            'password': 'customer',
            'phone': '+79991234568',
            'address': 'пр. Мира, 25'
        },
        {
            'username': 'alex',
            'name': 'Алексей Иванов',
            'email': 'alex@example.com',
            'password': 'customer',
            'phone': '+79991234569',
            'address': 'ул. Гагарина, 15'
        }
    ]
    customers = []
    for data in customers_data:
        user = User.objects.create(
            username=data['username'],
            email=data['email'],
            password=make_password(data['password']),
            role='customer',
            is_active=True
        )
        customer = Customer.objects.create(
            name=data['name'],
            email=data['email'],
            phone=data['phone'],
            address=data['address']
        )
        customers.append(customer)
        print(f"Created customer: {customer.name}")

    # --- Couriers ---
    couriers_data = [
        {
            'username': 'sergey',
            'name': 'Сергей Волков',
            'email': 'sergey@example.com',
            'password': 'courier',
            'phone': '+79991234570',
            'vehicle': 'Автомобиль',
            'current_location_lat': 55.7558,
            'current_location_lon': 37.6173
        },
        {
            'username': 'elena',
            'name': 'Елена Кузнецова',
            'email': 'elena@example.com',
            'password': 'courier',
            'phone': '+79991234571',
            'vehicle': 'Мотоцикл',
            'current_location_lat': 55.7517,
            'current_location_lon': 37.6178
        },
        {
            'username': 'dmitry',
            'name': 'Дмитрий Соколов',
            'email': 'dmitry@example.com',
            'password': 'courier',
            'phone': '+79991234572',
            'vehicle': 'Велосипед',
            'current_location_lat': 55.7539,
            'current_location_lon': 37.6208
        }
    ]
    couriers = []
    for data in couriers_data:
        user = User.objects.create(
            username=data['username'],
            email=data['email'],
            password=make_password(data['password']),
            role='courier',
            is_active=True
        )
        courier = Courier.objects.create(
            name=data['name'],
            email=data['email'],
            phone=data['phone'],
            vehicle=data['vehicle'],
            balance='0.00',
            current_location_lat=data['current_location_lat'],
            current_location_lon=data['current_location_lon']
        )
        couriers.append(courier)
        print(f"Created courier: {courier.name}")

    # --- Orders ---
    orders_data = [
        {
            'customer': customers[0],
            'courier': couriers[0],
            'status': 'Delivered',
            'address': 'ул. Тверская, 1, Москва',
            'description': 'Документы для офиса',
            'created_at': now(),
            'delivery_date': now()
        },
        {
            'customer': customers[1],
            'courier': couriers[1],
            'status': 'In Progress',
            'address': 'ул. Арбат, 20, Москва',
            'description': 'Подарок для друга',
            'created_at': now()
        },
        {
            'customer': customers[2],
            'status': 'Pending',
            'address': 'ул. Новый Арбат, 15, Москва',
            'description': 'Книги',
            'created_at': now()
        },
        {
            'customer': customers[0],
            'status': 'Pending',
            'address': 'ул. Малая Бронная, 5, Москва',
            'description': 'Одежда',
            'created_at': now()
        },
        {
            'customer': customers[1],
            'status': 'Pending',
            'address': 'ул. Большая Никитская, 10, Москва',
            'description': 'Электроника',
            'created_at': now()
        },
        {
            'customer': customers[2],
            'status': 'Pending',
            'address': 'ул. Поварская, 25, Москва',
            'description': 'Продукты',
            'created_at': now()
        }
    ]
    for data in orders_data:
        order = Order.objects.create(**data)
        print(f"Created order: {order}")

    print("\nDatabase setup complete!")
    print("\nLogin credentials:")
    print("Admin:")
    print("Email: admin@example.com")
    print("Password: admin")
    print("\nCustomers:")
    print("Email: [ivan|maria|alex]@example.com")
    print("Password: customer")
    print("\nCouriers:")
    print("Email: [sergey|elena|dmitry]@example.com")
    print("Password: courier")

if __name__ == '__main__':
    setup_database() 