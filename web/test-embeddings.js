/**
 * Тестирование системы эмбеддингов
 */

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testEmbeddingSystem() {
  try {
    console.log('🧪 Тестируем систему эмбеддингов...\n')

    // 1. Проверяем статистику
    const stats = await prisma.$queryRaw`
      SELECT 
        COUNT(*) as total_profiles,
        COUNT(embedding) as profiles_with_embeddings,
        COUNT("embeddingText") as profiles_with_text
      FROM "Profile" p
      JOIN "User" u ON p."userId" = u.id
      WHERE u.role = 'EMPLOYEE'
    `
    
    const stat = stats[0]
    console.log('📊 Статистика профилей:')
    console.log(`   Всего профилей сотрудников: ${stat.total_profiles}`)
    console.log(`   С эмбеддингами: ${stat.profiles_with_embeddings}`)
    console.log(`   С текстом для эмбеддингов: ${stat.profiles_with_text}`)
    
    const coverage = Number(stat.total_profiles) > 0 
      ? Math.round((Number(stat.profiles_with_embeddings) / Number(stat.total_profiles)) * 100)
      : 0
    console.log(`   Покрытие: ${coverage}%\n`)

    // 2. Тестируем создание эмбеддинга для одного профиля
    console.log('🔄 Тестируем создание эмбеддинга...')
    
    const testProfiles = await prisma.$queryRaw`
      SELECT p.id
      FROM "Profile" p
      JOIN "User" u ON p."userId" = u.id
      WHERE u.role = 'EMPLOYEE' AND p.embedding IS NULL
      LIMIT 1
    `
    
    const testProfile = testProfiles[0]

    if (testProfile) {
      console.log(`   Найден тестовый профиль: ${testProfile.id}`)
      
      // Имитируем создание эмбеддинга
      const testEmbedding = Array.from({ length: 1024 }, () => Math.random() - 0.5)
      
      await prisma.$executeRaw`
        UPDATE "Profile" 
        SET embedding = ${`[${testEmbedding.join(',')}]`}::vector,
            "embeddingText" = 'Тестовый эмбеддинг для демонстрации',
            "updatedAt" = NOW()
        WHERE id = ${testProfile.id}
      `
      
      console.log('   ✅ Тестовый эмбеддинг создан')
      
      // 3. Тестируем векторный поиск
      console.log('\n🔍 Тестируем векторный поиск...')
      
      const queryEmbedding = Array.from({ length: 1024 }, () => Math.random() - 0.5)
      
      const searchResults = await prisma.$queryRaw`
        SELECT 
          id,
          (1 - (embedding <=> ${`[${queryEmbedding.join(',')}]`}::vector))::float as similarity
        FROM "Profile"
        WHERE embedding IS NOT NULL
        ORDER BY embedding <=> ${`[${queryEmbedding.join(',')}]`}::vector ASC
        LIMIT 3
      `
      
      console.log(`   Найдено результатов: ${searchResults.length}`)
      searchResults.forEach((result, i) => {
        console.log(`   ${i + 1}. Профиль ${result.id}: similarity = ${result.similarity.toFixed(4)}`)
      })
      
    } else {
      console.log('   ⚠️ Нет профилей без эмбеддингов для тестирования')
    }

    // 4. Проверяем индексы
    console.log('\n📈 Проверяем индексы...')
    
    const indexes = await prisma.$queryRaw`
      SELECT indexname, tablename 
      FROM pg_indexes 
      WHERE indexdef LIKE '%vector%' AND tablename = 'Profile'
    `
    
    if (indexes.length > 0) {
      console.log('   ✅ Векторные индексы найдены:')
      indexes.forEach(idx => {
        console.log(`   - ${idx.indexname}`)
      })
    } else {
      console.log('   ⚠️ Векторные индексы не найдены')
    }

    console.log('\n🎉 Тестирование завершено успешно!')
    console.log('\n💡 Для использования в продакшене:')
    console.log('   1. Запустите приложение: npm run dev')
    console.log('   2. Войдите как HR: ekaterina.hr@company.com')
    console.log('   3. Перейдите в HR панель и нажмите "Запустить инициализацию"')
    console.log('   4. Используйте поиск талантов для тестирования')

  } catch (error) {
    console.error('❌ Ошибка тестирования:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testEmbeddingSystem()
