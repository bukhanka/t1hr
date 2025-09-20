# SciBox Talent Management System

Корпоративная система управления талантами и карьерным развитием с ИИ-консультантом.

## Архитектура и Технологии

- **Фронтенд/Бэкенд**: Next.js 14 с App Router
- **База данных**: PostgreSQL с Prisma ORM
- **Аутентификация**: NextAuth.js
- **UI Компоненты**: Shadcn/UI + Tailwind CSS
- **ИИ-интеграция**: OpenAI-совместимый API (SciBox)
- **Типизация**: TypeScript

## Структура Проекта

```
src/
├── app/
│   ├── api/                    # API роуты
│   │   └── auth/              # NextAuth конфигурация
│   ├── auth/                  # Страницы аутентификации
│   └── dashboard/             # Основные страницы приложения
│       ├── employee/          # Интерфейс сотрудника
│       ├── manager/           # Интерфейс менеджера
│       └── hr/                # Интерфейс HR-специалиста
├── components/
│   ├── ui/                    # UI компоненты Shadcn
│   └── navigation.tsx         # Навигация
├── lib/                       # Утилиты и конфигурация
├── providers/                 # React провайдеры
└── types/                     # TypeScript типы
```

## Роли и Интерфейсы

### 🧑‍💼 Сотрудник (Employee)
- **Мой Карьерный Путь**: Персональный дашборд с ИИ-консультантом
- **Мастерская Карьеры**: Управление профилем, навыками и проектами
- Геймификация с XP, уровнями и бейджами

### 👨‍💼 Менеджер (Manager)
- **Центр Поиска Талантов**: Умный поиск кандидатов
- Семантический поиск с векторными эмбеддингами
- Создание и управление шорт-листами

### 👩‍💼 HR-специалист (HR)
- **HR-Аналитика**: Стратегическая панель
- Анализ компетенций и кадровых разрывов
- Аналитика вовлеченности и карьерных ожиданий

## Модель Данных

Система использует следующие основные сущности:

- **User/Profile**: Пользователи и их профили
- **Skill/UserSkill**: Навыки и их привязка к пользователям
- **Project/UserProject**: Проекты и участие в них
- **Badge/UserBadge**: Система достижений
- **CareerGoal**: Карьерные цели
- **ChatSession/ChatMessage**: ИИ-чат
- **ShortList**: Шорт-листы менеджеров

## Настройка Окружения

### 🐳 Быстрый старт с Docker (рекомендуется)

#### 🐧 Linux / macOS
```bash
cd web
cp env.example .env.local
# Отредактируйте .env.local и добавьте ваш SCIBOX_API_KEY

make setup   # Автоматическая настройка
make dev-up  # Запуск в режиме разработки
```

#### 🪟 Windows (PowerShell)
```powershell
cd web
Copy-Item env.example .env.local
# Отредактируйте .env.local и добавьте ваш SCIBOX_API_KEY

.\scripts.ps1 setup   # Автоматическая настройка
.\scripts.ps1 dev-up  # Запуск в режиме разработки
```

#### 🪟 Windows (CMD)
```cmd
cd web
copy env.example .env.local
REM Отредактируйте .env.local и добавьте ваш SCIBOX_API_KEY

scripts.bat setup   REM Автоматическая настройка
scripts.bat dev-up  REM Запуск в режиме разработки
```

**Приложение доступно:** http://localhost:3000

> **💡 Автоматическое определение:** Makefile автоматически определит вашу ОС и версию Docker Compose (`docker compose` vs `docker-compose`)

### 📱 Ручная установка (без Docker)

1. **Установка зависимостей**:
```bash
npm install
```

2. **Настройка переменных окружения**:
Создайте файл `.env.local` на основе `env.example`:

```env
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/scibox_talent_db?schema=public"

# NextAuth
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"

# SciBox API (реальные эндпоинты)
SCIBOX_API_KEY="your-scibox-api-key-here"
SCIBOX_API_BASE_URL="https://llm.t1v.scibox.tech/v1"
```

