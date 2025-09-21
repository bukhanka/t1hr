/**
 * Автоматическая генерация эмбеддингов при изменении профилей
 */

import { VectorizationService } from './vectorization'
import { prisma } from './prisma'

/**
 * Хук для автоматической генерации эмбеддинга после создания/обновления профиля
 */
export class AutoEmbeddingService {
  
  /**
   * Автоматически обновляет эмбеддинг профиля в фоне
   */
  static async scheduleEmbeddingUpdate(profileId: string, delay: number = 2000) {
    // Запускаем в фоне с небольшой задержкой
    setTimeout(async () => {
      try {
        console.log(`🔄 Автообновление эмбеддинга для профиля ${profileId}`)
        const success = await VectorizationService.updateProfileEmbedding(profileId)
        
        if (success) {
          console.log(`✅ Эмбеддинг автоматически обновлен для профиля ${profileId}`)
        } else {
          console.log(`⚠️ Не удалось обновить эмбеддинг для профиля ${profileId}`)
        }
      } catch (error) {
        console.error(`❌ Ошибка автообновления эмбеддинга для ${profileId}:`, error)
      }
    }, delay)
  }

  /**
   * Проверяет, нужно ли обновить эмбеддинг профиля
   */
  static async shouldUpdateEmbedding(profileId: string): Promise<boolean> {
    try {
      const result = await prisma.$queryRaw<Array<{ 
        embedding_exists: boolean,
        text_changed: boolean 
      }>>`
        SELECT 
          (embedding IS NOT NULL) as embedding_exists,
          (
            "embeddingText" IS NULL OR 
            "updatedAt" > (
              SELECT MAX("updatedAt") 
              FROM "Profile" p2 
              WHERE p2.id = ${profileId} AND p2."embeddingText" IS NOT NULL
            )
          ) as text_changed
        FROM "Profile" 
        WHERE id = ${profileId}
      `

      const row = result[0]
      if (!row) return true

      // Обновляем если нет эмбеддинга или если профиль изменился
      return !row.embedding_exists || row.text_changed
      
    } catch (error) {
      console.error('Ошибка проверки необходимости обновления эмбеддинга:', error)
      return true // В случае ошибки лучше обновить
    }
  }

  /**
   * Массовая инициализация эмбеддингов для всех профилей без них
   */
  static async initializeMissingEmbeddings(): Promise<{
    total: number,
    processed: number,
    errors: number
  }> {
    console.log('🚀 Начинаем массовую инициализацию эмбеддингов...')

    try {
      // Находим профили без эмбеддингов
      const profilesNeedingEmbeddings = await prisma.$queryRaw<Array<{ id: string }>>`
        SELECT p.id
        FROM "Profile" p
        JOIN "User" u ON p."userId" = u.id
        WHERE u.role = 'EMPLOYEE' 
          AND p.embedding IS NULL
        ORDER BY p."updatedAt" DESC
        LIMIT 50
      `

      const total = profilesNeedingEmbeddings.length
      let processed = 0
      let errors = 0

      console.log(`📊 Найдено ${total} профилей для обработки`)

      // Обрабатываем по одному с задержкой
      for (const profile of profilesNeedingEmbeddings) {
        try {
          const success = await VectorizationService.updateProfileEmbedding(profile.id)
          
          if (success) {
            processed++
            console.log(`✅ ${processed}/${total}: Профиль ${profile.id} обработан`)
          } else {
            errors++
            console.log(`⚠️ ${processed + errors}/${total}: Ошибка обработки ${profile.id}`)
          }
          
          // Задержка между запросами к API
          await new Promise(resolve => setTimeout(resolve, 1000))
          
        } catch (error) {
          errors++
          console.error(`❌ Ошибка обработки профиля ${profile.id}:`, error)
        }
      }

      const result = { total, processed, errors }
      console.log(`🏁 Массовая инициализация завершена:`, result)
      
      return result

    } catch (error) {
      console.error('❌ Критическая ошибка массовой инициализации:', error)
      return { total: 0, processed: 0, errors: 1 }
    }
  }

  /**
   * Получить статистику покрытия эмбеддингами
   */
  static async getEmbeddingCoverage(): Promise<{
    total: number,
    withEmbeddings: number,
    percentage: number,
    lastUpdate: Date | null
  }> {
    try {
      const stats = await prisma.$queryRaw<Array<{
        total: bigint,
        with_embeddings: bigint,
        last_update: Date | null
      }>>`
        SELECT 
          COUNT(*) as total,
          COUNT(p.embedding) as with_embeddings,
          MAX(p."updatedAt") as last_update
        FROM "Profile" p
        JOIN "User" u ON p."userId" = u.id
        WHERE u.role = 'EMPLOYEE'
      `

      const row = stats[0]
      const total = Number(row?.total || 0)
      const withEmbeddings = Number(row?.with_embeddings || 0)
      const percentage = total > 0 ? Math.round((withEmbeddings / total) * 100) : 0

      return {
        total,
        withEmbeddings,
        percentage,
        lastUpdate: row?.last_update || null
      }

    } catch (error) {
      console.error('Ошибка получения статистики эмбеддингов:', error)
      return {
        total: 0,
        withEmbeddings: 0,
        percentage: 0,
        lastUpdate: null
      }
    }
  }
}
