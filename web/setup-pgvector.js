/**
 * Быстрая настройка pgvector для тестирования
 */

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function setupPgVector() {
  try {
    console.log('🔧 Настраиваем pgvector...')

    // 0. Включаем расширение pgvector
    await prisma.$executeRaw`CREATE EXTENSION IF NOT EXISTS vector`
    console.log('✅ Расширение pgvector включено')

    // 1. Добавляем vector колонку
    await prisma.$executeRaw`
      ALTER TABLE "Profile" 
      ADD COLUMN IF NOT EXISTS embedding vector(1024)
    `
    console.log('✅ Vector колонка добавлена')

    // 2. Создаем индекс для быстрого поиска
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS profile_embedding_cosine_idx 
      ON "Profile" USING hnsw (embedding vector_cosine_ops) 
      WITH (m = 16, ef_construction = 64)
    `
    console.log('✅ HNSW индекс создан')

    // 3. Проверяем статистику
    const stats = await prisma.$queryRaw`
      SELECT 
        COUNT(*) as total_profiles,
        COUNT(embedding) as profiles_with_embeddings
      FROM "Profile" p
      JOIN "User" u ON p."userId" = u.id
      WHERE u.role = 'EMPLOYEE'
    `
    
    console.log('📊 Статистика профилей:', stats[0])
    console.log('🚀 pgvector настроен успешно!')

  } catch (error) {
    console.error('❌ Ошибка настройки pgvector:', error)
  } finally {
    await prisma.$disconnect()
  }
}

setupPgVector()
