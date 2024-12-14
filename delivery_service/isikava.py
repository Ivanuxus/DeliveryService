import matplotlib.pyplot as plt

# Настройки категорий и причин
categories = {
    "Люди": ["Недостаточная квалификация курьеров", "Перегруженность курьеров заказами"],
    "Методы": ["Неоптимальные маршруты", "Ошибки при распределении заказов"],
    "Материалы": ["Неверные адреса доставки"],
    "Оборудование": ["Технические неисправности", "Отсутствие GPS-оборудования"],
    "Окружающая среда": ["Пробки", "Плохие погодные условия"],
    "Управление": ["Невовремя обновленные данные о заказах"]
}

# Центральная проблема
problem = "Задержки в доставке заказов"

# Создание фигуры и оси
fig, ax = plt.subplots(figsize=(22, 12))
ax.set_xlim(0, 1)
ax.set_ylim(0, 1)

# Рисуем позвоночник
ax.plot([0.1, 0.8], [0.5, 0.5], color="black", linewidth=3)

# Добавляем текст центральной проблемы
ax.text(0.85, 0.5, problem, fontsize=14, ha="center", va="center", bbox=dict(boxstyle="round,pad=0.3", fc="wheat", ec="black"))

# Распределяем категории сверху и снизу
y_offsets = [0.8, 0.2]  # Верхние и нижние позиции
x_start = 0.2  # Начало категорий на позвоночнике
x_step = 0.1  # Шаг между категориями

# Рисуем категории и причины
for i, (category, causes) in enumerate(categories.items()):
    # Вычисляем положение для категории
    x = x_start + i * x_step
    y = y_offsets[i % 2]  # Чередуем между верхней и нижней частью

    # Рисуем линию от позвоночника к категории
    ax.plot([x, x], [0.5, y], color="black", linewidth=2)

    # Добавляем название категории
    ax.text(x, y + 0.03 if y > 0.5 else y - 0.03, category, fontsize=12, ha="center", va="center", bbox=dict(boxstyle="round,pad=0.3", fc="lightblue", ec="black"))

    # Рисуем причины с учётом накладывания справа
    for j, cause in enumerate(causes):
        cause_y = y + 0.1 * (j + 1) if y > 0.5 else y - 0.1 * (j + 1)  # Увеличенный интервал
        offset_x = 0.08 if j % 2 == 0 else 0.1  # Динамическое смещение
        ax.plot([x, x + offset_x], [y, cause_y], color="black", linewidth=1)
        ax.text(x + offset_x + 0.02, cause_y, cause, fontsize=10, ha="left", va="center")

# Отключаем оси
ax.axis("off")

# Заголовок
plt.title("Диаграмма Исикавы: Задержки в доставке заказов", fontsize=16)

# Показать диаграмму
plt.show()