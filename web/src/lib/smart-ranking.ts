import { openai, MODELS } from './openai'
import { prisma } from './prisma'
import { VectorizationService } from './vectorization'
import { smartCache, createCacheKey, cacheWithRefresh } from './cache'

/**
 * Интеллектуальная система ранжирования для HR/менеджеров и рекомендаций сотрудникам
 * 
 * Формула: Score = (w1 * HardSkills) + (w2 * Experience) + (w3 * CareerAspiration) + (w4 * Potential)
 */

interface RankingWeights {
  hardSkills: number      // Соответствие hard skills
  experience: number      // Релевантность опыта  
  careerAspiration: number // Карьерные цели и готовность
  potential: number       // Потенциал к развитию
}

interface CandidateMatch {
  profileId: string
  compositeScore: number
  breakdown: {
    hardSkillsScore: number
    experienceScore: number
    careerAspirationScore: number
    potentialScore: number
  }
  profile: any
}

interface OpportunityMatch {
  id: string
  type: 'course' | 'project' | 'job' | 'mentor'
  relevanceScore: number
  reasoning: string
  data: any
}

export class SmartRankingService {

  // Конфигурации весов для разных типов запросов
  static readonly WEIGHTS_CONFIGS = {
    // Для технических позиций - акцент на навыки
    TECHNICAL_ROLE: {
      hardSkills: 0.45,
      experience: 0.30,
      careerAspiration: 0.15,
      potential: 0.10
    },
    
    // Для управленческих позиций - акцент на опыт и амбиции
    MANAGEMENT_ROLE: {
      hardSkills: 0.20,
      experience: 0.35,
      careerAspiration: 0.35,
      potential: 0.10
    },
    
    // Для новых/инновационных проектов - важен потенциал
    INNOVATIVE_PROJECT: {
      hardSkills: 0.25,
      experience: 0.25,
      careerAspiration: 0.25,
      potential: 0.25
    },

    // Для рекомендаций сотрудникам - важны цели
    EMPLOYEE_RECOMMENDATIONS: {
      hardSkills: 0.30,
      experience: 0.20,
      careerAspiration: 0.40,
      potential: 0.10
    }
  }

  /**
   * Основной метод ранжирования кандидатов для менеджеров
   */
  static async rankCandidatesForPosition(
    searchQuery: string,
    candidateProfileIds: string[],
    positionType: keyof typeof SmartRankingService.WEIGHTS_CONFIGS = 'TECHNICAL_ROLE'
  ): Promise<CandidateMatch[]> {
    
    const weights = this.WEIGHTS_CONFIGS[positionType]
    const results: CandidateMatch[] = []

    for (const profileId of candidateProfileIds) {
      const profile = await prisma.profile.findUnique({
        where: { id: profileId },
        include: {
          user: { select: { name: true, email: true } },
          userSkills: { include: { skill: true } },
          userProjects: { include: { project: true } },
          careerGoals: true
        }
      })

      if (!profile) continue

      // 1. Hard Skills Score (0-1)
      const hardSkillsScore = await this.calculateHardSkillsScore(searchQuery, profile)
      
      // 2. Experience Score (0-1)  
      const experienceScore = await this.calculateExperienceScore(searchQuery, profile)
      
      // 3. Career Aspiration Score (0-1)
      const careerAspirationScore = await this.calculateCareerAspirationScore(searchQuery, profile)
      
      // 4. Potential Score (0-1)
      const potentialScore = await this.calculatePotentialScore(searchQuery, profile)

      // Композитный балл
      const compositeScore = (
        weights.hardSkills * hardSkillsScore +
        weights.experience * experienceScore +
        weights.careerAspiration * careerAspirationScore +
        weights.potential * potentialScore
      )

      results.push({
        profileId,
        compositeScore,
        breakdown: {
          hardSkillsScore,
          experienceScore,
          careerAspirationScore,
          potentialScore
        },
        profile
      })
    }

    return results.sort((a, b) => b.compositeScore - a.compositeScore)
  }

