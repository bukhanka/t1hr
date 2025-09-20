# Docker Setup для SciBox Talent Management System

## 🚀 Быстрый запуск

### 🐧 Linux / macOS (с Make)

1. **Настройте переменные окружения:**
```bash
cp env.example .env.local
# Отредактируйте SCIBOX_API_KEY в .env.local
```

2. **Запустите полную среду разработки:**
```bash
make setup  # Первый запуск - установит зависимости и настроит БД
make dev-up # Последующие запуски
```

### 🪟 Windows (CMD)

1. **Настройте переменные окружения:**
```cmd
copy env.example .env.local
REM Отредактируйте SCIBOX_API_KEY в .env.local
```

2. **Запустите полную среду разработки:**
```cmd
scripts.bat setup   REM Первый запуск
scripts.bat dev-up  REM Последующие запуски
```

### 🪟 Windows (PowerShell)

1. **Настройте переменные окружения:**
```powershell
Copy-Item env.example .env.local
# Отредактируйте SCIBOX_API_KEY в .env.local
```

2. **Запустите полную среду разработки:**
```powershell
.\scripts.ps1 setup   # Первый запуск
.\scripts.ps1 dev-up  # Последующие запуски
```

### 🌐 Универсальный способ (Docker Compose напрямую)

Если Make/скрипты недоступны:
```bash
# 1. Настройка переменных (см. выше)
# 2. Установка зависимостей
npm install

# 3. Запуск БД
docker compose up -d postgres redis  # или docker-compose

# 4. Миграции
npx prisma migrate dev --name init
npx prisma generate

# 5. Запуск приложения
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d
```

**Доступ к приложению:** http://localhost:3000

### Для продакшн развертывания

1. **Соберите production образ:**
```bash
make prod-build
```

2. **Запустите production среду:**
```bash
make prod-up
```

## 📋 Доступные команды

### 🐧 Linux/macOS (Make)
| Команда | Описание |
|---------|----------|
| `make setup` | Первоначальная настройка для новых разработчиков |
| `make dev-up` | Запуск среды разработки |
| `make dev-down` | Остановка среды разработки |
| `make db-up` | Запуск только базы данных |
| `make db-down` | Остановка базы данных |
| `make logs` | Просмотр логов приложения |
| `make clean` | Очистка контейнеров и томов |

### 🪟 Windows (CMD)
| Команда | Описание |
|---------|----------|
| `scripts.bat setup` | Первоначальная настройка для новых разработчиков |
| `scripts.bat dev-up` | Запуск среды разработки |
| `scripts.bat dev-down` | Остановка среды разработки |
| `scripts.bat db-up` | Запуск только базы данных |
| `scripts.bat db-down` | Остановка базы данных |
| `scripts.bat logs` | Просмотр логов приложения |
| `scripts.bat clean` | Очистка контейнеров и томов |

### 🪟 Windows (PowerShell)
| Команда | Описание |
|---------|----------|
| `.\scripts.ps1 setup` | Первоначальная настройка для новых разработчиков |
| `.\scripts.ps1 dev-up` | Запуск среды разработки |
| `.\scripts.ps1 dev-down` | Остановка среды разработки |
| `.\scripts.ps1 db-up` | Запуск только базы данных |
| `.\scripts.ps1 db-down` | Остановка базы данных |
| `.\scripts.ps1 logs` | Просмотр логов приложения |
| `.\scripts.ps1 clean` | Очистка контейнеров и томов |

### 🔍 Проверка совместимости
Запустите `make help` (или `make` без параметров) чтобы увидеть:
- Определенную ОС
- Версию Docker Compose (`docker compose` vs `docker-compose`)
- Список доступных команд

## 🐳 Структура контейнеров

### Development (docker-compose.dev.yml)
- **app** - Next.js приложение в dev режиме с hot reload
- **postgres** - PostgreSQL 16 с расширением pgvector
- **redis** - Redis для кеширования

### Production (docker-compose.yml)
- **postgres** - PostgreSQL с pgvector
- **redis** - Redis
- **app** (при использовании prod-up) - Next.js в production режиме

## 🔧 Конфигурация

### PostgreSQL
- **Внешний порт:** 5433 (чтобы не конфликтовать с локальным PostgreSQL)
- **Внутренний порт:** 5432
- **База:** scibox_talent_db
- **Пользователь:** postgres
- **Пароль:** password
- **Расширения:** pgvector для векторного поиска

### Redis
- **Порт:** 6379
- **Использование:** Кеширование, сессии (в будущем)

### Next.js App
- **Порт:** 3000
- **Режимы:** development (hot reload) / production (optimized)

## 📝 Переменные окружения

Создайте `.env.local` на основе `env.example`:

```env
# Database (автоматически настраивается для Docker)
DATABASE_URL="postgresql://postgres:password@postgres:5432/scibox_talent_db?schema=public"

# SciBox API (обязательно указать реальный ключ)
SCIBOX_API_KEY="your-real-api-key-here"
SCIBOX_API_BASE_URL="https://llm.t1v.scibox.tech/v1"

# NextAuth
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"
```

## 🔍 Отладка

### Логи
```bash
make logs        # Логи приложения
make logs-db     # Логи базы данных
```

### Доступ к контейнерам
```bash
docker exec -it scibox-talent-app sh     # Next.js контейнер
docker exec -it scibox-talent-db psql -U postgres scibox_talent_db  # PostgreSQL
```

### Проверка здоровья
```bash
docker compose ps  # Статус всех сервисов (или docker-compose ps)
```

### Решение распространенных проблем

#### ❌ "Port already in use" (Порт занят)
Если у вас установлен локальный PostgreSQL на порту 5432:
- Docker использует порт **5433** для избежания конфликтов
- Внутри контейнера всё работает на стандартном 5432
- Убедитесь, что `.env.local` содержит правильный порт: `localhost:5433`

#### ❌ "docker-compose command not found"
Обновленный Makefile автоматически определяет команду:
- Современный Docker: `docker compose`
- Старый Docker Compose: `docker-compose`
- Проверьте: `make help` покажет используемую команду

#### ❌ Проблемы с правами доступа (Linux/macOS)
```bash
sudo chown -R $USER:$USER .
```

## 🛠️ Файлы конфигурации

- `Dockerfile` - Production образ Next.js
- `Dockerfile.dev` - Development образ Next.js
- `docker-compose.yml` - Основные сервисы (БД + Redis)
- `docker-compose.dev.yml` - Дополнения для разработки
- `scripts/init-db.sql` - Инициализация PostgreSQL с pgvector
- `.dockerignore` - Исключения для сборки образов
- `Makefile` - Удобные команды для управления

## 📊 Мониторинг

Встроенные health checks:
- PostgreSQL: проверка готовности базы данных
- Автоматические перезапуски при сбоях
- Логирование всех компонентов

## 🔄 Workflow разработки

1. `make setup` (только первый раз)
2. Разработка с `make dev-up`
3. Изменения в коде автоматически подхватываются
4. Остановка с `make dev-down`
5. Периодическая очистка с `make clean`
