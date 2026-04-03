# 🚌 АстанаТранзит — Система расписания общественного транспорта

> Веб-приложение для просмотра расписания общественного транспорта города Астана (Казахстан).  
> Поддерживает 3 языка: **Русский / Қазақша / English**

![Node.js](https://img.shields.io/badge/Node.js-18+-green) ![React](https://img.shields.io/badge/React-18-blue) ![SQLite](https://img.shields.io/badge/SQLite-3-lightgrey) ![License](https://img.shields.io/badge/license-MIT-blue)

---

## 📋 Описание

**АстанаТранзит** — полноценное full-stack веб-приложение, позволяющее:
- 🔍 Искать маршруты автобусов и троллейбусов по номеру или остановке
- 📅 Просматривать подробное расписание (будние/выходные дни)
- 📍 Видеть все остановки маршрута в виде временно́й шкалы
- 👤 Регистрироваться и входить в систему
- 🛠 Управлять маршрутами и расписанием (панель администратора)
- 🌐 Переключать язык интерфейса (RU / KZ / EN)

---

## 🛠 Стек технологий

| Уровень | Технологии |
|---|---|
| **Frontend** | React 18, React Router v6, Axios, Vite |
| **Backend** | Node.js, Express.js |
| **База данных** | SQLite (better-sqlite3) |
| **Аутентификация** | JWT (jsonwebtoken) + bcrypt |
| **Стили** | Vanilla CSS (тёмная тема, glassmorphism) |
| **Шрифты** | Google Fonts: Space Grotesk + Inter |

---

## 🚀 Установка и запуск

### Требования
- Node.js 18+
- npm 8+

### 1. Клонировать репозиторий
```bash
git clone https://github.com/your-username/city-transit.git
cd city-transit
```

### 2. Установить зависимости сервера
```bash
cd server
npm install
```

### 3. Установить зависимости клиента
```bash
cd ../client
npm install
```

### 4. Запустить backend (в папке server/)
```bash
cd server
npm run dev
# Сервер запустится на http://localhost:5000
```

### 5. Запустить frontend (в папке client/)
```bash
cd client
npm run dev
# Приложение откроется на http://localhost:5173
```

> 💡 База данных SQLite создаётся автоматически при первом запуске в файле `server/database/transit.db`  
> Тестовые данные (8 маршрутов Астаны) загружаются автоматически.

---

## 🔐 Тестовые данные для входа

| Роль | Email | Пароль |
|---|---|---|
| **Администратор** | admin@astana-transit.kz | admin123 |

---

## 📁 Структура проекта

```
city-transit/
├── client/                    # React фронтенд (Vite)
│   ├── src/
│   │   ├── components/        # Переиспользуемые компоненты
│   │   │   ├── Navbar/        # Навигационная панель
│   │   │   ├── RouteCard/     # Карточка маршрута
│   │   │   ├── ScheduleTable/ # Таблица расписания
│   │   │   ├── Loader/        # Индикатор загрузки
│   │   │   ├── Toast/         # Уведомления
│   │   │   └── ProtectedRoute/# Защита маршрутов
│   │   ├── pages/
│   │   │   ├── Home/          # Главная страница
│   │   │   ├── Routes/        # Список маршрутов
│   │   │   ├── RouteDetail/   # Детали маршрута + расписание
│   │   │   ├── Search/        # Поиск
│   │   │   ├── Login/         # Вход
│   │   │   ├── Register/      # Регистрация
│   │   │   ├── Admin/         # Панель администратора
│   │   │   └── NotFound/      # 404 страница
│   │   ├── context/           # React Context (Auth, Language, Toast)
│   │   ├── services/          # API-сервис (Axios)
│   │   ├── i18n/              # Переводы (RU/KZ/EN)
│   │   └── App.jsx
│   └── package.json
│
├── server/                    # Node.js бэкенд
│   ├── controllers/           # Логика обработки запросов
│   ├── routes/                # API маршруты
│   ├── middleware/            # JWT аутентификация
│   ├── database/              # SQLite подключение + seed данные
│   └── server.js
│
├── docs/
│   └── api.md                 # Документация REST API
└── README.md
```

---

## 🌐 API Endpoints

Полная документация: [docs/api.md](docs/api.md)

| Метод | Endpoint | Описание | Авторизация |
|---|---|---|---|
| POST | `/api/auth/register` | Регистрация пользователя | — |
| POST | `/api/auth/login` | Вход в систему | — |
| GET | `/api/auth/me` | Профиль текущего пользователя | JWT |
| GET | `/api/routes` | Список всех маршрутов | — |
| GET | `/api/routes/:id` | Маршрут с остановками | — |
| POST | `/api/routes` | Создать маршрут | Admin |
| PUT | `/api/routes/:id` | Обновить маршрут | Admin |
| DELETE | `/api/routes/:id` | Удалить маршрут | Admin |
| GET | `/api/schedules/:routeId` | Расписание маршрута | — |
| POST | `/api/schedules` | Добавить рейс | Admin |
| DELETE | `/api/schedules/:id` | Удалить рейс | Admin |
| GET | `/api/search?q=` | Поиск маршрутов и остановок | — |

---

## 🚢 Деплой

### Frontend → Vercel
1. Загрузить проект на GitHub
2. Зайти на [vercel.com](https://vercel.com) → New Project → Import
3. Root directory: `client`
4. Build Command: `npm run build`
5. Output Directory: `dist`

### Backend → Render
1. Зайти на [render.com](https://render.com) → New → Web Service
2. Root directory: `server`
3. Build Command: `npm install`
4. Start Command: `npm start`
5. Добавить переменные окружения: `JWT_SECRET`, `NODE_ENV=production`, `CLIENT_URL`

---

## 🧪 Тестирование

- **Кроссбраузерность**: Chrome, Firefox, Edge, Safari
- **Адаптивность**: Mobile (320px+), Tablet, Desktop, 4K
- **API тестирование**: Postman (коллекция в `docs/api.md`)

---

## 👨‍💻 Автор

Разработано в рамках курсовой работы по дисциплине "Веб-разработка".  
**Тема:** Создание системы расписания общественного транспорта для жителей города  
**Город:** Астана, Казахстан

---

*© 2024 АстанаТранзит. Все права защищены.*
