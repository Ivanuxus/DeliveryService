import random
import requests

BASE_URL = "http://localhost:8000/api"

# Случайные данные для генерации
CUSTOMER_NAMES = ["Иван", "Анна", "Олег", "Мария", "Дмитрий", "Екатерина", "Алексей", "Ольга"]
ADDRESSES = [
    "Москва, Тверская 10",
    "Санкт-Петербург, Невский 20",
    "Казань, Пушкина 18",
    "Новосибирск, Ленина 15",
    "Екатеринбург, Мира 12",
    "Сочи, Победы 5"
]
PHONE_NUMBERS = [f"+7900{random.randint(100000, 999999)}" for _ in range(20)]
VEHICLES = ["Велосипед", "Автомобиль", "Самокат", "Грузовик"]
STATUSES = ["Pending", "In Progress", "Delivered"]

# Создание клиентов
def create_customers(count=10):
    for _ in range(count):
        customer_data = {
            "name": random.choice(CUSTOMER_NAMES),
            "email": f"user{random.randint(1, 1000)}@example.com",
            "address": random.choice(ADDRESSES),
            "phone": random.choice(PHONE_NUMBERS),
        }
        response = requests.post(f"{BASE_URL}/customers/", json=customer_data)
        if response.status_code == 201:
            print(f"Создан клиент: {response.json()}")
        else:
            print(f"Ошибка при создании клиента: {response.text}")

# Создание курьеров
def create_couriers(count=5):
    for _ in range(count):
        courier_data = {
            "name": random.choice(CUSTOMER_NAMES),
            "phone": random.choice(PHONE_NUMBERS),
            "vehicle": random.choice(VEHICLES),
        }
        response = requests.post(f"{BASE_URL}/couriers/", json=courier_data)
        if response.status_code == 201:
            print(f"Создан курьер: {response.json()}")
        else:
            print(f"Ошибка при создании курьера: {response.text}")

# Создание заказов
def create_orders(count=20):
    # Получение списка клиентов и курьеров
    customers = requests.get(f"{BASE_URL}/customers/").json()
    couriers = requests.get(f"{BASE_URL}/couriers/").json()

    if not customers or not couriers:
        print("Ошибка: недостаточно клиентов или курьеров для создания заказов.")
        return

    for _ in range(count):
        order_data = {
            "customer": random.choice(customers)["id"],
            "courier": random.choice(couriers)["id"],
            "status": random.choice(STATUSES),
            "address": random.choice(ADDRESSES),
        }
        response = requests.post(f"{BASE_URL}/orders/", json=order_data)
        if response.status_code == 201:
            print(f"Создан заказ: {response.json()}")
        else:
            print(f"Ошибка при создании заказа: {response.text}")

# Запуск скрипта
if __name__ == "__main__":
    print("Создание клиентов...")
    create_customers(10)
    print("Создание курьеров...")
    create_couriers(5)
    print("Создание заказов...")
    create_orders(20)