  /**
   * 1. Hard Skills Match - векторизация навыков + уровни
   */
  private static async calculateHardSkillsScore(query: string, profile: any): Promise<number> {
    try {
      let score = 0
      const queryLower = query.toLowerCase()
      
      // Извлекаем требуемые навыки из запроса с помощью ИИ
      const requiredSkills = await this.extractRequiredSkillsFromQuery(query)
      
      for (const userSkill of profile.userSkills) {
        const skillName = userSkill.skill.name.toLowerCase()
        
        // Прямое совпадение
        if (requiredSkills.some((req: string) => req.toLowerCase() === skillName)) {
          score += userSkill.level * 0.2 // Максимум 1.0 за навык
          if (userSkill.isVerified) score += 0.1 // Бонус за подтверждение
        }
        
        // Семантическое совпадение (похожие технологии)
        const semanticMatch = await this.calculateSkillSemanticSimilarity(skillName, requiredSkills)
        score += semanticMatch * userSkill.level * 0.1
      }
      
      return Math.min(1.0, score / requiredSkills.length) // Нормализация
      
    } catch (error) {
      console.error('Ошибка расчета Hard Skills Score:', error)
      return 0
    }
  }

  /**
   * 2. Experience Relevance Score - домен + время + проекты
   */
  private static async calculateExperienceScore(query: string, profile: any): Promise<number> {
    try {
      let score = 0
      const now = new Date()
      
      for (const userProject of profile.userProjects) {
        if (!userProject.achievements) continue
        
        // Семантическое сходство проекта с запросом
        const projectDescription = `${userProject.project.name}. Роль: ${userProject.roleInProject}. Достижения: ${userProject.achievements}`
        const relevance = await this.calculateSemanticSimilarity(query, projectDescription)
        
        // Временной распад (новые проекты важнее)
        const timeDecay = userProject.endDate ? 
          Math.max(0.3, 1 - (now.getTime() - new Date(userProject.endDate).getTime()) / (365 * 24 * 60 * 60 * 1000)) :
          1.0 // Текущий проект = максимальный вес
        
        score += relevance * timeDecay
      }
      
      return Math.min(1.0, score)
      
    } catch (error) {
      console.error('Ошибка расчета Experience Score:', error)
      return 0
    }
  }

  /**
   * 3. Career Aspiration Score - соответствие целям роста
   */
  private static async calculateCareerAspirationScore(query: string, profile: any): Promise<number> {
    try {
      if (profile.careerGoals.length === 0) return 0
      
      let score = 0
      
      for (const goal of profile.careerGoals) {
        const goalDescription = `${goal.goalType}: ${goal.target}`
        
        // Анализируем, ведет ли позиция к карьерной цели
        const alignment = await this.calculateSemanticSimilarity(query, goalDescription)
        
        // Приоритет цели (1-5)
        const priorityWeight = goal.priority / 5
        
        score += alignment * priorityWeight
      }
      
      return Math.min(1.0, score)
      
    } catch (error) {
      console.error('Ошибка расчета Career Aspiration Score:', error)
      return 0
    }
  }

  /**
   * 4. Potential & Readiness Score - обучаемость
   */
  private static async calculatePotentialScore(query: string, profile: any): Promise<number> {
    try {
      let score = 0.5 // Базовый потенциал
      
      // Активность в обучении (курсы, менторство)
      const learningActivity = (profile.userCourses?.length || 0) + (profile.mentorPrograms?.length || 0)
      score += Math.min(0.3, learningActivity * 0.05)
      
      // T-Coins активность (показатель мотивации)
      const tcoinsActivity = profile.totalEarned || 0
      score += Math.min(0.2, tcoinsActivity / 1000 * 0.2)
      
      // Анализ skill gap - насколько далеки требуемые навыки
      const skillGap = await this.analyzeSkillGap(query, profile)
      score += (1 - skillGap) * 0.3 // Чем меньше gap, тем больше потенциал
      
      return Math.min(1.0, score)
      
    } catch (error) {
      console.error('Ошибка расчета Potential Score:', error)
      return 0.5
    }
  }

  /**
   * Ранжирование возможностей для сотрудника
   */
  static async rankOpportunitiesForEmployee(
    userId: string,
    opportunities: Array<{id: string, type: string, data: any}>
  ): Promise<OpportunityMatch[]> {
    
    const profile = await prisma.profile.findUnique({
      where: { userId },
      include: {
        userSkills: { include: { skill: true } },
        userProjects: { include: { project: true } },
        careerGoals: true
      }
    })

    if (!profile) return []

    const results: OpportunityMatch[] = []

    for (const opportunity of opportunities) {
      const score = await this.calculateOpportunityRelevance(profile, opportunity)
      const reasoning = await this.generateRecommendationReasoning(profile, opportunity, score)
      
      results.push({
        id: opportunity.id,
        type: opportunity.type as any,
        relevanceScore: score,
        reasoning,
        data: opportunity.data
      })
    }

    return results.sort((a, b) => b.relevanceScore - a.relevanceScore)
  }

  /**
   * Вспомогательные методы
   */
  