3. **Настройка PostgreSQL с pgvector**:
```bash
# Только база данных через Docker
make db-up

# Или установите PostgreSQL локально с расширением pgvector
```

4. **Миграции базы данных**:
```bash
npx prisma migrate dev --name init
npx prisma generate
```

5. **Запуск разработческого сервера**:
```bash
npm run dev
```

## 🐳 Docker Контейнеризация

Проект полностью контейнеризован для простого развертывания:

### Доступные команды (Makefile)

```bash
# Разработка
make dev-up      # Запустить dev среду
make dev-down    # Остановить dev среду

# База данных
make db-up       # Только PostgreSQL + Redis
make db-down     # Остановить БД

# Продакшн
make prod-build  # Собрать production образ
make prod-up     # Запустить в продакшн

# Утилиты
make logs        # Логи приложения
make db-migrate  # Запустить миграции
make clean       # Очистить контейнеры
```

### Компоненты

- **PostgreSQL + pgvector**: Основная БД с векторным поиском
- **Redis**: Кеширование (для будущих оптимизаций)
- **Next.js App**: Основное приложение

## ИИ-функциональность

### SciBox API Integration
- **Базовый URL**: `https://llm.t1v.scibox.tech/v1`
- **Альтернативный URL**: `http://176.119.5.23:4000/v1`
- **Модель чата**: `Qwen2.5-72B-Instruct-AWQ`
- **Модель эмбеддингов**: `bge-m3`

### Навигатор (ИИ-консультант)
- Персональные советы по карьерному развитию
- Контекстные рекомендации на основе профиля
- Потоковые ответы для лучшего UX

### Семантический Поиск
- Векторные эмбеддинги через модель bge-m3
- Поиск кандидатов на естественном языке
- Расчет Match Score для релевантности
- PostgreSQL + pgvector для хранения векторов

## Демо-аккаунты

Для тестирования доступны следующие аккаунты:

- **Сотрудник**: employee@company.com
- **Менеджер**: manager@company.com  
- **HR**: hr@company.com

*Пароль: любой (в демо-режиме)*

## Геймификация

Система включает элементы геймификации:

- **XP (опыт)**: За активности (заполнение профиля, описание проектов)
- **Уровни**: Junior → Middle → Senior на основе накопленного XP
- **Бейджи**: Достижения за различные активности
- **Сила профиля**: Показатель качества заполнения профиля (0-100%)

## API Эндпоинты

### Аутентификация
- `GET/POST /api/auth/*` - NextAuth роуты

### ИИ-функции
- `POST /api/ai/chat` - Чат с ИИ-консультантом
- `POST /api/ai/embeddings` - Генерация эмбеддингов

### Профили
- `GET /api/profiles` - Список профилей (с фильтрацией)
- `GET /api/profiles/[id]` - Конкретный профиль
- `PUT /api/profiles/[id]` - Обновление профиля

### Поиск
- `POST /api/search` - Семантический поиск талантов

## Разработка

### Добавление новых UI компонентов

```bash
npx shadcn@latest add [component-name]
```

### Работа с базой данных

```bash
# Применить изменения схемы
npx prisma db push

# Открыть Prisma Studio
npx prisma studio

# Сбросить базу данных
npx prisma migrate reset
```

### Линтинг и форматирование

```bash
npm run lint
npm run type-check
```

## Следующие шаги

1. Настроить PostgreSQL с расширением pgvector для эмбеддингов
2. Реализовать API роуты для работы с данными
3. Добавить реальную интеграцию с SciBox API
4. Создать систему seed'ов для тестовых данных
5. Настроить системы уведомлений и email'ов
6. Добавить интеграции с Jira, HR-системами и т.д.

## Лицензия

Проект разрабатывается для внутреннего использования в рамках корпоративной экосистемы SciBox.