-- Инициализация базы данных с расширениями для SciBox Talent Management System

-- Создаем расширение pgvector для работы с векторными эмбеддингами
CREATE EXTENSION IF NOT EXISTS vector;

-- Проверяем, что расширение установлено
SELECT extname, extversion FROM pg_extension WHERE extname = 'vector';

-- Создаем индексы для оптимизации поиска по векторам (после создания таблиц через Prisma)
-- Примечание: эти индексы будут созданы после миграций Prisma

-- Комментарий для разработчиков
COMMENT ON DATABASE scibox_talent_db IS 'SciBox Talent Management System Database with pgvector extension for semantic search';
