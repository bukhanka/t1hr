import { openai, MODELS } from './openai'
import { prisma } from './prisma'

/**
 * Сервис векторизации профилей для семантического поиска
 */
export class VectorizationService {
  /**
   * Создает текстовое представление профиля для векторизации
   */
  static async buildProfileDocument(profileId: string): Promise<string | null> {
    const profile = await prisma.profile.findUnique({
      where: { id: profileId },
      include: {
        user: {
          select: { name: true }
        },
        userSkills: {
          include: { skill: true },
          where: { status: 'USING' }
        },
        userProjects: {
          include: { project: true },
          where: { achievements: { not: null } }
        },
        careerGoals: true
      }
    })

    if (!profile) {
      return null
    }

    // Собираем все текстовые данные профиля в один документ
    const parts: string[] = []

    // Базовая информация
    if (profile.user.name) {
      parts.push(`Сотрудник: ${profile.user.name}`)
    }

    if (profile.jobTitle) {
      parts.push(`Должность: ${profile.jobTitle}`)
    }

    if (profile.department) {
      parts.push(`Отдел: ${profile.department}`)
    }

    // Навыки и компетенции
    const skills = profile.userSkills.map(us => {
      const level = ['', 'Начальный', 'Базовый', 'Хороший', 'Продвинутый', 'Экспертный'][us.level] || 'Неизвестный'
      return `${us.skill.name} (${level} уровень)${us.isVerified ? ' - подтвержден коллегами' : ''}`
    })

    if (skills.length > 0) {
      parts.push(`Навыки: ${skills.join(', ')}`)
    }

    // Проекты и достижения
    const projects = profile.userProjects.map(up => {
      return `Проект "${up.project.name}": выполнял роль ${up.roleInProject}. Достижения: ${up.achievements}`
    })

    if (projects.length > 0) {
      parts.push(`Опыт работы: ${projects.join('. ')}`)
    }

    // Карьерные цели
    const goals = profile.careerGoals.map(cg => `${cg.goalType}: ${cg.target}`)
    if (goals.length > 0) {
      parts.push(`Карьерные цели: ${goals.join(', ')}`)
    }

    // Дополнительная информация для контекста
    parts.push(`Уровень профессионального развития: ${this.getLevelTitle(profile.level)}`)
    parts.push(`Сила профиля: ${profile.profileStrength}%`)

    return parts.join('. ')
  }

  /**
   * Генерирует эмбеддинг для текста через SciBox API
   */
  static async generateEmbedding(text: string): Promise<number[] | null> {
    try {
      const embeddingResponse = await openai.embeddings.create({
        model: MODELS.EMBEDDINGS, // bge-m3
        input: text,
      })

      const embedding = embeddingResponse.data[0]?.embedding

      if (!embedding) {
        console.error('Не удалось получить эмбеддинг от SciBox API')
        return null
      }

      console.log(`✅ Сгенерирован эмбеддинг размерностью ${embedding.length} для текста длиной ${text.length} символов`)
      
      return embedding

    } catch (error) {
      console.error('Ошибка при генерации эмбеддинга через SciBox:', error)
      return null
    }
  }

  /**
   * Обновляет эмбеддинг для профиля
   */
  static async updateProfileEmbedding(profileId: string): Promise<boolean> {
    try {
      // Создаем текстовый документ профиля
      const documentText = await this.buildProfileDocument(profileId)
      
      if (!documentText) {
        console.error(`Не удалось создать документ для профиля ${profileId}`)
        return false
      }

      // Генерируем эмбеддинг
      const embedding = await this.generateEmbedding(documentText)
      
      if (!embedding) {
        console.error(`Не удалось сгенерировать эмбеддинг для профиля ${profileId}`)
        return false
      }

      // Обновляем профиль в БД (используем raw SQL для pgvector)
      await prisma.$executeRaw`
        UPDATE "Profile" 
        SET embedding = ${`[${embedding.join(',')}]`}::vector,
            "embeddingText" = ${documentText.substring(0, 1000)},
            "updatedAt" = NOW()
        WHERE id = ${profileId}
      `

      console.log(`🎯 Эмбеддинг обновлен для профиля ${profileId}`)
      return true

    } catch (error) {
      console.error(`Ошибка при обновлении эмбеддинга для профиля ${profileId}:`, error)
      return false
    }
  }