  private static async extractRequiredSkillsFromQuery(query: string): Promise<string[]> {
    try {
      const prompt = `Извлеки конкретные технические навыки из этого запроса: "${query}"
      
Верни только список навыков через запятую, без объяснений.
Примеры навыков: JavaScript, React, Python, Docker, AWS, PostgreSQL, Git, etc.

Если навыков нет, верни пустую строку.`

      const completion = await openai.chat.completions.create({
        model: MODELS.CHAT,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
        max_tokens: 100
      })

      const result = completion.choices[0]?.message?.content?.trim() || ''
      return result ? result.split(',').map(s => s.trim()).filter(s => s.length > 0) : []
      
    } catch (error) {
      console.error('Ошибка извлечения навыков:', error)
      return []
    }
  }

  private static async calculateSkillSemanticSimilarity(skill: string, requiredSkills: string[]): Promise<number> {
    // Простая эвристика для связанных навыков
    const relatedSkills: Record<string, string[]> = {
      'react': ['javascript', 'jsx', 'frontend', 'ui'],
      'python': ['django', 'flask', 'fastapi', 'data science'],
      'java': ['spring', 'spring boot', 'jvm', 'kotlin'],
      'docker': ['kubernetes', 'containers', 'devops'],
      'postgresql': ['sql', 'database', 'rdbms']
    }

    const skillLower = skill.toLowerCase()
    
    for (const requiredSkill of requiredSkills) {
      const requiredLower = requiredSkill.toLowerCase()
      
      if (relatedSkills[skillLower]?.includes(requiredLower) ||
          relatedSkills[requiredLower]?.includes(skillLower)) {
        return 0.7 // Высокое семантическое сходство
      }
      
      if (skillLower.includes(requiredLower) || requiredLower.includes(skillLower)) {
        return 0.5 // Частичное совпадение
      }
    }
    
    return 0
  }

  private static async calculateSemanticSimilarity(text1: string, text2: string): Promise<number> {
    try {
      // Используем простую эвристику пока нет векторного поиска
      const words1 = text1.toLowerCase().split(/\s+/)
      const words2 = text2.toLowerCase().split(/\s+/)
      
      const intersection = words1.filter(word => words2.includes(word))
      const union = [...new Set([...words1, ...words2])]
      
      return intersection.length / union.length // Jaccard similarity
      
    } catch (error) {
      console.error('Ошибка расчета семантического сходства:', error)
      return 0
    }
  }

  private static async analyzeSkillGap(query: string, profile: any): Promise<number> {
    try {
      const requiredSkills = await this.extractRequiredSkillsFromQuery(query)
      const userSkills = profile.userSkills.map((us: any) => us.skill.name.toLowerCase())
      
      if (requiredSkills.length === 0) return 0
      
      const missingSkills = requiredSkills.filter(req => 
        !userSkills.includes(req.toLowerCase())
      )
      
      return missingSkills.length / requiredSkills.length // % недостающих навыков
      
    } catch (error) {
      console.error('Ошибка анализа skill gap:', error)
      return 1 // Максимальный gap в случае ошибки
    }
  }

  private static async calculateOpportunityRelevance(profile: any, opportunity: any): Promise<number> {
    try {
      let score = 0
      const weights = this.WEIGHTS_CONFIGS.EMPLOYEE_RECOMMENDATIONS

      // Для курсов - соответствие навыкам которые хочет изучить
      if (opportunity.type === 'course') {
        const courseSkills = opportunity.data.skills || []
        const wantToLearnSkills = profile.userSkills
          .filter((us: any) => us.status === 'WANTS_TO_LEARN')
          .map((us: any) => us.skill.name.toLowerCase())
        
        const skillMatch = courseSkills.filter((cs: string) => 
          wantToLearnSkills.includes(cs.toLowerCase())
        ).length / Math.max(1, courseSkills.length)
        
        score += skillMatch * weights.careerAspiration
        
        // Бонус за уровень курса
        const levelMatch = this.calculateLevelMatch(profile.level, opportunity.data.level)
        score += levelMatch * weights.potential
      }

      // Для проектов - соответствие навыкам и карьерным целям
      if (opportunity.type === 'project') {
        // Анализируем описание проекта на соответствие навыкам
        const projectDescription = opportunity.data.description || ''
        const userSkillNames = profile.userSkills.map((us: any) => us.skill.name).join(', ')
        
        const skillRelevance = await this.calculateSemanticSimilarity(projectDescription, userSkillNames)
        score += skillRelevance * weights.hardSkills
        
        // Соответствие карьерным целям
        const careerGoals = profile.careerGoals.map((cg: any) => cg.target).join(', ')
        const careerRelevance = await this.calculateSemanticSimilarity(projectDescription, careerGoals)
        score += careerRelevance * weights.careerAspiration
      }

      // Для вакансий - полная оценка соответствия
      if (opportunity.type === 'job') {
        const jobRequirements = opportunity.data.requirements?.join(', ') || ''
        const jobDescription = `${opportunity.data.title} ${opportunity.data.description}`
        
        // Hard skills match
        const userSkillNames = profile.userSkills.map((us: any) => us.skill.name).join(', ')
        const skillMatch = await this.calculateSemanticSimilarity(jobRequirements, userSkillNames)
        score += skillMatch * weights.hardSkills
        
        // Career aspiration match
        const careerGoals = profile.careerGoals.map((cg: any) => cg.target).join(', ')
        const careerMatch = await this.calculateSemanticSimilarity(jobDescription, careerGoals)
        score += careerMatch * weights.careerAspiration
        
        // Level match
        const levelMatch = this.calculateLevelMatch(profile.level, opportunity.data.level)
        score += levelMatch * weights.experience
      }

      return Math.min(1.0, score)
      
    } catch (error) {
      console.error('Ошибка расчета релевантности возможности:', error)
      return 0
    }
  }

