# 📡 АстанаТранзит — Документация REST API

Base URL (development): `http://localhost:5000/api`  
Base URL (production): `https://your-app.onrender.com/api`

---

## 🔐 Аутентификация

Все защищённые endpoints требуют заголовок:
```
Authorization: Bearer <JWT_TOKEN>
```

---

## 👤 Auth

### POST /auth/register
Регистрация нового пользователя.

**Request Body:**
```json
{
  "name": "Иван Петров",
  "email": "ivan@example.com",
  "password": "mypassword123"
}
```

**Response 201:**
```json
{
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 2,
    "name": "Иван Петров",
    "email": "ivan@example.com",
    "role": "user"
  }
}
```

**Ошибки:**
- `400` — Поле не заполнено / неверный формат email / пароль < 6 символов
- `409` — Пользователь с таким email уже существует

---

### POST /auth/login
Вход в систему.

**Request Body:**
```json
{
  "email": "admin@astana-transit.kz",
  "password": "admin123"
}
```

**Response 200:**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "name": "Administrator",
    "email": "admin@astana-transit.kz",
    "role": "admin"
  }
}
```

**Ошибки:**
- `401` — Пользователь не найден / неверный пароль

---

### GET /auth/me 🔒
Получить профиль текущего пользователя.

**Response 200:**
```json
{
  "id": 1,
  "name": "Administrator",
  "email": "admin@astana-transit.kz",
  "role": "admin",
  "created_at": "2024-01-01 00:00:00"
}
```

---

## 🚌 Routes (Маршруты)

### GET /routes
Получить список всех активных маршрутов.

**Response 200:**
```json
[
  {
    "id": 1,
    "number": "10",
    "type": "bus",
    "name_ru": "Маршрут №10",
    "name_kz": "№10 бағыты",
    "name_en": "Route №10",
    "from_stop_ru": "ЖД Вокзал",
    "from_stop_kz": "Теміржол вокзалы",
    "from_stop_en": "Railway Station",
    "to_stop_ru": "ЖК Нурсая",
    "to_stop_kz": "Нурсая тұрғын үй кешені",
    "to_stop_en": "Nursaya Residential Complex",
    "interval_min": 12,
    "is_active": 1,
    "color": "#3b82f6"
  }
]
```

---

### GET /routes/:id
Получить маршрут со списком остановок.

**Response 200:**
```json
{
  "id": 1,
  "number": "10",
  "type": "bus",
  "name_ru": "Маршрут №10",
  "interval_min": 12,
  "color": "#3b82f6",
  "stops": [
    { "id": 1, "name_ru": "ЖД Вокзал", "name_kz": "Теміржол вокзалы", "name_en": "Railway Station", "order_num": 1 },
    { "id": 2, "name_ru": "Площадь Республики", "name_kz": "Республика алаңы", "name_en": "Republic Square", "order_num": 2 }
  ]
}
```

**Ошибки:**
- `404` — Маршрут не найден

---

### POST /routes 🔒 (Admin)
Создать новый маршрут.

**Request Body:**
```json
{
  "number": "99",
  "type": "bus",
  "name_ru": "Маршрут №99",
  "name_kz": "№99 бағыты",
  "name_en": "Route №99",
  "from_stop_ru": "Байтерек",
  "from_stop_kz": "Бәйтерек",
  "from_stop_en": "Baiterek",
  "to_stop_ru": "Аэропорт",
  "to_stop_kz": "Әуежай",
  "to_stop_en": "Airport",
  "interval_min": 20,
  "color": "#10b981"
}
```

**Response 201:**
```json
{
  "message": "Route created successfully",
  "route": { "id": 9, "number": "99", ... }
}
```

**Ошибки:**
- `400` — Не заполнены обязательные поля
- `409` — Маршрут с таким номером уже существует

---

### PUT /routes/:id 🔒 (Admin)
Обновить маршрут (любые поля).

**Request Body:** (любые поля для обновления)
```json
{
  "interval_min": 25,
  "is_active": 0
}
```

**Response 200:**
```json
{
  "message": "Route updated successfully",
  "route": { "id": 1, "interval_min": 25, ... }
}
```

---

### DELETE /routes/:id 🔒 (Admin)
Удалить маршрут (каскадно удаляет расписание и остановки).

**Response 200:**
```json
{
  "message": "Route №10 deleted successfully"
}
```

---

## 🗓 Schedules (Расписание)

### GET /schedules/:routeId?days=weekday
Получить расписание маршрута.

**Query Parameters:**
- `days` — `weekday` (будние, default) или `weekend` (выходные)

**Response 200:**
```json
[
  { "id": 1, "departure": "06:00", "direction": "forward", "days": "weekday" },
  { "id": 2, "departure": "06:20", "direction": "forward", "days": "weekday" }
]
```

---

### POST /schedules 🔒 (Admin)
Добавить время отправления.

**Request Body:**
```json
{
  "route_id": 1,
  "departure": "23:45",
  "direction": "forward",
  "days": "weekday"
}
```

**Response 201:**
```json
{
  "message": "Schedule added successfully",
  "schedule": { "id": 100, "route_id": 1, "departure": "23:45", ... }
}
```

**Ошибки:**
- `400` — Неверный формат времени (должен быть HH:MM)
- `409` — Такое время уже существует

---

### DELETE /schedules/:id 🔒 (Admin)
Удалить время отправления.

**Response 200:**
```json
{
  "message": "Schedule deleted successfully"
}
```

---

## 🔍 Search (Поиск)

### GET /search?q=query
Поиск по маршрутам и остановкам (трёхъязычный).

**Query Parameters:**
- `q` — поисковый запрос (мин. 1 символ)

**Response 200:**
```json
{
  "routes": [
    {
      "id": 1,
      "number": "10",
      "type": "bus",
      "name_ru": "Маршрут №10",
      "color": "#3b82f6"
    }
  ],
  "stops": [
    {
      "id": 3,
      "name_ru": "Байтерек",
      "name_kz": "Бәйтерек",
      "name_en": "Baiterek",
      "route_id": 2,
      "route_number": "12",
      "route_type": "bus",
      "color": "#06b6d4"
    }
  ],
  "total": 2
}
```

**Ошибки:**
- `400` — Пустой запрос

---

## 📬 Тестирование в Postman

1. Импортируйте коллекцию или создайте запросы вручную
2. Для защищённых endpoints: вкладка **Authorization** → Type: `Bearer Token` → вставьте токен из `/auth/login`
3. Base URL: `http://localhost:5000/api`

### Порядок тестирования:
1. `POST /auth/register` → получить токен
2. `POST /auth/login` → проверить вход
3. `GET /routes` → список маршрутов
4. `GET /routes/1` → детали с остановками
5. `GET /schedules/1?days=weekday` → расписание
6. `GET /search?q=байтерек` → поиск
7. `POST /routes` (с Admin токеном) → создать маршрут
8. `DELETE /routes/:id` (с Admin токеном) → удалить
