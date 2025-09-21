-- Post-migration script для добавления pgvector функциональности
-- Выполняется после обычных Prisma миграций

-- 1. Добавляем vector колонку к Profile таблице (если еще нет)
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Profile' AND column_name = 'embedding'
    ) THEN
        ALTER TABLE "Profile" ADD COLUMN embedding vector(256);
        COMMENT ON COLUMN "Profile".embedding IS 'Векторное представление профиля для семантического поиска (bge-m3, 256 измерений)';
    END IF;
END $$;

-- 2. Создаем оптимальный HNSW индекс для cosine similarity поиска
-- Удаляем старый индекс если есть
DROP INDEX IF EXISTS profile_embedding_cosine_idx;

-- Создаем новый индекс только если есть данные
-- HNSW параметры оптимизированы для ~10K профилей
CREATE INDEX CONCURRENTLY IF NOT EXISTS profile_embedding_cosine_idx 
ON "Profile" USING hnsw (embedding vector_cosine_ops) 
WITH (m = 16, ef_construction = 64);

-- 3. Создаем дополнительный индекс для L2 distance (на всякий случай)
CREATE INDEX CONCURRENTLY IF NOT EXISTS profile_embedding_l2_idx 
ON "Profile" USING hnsw (embedding vector_l2_ops) 
WITH (m = 16, ef_construction = 64);

-- 4. Создаем функцию для поиска похожих профилей
CREATE OR REPLACE FUNCTION find_similar_profiles(
    query_embedding vector(256),
    similarity_threshold float DEFAULT 0.3,
    max_results int DEFAULT 10
)
RETURNS TABLE(
    profile_id text,
    similarity_score float
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id::text as profile_id,
        (1 - (p.embedding <=> query_embedding))::float as similarity_score
    FROM "Profile" p
    WHERE p.embedding IS NOT NULL
        AND (1 - (p.embedding <=> query_embedding)) > similarity_threshold
    ORDER BY p.embedding <=> query_embedding
    LIMIT max_results;
END;
$$ LANGUAGE plpgsql;

-- 5. Создаем функцию для получения статистики индексов
CREATE OR REPLACE FUNCTION get_vector_index_stats()
RETURNS TABLE(
    index_name text,
    table_name text,
    size_mb float
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        i.indexname::text,
        i.tablename::text,
        (pg_relation_size(i.indexname::regclass) / 1024.0 / 1024.0)::float as size_mb
    FROM pg_indexes i
    WHERE i.indexdef LIKE '%vector%'
    ORDER BY size_mb DESC;
END;
$$ LANGUAGE plpgsql;

-- 6. Комментарии для документации
COMMENT ON FUNCTION find_similar_profiles IS 'Поиск похожих профилей по векторному сходству';
COMMENT ON FUNCTION get_vector_index_stats IS 'Статистика векторных индексов';

-- 7. Выводим информацию о настройке
SELECT 'pgvector setup completed successfully!' as status,
       version() as postgres_version,
       (SELECT extversion FROM pg_extension WHERE extname = 'vector') as pgvector_version;