  private static calculateLevelMatch(userLevel: number, requiredLevel: string): number {
    const levelMap = {
      'junior': 1,
      'middle': 3,
      'senior': 5,
      'expert': 6,
      'all': userLevel
    }
    
    const requiredLevelNum = levelMap[requiredLevel?.toLowerCase() as keyof typeof levelMap] || userLevel
    
    if (userLevel >= requiredLevelNum) {
      return 1.0 // Полное соответствие или превышение
    } else {
      return Math.max(0.3, userLevel / requiredLevelNum) // Частичное соответствие
    }
  }

  private static async generateRecommendationReasoning(profile: any, opportunity: any, score: number): Promise<string> {
    try {
      if (score < 0.3) return "Низкое соответствие профилю"
      
      const reasons = []
      
      if (opportunity.type === 'course') {
        const courseSkills = opportunity.data.skills || []
        const userWantToLearn = profile.userSkills
          .filter((us: any) => us.status === 'WANTS_TO_LEARN')
          .map((us: any) => us.skill.name)
        
        const matchingSkills = courseSkills.filter((cs: string) => 
          userWantToLearn.some((utl: string) => utl.toLowerCase() === cs.toLowerCase())
        )
        
        if (matchingSkills.length > 0) {
          reasons.push(`Развивает навыки: ${matchingSkills.slice(0, 2).join(', ')}`)
        }
        
        if (opportunity.data.level) {
          reasons.push(`Подходящий уровень: ${opportunity.data.level}`)
        }
      }

      if (opportunity.type === 'job') {
        const userSkills = profile.userSkills.map((us: any) => us.skill.name)
        const jobRequirements = opportunity.data.requirements || []
        
        const matchingSkills = jobRequirements.filter((req: string) =>
          userSkills.some((us: string) => us.toLowerCase() === req.toLowerCase())
        )
        
        if (matchingSkills.length > 0) {
          reasons.push(`Ваши навыки: ${matchingSkills.slice(0, 2).join(', ')}`)
        }
        
        // Проверяем соответствие карьерным целям
        const careerTargets = profile.careerGoals.map((cg: any) => cg.target.toLowerCase())
        if (careerTargets.some((target: string) => 
          opportunity.data.title.toLowerCase().includes(target) ||
          target.includes(opportunity.data.title.toLowerCase())
        )) {
          reasons.push("Соответствует карьерным планам")
        }
      }

      return reasons.length > 0 ? reasons.join('. ') : "Подходит для развития"
      
    } catch (error) {
      console.error('Ошибка генерации обоснования:', error)
      return "Рекомендовано системой"
    }
  }

  /**
   * Публичные методы для использования в API
   */