  /**
   * Обновляет эмбеддинги для всех профилей (фоновая задача)
   */
  static async rebuildAllEmbeddings(): Promise<void> {
    console.log('🔄 Начинаем перестроение всех эмбеддингов...')

    const profiles = await prisma.profile.findMany({
      where: {
        user: { role: 'EMPLOYEE' }
      },
      select: { id: true }
    })

    console.log(`Найдено ${profiles.length} профилей для обработки`)

    let successful = 0
    let failed = 0

    for (const profile of profiles) {
      const success = await this.updateProfileEmbedding(profile.id)
      if (success) {
        successful++
      } else {
        failed++
      }

      // Небольшая задержка между запросами к API
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    console.log(`✅ Перестроение завершено: ${successful} успешно, ${failed} ошибок`)
  }

  /**
   * Выполняет семантический поиск по эмбеддингам
   */
  static async semanticSearch(
    queryText: string, 
    limit: number = 10,
    threshold: number = 0.3
  ): Promise<Array<{
    profileId: string
    similarity: number
    profile: any
  }> | null> {
    try {
      // Генерируем эмбеддинг для поискового запроса
      const queryEmbedding = await this.generateEmbedding(queryText)
      
      if (!queryEmbedding) {
        console.error('Не удалось сгенерировать эмбеддинг для поискового запроса')
        return null
      }

      // 🚀 НАСТОЯЩИЙ векторный поиск через pgvector!
      console.log('🔍 Выполняем векторный поиск через pgvector...')
      
      const queryVector = `[${queryEmbedding.join(',')}]`
      
      const results = await prisma.$queryRaw<Array<{
        id: string
        similarity: number
      }>>`
        SELECT 
          id,
          (1 - (embedding <=> ${queryVector}::vector))::float as similarity
        FROM "Profile"
        WHERE embedding IS NOT NULL
          AND (1 - (embedding <=> ${queryVector}::vector)) > ${threshold}
        ORDER BY embedding <=> ${queryVector}::vector ASC
        LIMIT ${limit}
      `

      if (results.length === 0) {
        console.log('🔍 Векторный поиск не дал результатов, возможно нет эмбеддингов')
        return []
      }

      // Получаем полные данные профилей
      const profileIds = results.map(r => r.id)
      const profiles = await prisma.profile.findMany({
        where: { id: { in: profileIds } },
        include: {
          user: {
            select: { id: true, name: true, email: true }
          },
          userSkills: {
            include: { skill: true },
            where: { status: 'USING' }
          },
          userProjects: {
            include: { project: true },
            where: { achievements: { not: null } },
            take: 3
          }
        }
      })

      // Объединяем результаты с данными профилей, сохраняя порядок сортировки
      const enrichedResults = results.map(result => {
        const profile = profiles.find(p => p.id === result.id)
        return {
          profileId: result.id,
          similarity: result.similarity,
          profile
        }
      }).filter(r => r.profile)

      console.log(`✅ Векторный поиск: найдено ${enrichedResults.length} результатов для запроса "${queryText}"`)
      
      return enrichedResults

    } catch (error) {
      console.error('Ошибка при выполнении семантического поиска:', error)
      return null
    }
  }

  /**
   * Получить название уровня по номеру
   */
  private static getLevelTitle(level: number): string {
    const levels = ['', 'Newcomer', 'Junior', 'Middle', 'Senior', 'Expert', 'Principal']
    return levels[level] || 'Unknown'
  }
}
