/**
 * Скрипт для тестирования улучшенной системы поиска
 */

const { PrismaClient } = require('@prisma/client')
const { VectorizationService } = require('./dist/src/lib/vectorization.js')

const prisma = new PrismaClient()

async function testSmartSearch() {
  console.log('🚀 Тестируем улучшенную систему поиска...\n')

  try {
    // 1. Проверяем статус эмбеддингов
    const totalProfiles = await prisma.profile.count({
      where: { user: { role: 'EMPLOYEE' } }
    })
    
    const withEmbeddings = await prisma.profile.count({
      where: { 
        user: { role: 'EMPLOYEE' },
        embedding: { not: null }
      }
    })

    console.log(`📊 Статус эмбеддингов:`)
    console.log(`   Всего профилей: ${totalProfiles}`)
    console.log(`   С эмбеддингами: ${withEmbeddings}`)
    console.log(`   Покрытие: ${Math.round((withEmbeddings/totalProfiles)*100)}%\n`)

    // 2. Инициализируем эмбеддинги для первых 5 профилей если их нет
    if (withEmbeddings === 0) {
      console.log('🔄 Инициализируем эмбеддинги для демо...')
      
      const profiles = await prisma.profile.findMany({
        where: { 
          user: { role: 'EMPLOYEE' },
          embedding: null
        },
        take: 5
      })

      for (const profile of profiles) {
        console.log(`   Обрабатываем профиль ${profile.id}...`)
        await VectorizationService.updateProfileEmbedding(profile.id)
        await new Promise(resolve => setTimeout(resolve, 1000)) // Задержка между запросами
      }
      
      console.log('✅ Эмбеддинги инициализированы!\n')
    }

    // 3. Тестируем векторный поиск
    console.log('🔍 Тестируем векторный поиск...')
    
    const searchQueries = [
      'JavaScript React разработчик',
      'Python машинное обучение',
      'менеджер проектов'
    ]

    for (const query of searchQueries) {
      console.log(`\n   Запрос: "${query}"`)
      
      const results = await VectorizationService.semanticSearch(query, 3, 0.1)
      
      if (results && results.length > 0) {
        console.log(`   ✅ Найдено ${results.length} результатов:`)
        results.forEach((result, i) => {
          console.log(`      ${i+1}. ${result.profile?.user?.name || 'Неизвестно'} (similarity: ${result.similarity.toFixed(3)})`)
        })
      } else {
        console.log('   ⚠️ Результаты не найдены')
      }
    }

    console.log('\n✅ Тестирование завершено!')

  } catch (error) {
    console.error('❌ Ошибка при тестировании:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Запускаем тест
testSmartSearch()