  // Улучшенный поиск талантов для менеджеров
  static async searchTalentsWithCompositeRanking(
    query: string,
    positionType: keyof typeof SmartRankingService.WEIGHTS_CONFIGS = 'TECHNICAL_ROLE',
    limit: number = 20
  ): Promise<any[]> {
    try {
      console.log(`🧠 Умный поиск с векторизацией: "${query}"`)
      
      // 🎯 Проверяем кэш
      const cacheKey = createCacheKey('talent_search', query, positionType, limit)
      const cachedResult = smartCache.get<any[]>(cacheKey)
      if (cachedResult) {
        console.log('⚡ Результаты из кэша!')
        return cachedResult
      }
      
      // 🚀 СНАЧАЛА пробуем векторный поиск
      const vectorResults = await VectorizationService.semanticSearch(query, limit * 2, 0.2)
      
      if (vectorResults && vectorResults.length > 0) {
        console.log(`✅ Векторный поиск дал ${vectorResults.length} результатов`)
        
        // Берем ID профилей из векторного поиска
        const profileIds = vectorResults.map(r => r.profileId)
        
        // Применяем композитное ранжирование к найденным кандидатам
        const rankedCandidates = await this.rankCandidatesForPosition(query, profileIds, positionType)
        
        // Комбинируем векторный score с композитным
        const hybridResults = rankedCandidates.map(candidate => {
          const vectorResult = vectorResults.find(v => v.profileId === candidate.profileId)
          const vectorSimilarity = vectorResult?.similarity || 0
          
          // Гибридный score: 70% композитный + 30% векторный
          const hybridScore = candidate.compositeScore * 0.7 + vectorSimilarity * 0.3
          
          return {
            ...candidate,
            hybridScore,
            vectorSimilarity,
            algorithm: 'hybrid'
          }
        }).sort((a, b) => b.hybridScore - a.hybridScore)
        
        const finalResults = hybridResults.slice(0, limit)
        
        // Кэшируем результат на 10 минут
        smartCache.set(cacheKey, finalResults, 10)
        
        return finalResults
      }
      
      console.log('⚠️ Векторный поиск не дал результатов, используем fallback')
      
      // Fallback: классический поиск
      const profiles = await prisma.profile.findMany({
        where: {
          profileStrength: { gte: 30 },
          user: { role: 'EMPLOYEE' }
        },
        include: {
          user: { select: { id: true, name: true, email: true } },
          userSkills: { include: { skill: true } },
          userProjects: { include: { project: true } },
          careerGoals: true
        },
        take: 50
      })

      const profileIds = profiles.map(p => p.id)
      const rankedCandidates = await this.rankCandidatesForPosition(query, profileIds, positionType)
      
      const fallbackResults = rankedCandidates.slice(0, limit).map(c => ({
        ...c,
        hybridScore: c.compositeScore,
        vectorSimilarity: 0,
        algorithm: 'composite_only'
      }))
      
      // Кэшируем fallback результат на 5 минут
      smartCache.set(cacheKey, fallbackResults, 5)
      
      return fallbackResults
      
    } catch (error) {
      console.error('Ошибка в композитном поиске талантов:', error)
      return []
    }
  }

  // Персонализированные рекомендации для сотрудника  
  static async getPersonalizedRecommendations(userId: string) {
    try {
      const profile = await prisma.profile.findUnique({
        where: { userId },
        include: {
          userSkills: { include: { skill: true } },
          userProjects: { include: { project: true } },
          careerGoals: true,
          userCourses: { include: { course: true } },
          mentorPrograms: { include: { program: true } }
        }
      })

      if (!profile) return { courses: [], projects: [], jobs: [], mentors: [] }

      // Собираем все возможности
      const [courses, projects, jobs, mentorPrograms] = await Promise.all([
        prisma.course.findMany({ 
          where: { status: 'ACTIVE' },
          take: 20 
        }),
        prisma.project.findMany({ 
          where: { status: 'ACTIVE' },
          take: 15 
        }),
        prisma.jobOpening.findMany({ 
          where: { status: 'OPEN' },
          take: 10 
        }),
        prisma.mentorProgram.findMany({ 
          where: { status: 'ACTIVE' },
          take: 10 
        })
      ])

      // Ранжируем каждый тип
      const opportunities = [
        ...courses.map(c => ({ id: c.id, type: 'course', data: c })),
        ...projects.map(p => ({ id: p.id, type: 'project', data: p })),
        ...jobs.map(j => ({ id: j.id, type: 'job', data: j })),
        ...mentorPrograms.map(m => ({ id: m.id, type: 'mentor', data: m }))
      ]

      const ranked = await this.rankOpportunitiesForEmployee(userId, opportunities)

      return {
        courses: ranked.filter(r => r.type === 'course').slice(0, 6),
        projects: ranked.filter(r => r.type === 'project').slice(0, 4),
        jobs: ranked.filter(r => r.type === 'job').slice(0, 3),
        mentors: ranked.filter(r => r.type === 'mentor').slice(0, 3)
      }

    } catch (error) {
      console.error('Ошибка получения персонализированных рекомендаций:', error)
      return { courses: [], projects: [], jobs: [], mentors: [] }
    }
  }
}
