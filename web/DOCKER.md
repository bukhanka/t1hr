# Docker Setup для SciBox Talent Management System

## 🚀 Быстрый запуск

### Для разработчиков

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

3. **Доступ к приложению:** http://localhost:3000

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

| Команда | Описание |
|---------|----------|
| `make setup` | Первоначальная настройка для новых разработчиков |
| `make dev-up` | Запуск среды разработки |
| `make dev-down` | Остановка среды разработки |
| `make db-up` | Запуск только базы данных |
| `make db-down` | Остановка базы данных |
| `make prod-build` | Сборка production образа |
| `make prod-up` | Запуск production среды |
| `make logs` | Просмотр логов приложения |
| `make db-migrate` | Запуск миграций БД |
| `make clean` | Очистка контейнеров и томов |

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
- **Порт:** 5432
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
docker-compose ps  # Статус всех сервисов
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
