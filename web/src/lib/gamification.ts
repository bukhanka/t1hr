import { prisma } from './prisma'

export type GamificationEvent = 
  | 'PROFILE_CREATED'
  | 'SKILL_ADDED'
  | 'SKILL_VERIFIED'
  | 'PROJECT_ADDED'
  | 'PROJECT_ACHIEVEMENT_ADDED'
  | 'CAREER_GOAL_SET'
  | 'PROFILE_UPDATED'
  | 'CHAT_WITH_AI'

type XPRewards = Record<GamificationEvent, number>

const XP_REWARDS: XPRewards = {
  PROFILE_CREATED: 50,
  SKILL_ADDED: 25,
  SKILL_VERIFIED: 75,
  PROJECT_ADDED: 100,
  PROJECT_ACHIEVEMENT_ADDED: 150,
  CAREER_GOAL_SET: 50,
  PROFILE_UPDATED: 25,
  CHAT_WITH_AI: 10
}

// Таблица уровней и требований XP
const LEVEL_REQUIREMENTS = [
  { level: 1, minXp: 0, title: 'Newcomer' },
  { level: 2, minXp: 300, title: 'Junior' },
  { level: 3, minXp: 800, title: 'Middle' },
  { level: 4, minXp: 1500, title: 'Senior' },
  { level: 5, minXp: 2500, title: 'Expert' },
  { level: 6, minXp: 4000, title: 'Principal' }
]

export class GamificationService {
  static async awardXP(userId: string, event: GamificationEvent, multiplier: number = 1) {
    try {
      const profile = await prisma.profile.findUnique({
        where: { userId }
      })

      if (!profile) {
        console.error(`Профиль для пользователя ${userId} не найден`)
        return null
      }

      const xpReward = Math.floor(XP_REWARDS[event] * multiplier)
      const newXp = profile.xp + xpReward
      
      // Вычисляем новый уровень
      const newLevel = this.calculateLevel(newXp)
      const oldLevel = profile.level

      // Обновляем профиль
      const updatedProfile = await prisma.profile.update({
        where: { userId },
        data: {
          xp: newXp,
          level: newLevel
        }
      })

      // Проверяем получение новых бейджей
      await this.checkAndAwardBadges(userId, event)

      // Проверяем повышение уровня
      const levelUp = newLevel > oldLevel

      return {
        xpAwarded: xpReward,
        totalXp: newXp,
        newLevel,
        levelUp,
        event
      }

    } catch (error) {
      console.error('Ошибка при начислении XP:', error)
      return null
    }
  }

  static calculateLevel(xp: number): number {
    // Находим максимальный уровень, которому соответствует XP
    for (let i = LEVEL_REQUIREMENTS.length - 1; i >= 0; i--) {
      if (xp >= LEVEL_REQUIREMENTS[i].minXp) {
        return LEVEL_REQUIREMENTS[i].level
      }
    }
    return 1
  }

  static getLevelInfo(level: number) {
    const current = LEVEL_REQUIREMENTS.find(req => req.level === level)
    const next = LEVEL_REQUIREMENTS.find(req => req.level === level + 1)
    
    return {
      current,
      next,
      hasNext: !!next
    }
  }

  static async checkAndAwardBadges(userId: string, event: GamificationEvent) {
    const profile = await prisma.profile.findUnique({
      where: { userId },
      include: {
        userSkills: {
          include: { skill: true }
        },
        userProjects: true,
        badges: {
          include: { badge: true }
        }
      }
    })

    if (!profile) return

    const awardedBadgeNames = profile.badges.map(ub => ub.badge.name)
    const badgesToAward: string[] = []

    // Логика присвоения бейджей
    switch (event) {
      case 'PROFILE_CREATED':
        if (!awardedBadgeNames.includes('Новичок')) {
          badgesToAward.push('Новичок')
        }
        break

      case 'SKILL_ADDED':
        // Полиглот - 5+ навыков
        if (profile.userSkills.length >= 5 && !awardedBadgeNames.includes('Полиглот')) {
          badgesToAward.push('Полиглот')
        }
        break

      case 'PROJECT_ACHIEVEMENT_ADDED':
        // Архивариус - 5+ описанных проектов
        const projectsWithAchievements = profile.userProjects.filter(p => p.achievements)
        if (projectsWithAchievements.length >= 5 && !awardedBadgeNames.includes('Архивариус')) {
          badgesToAward.push('Архивариус')
        }
        // Командный игрок - 3+ проекта
        if (profile.userProjects.length >= 3 && !awardedBadgeNames.includes('Командный игрок')) {
          badgesToAward.push('Командный игрок')
        }
        break

      case 'PROFILE_UPDATED':
        // Активный участник - при обновлении профиля
        if (!awardedBadgeNames.includes('Активный участник')) {
          badgesToAward.push('Активный участник')
        }
        // Мастер профиля - профиль заполнен на 90%+
        if (profile.profileStrength >= 90 && !awardedBadgeNames.includes('Мастер профиля')) {
          badgesToAward.push('Мастер профиля')
        }
        break

      case 'SKILL_VERIFIED':
        // Ментор - подтвержденные навыки менторства
        const mentorSkills = profile.userSkills.filter(us => 
          us.skill && us.skill.name.toLowerCase().includes('ментор') && us.isVerified
        )
        if (mentorSkills.length > 0 && !awardedBadgeNames.includes('Ментор')) {
          badgesToAward.push('Ментор')
        }
        break
    }

    // Награждаем бейджами
    for (const badgeName of badgesToAward) {
      await this.awardBadge(userId, badgeName)
    }
  }

  static async awardBadge(userId: string, badgeName: string) {
    try {
      const profile = await prisma.profile.findUnique({
        where: { userId }
      })

      if (!profile) return

      // Находим бейдж
      const badge = await prisma.badge.findUnique({
        where: { name: badgeName }
      })

      if (!badge) {
        console.error(`Бейдж "${badgeName}" не найден`)
        return
      }

      // Проверяем, что бейдж еще не выдан
      const existingUserBadge = await prisma.userBadge.findUnique({
        where: {
          profileId_badgeId: {
            profileId: profile.id,
            badgeId: badge.id
          }
        }
      })

      if (existingUserBadge) return // Уже есть

      // Выдаем бейдж
      await prisma.userBadge.create({
        data: {
          profileId: profile.id,
          badgeId: badge.id
        }
      })

      // Начисляем дополнительный XP за бейдж
      if (badge.xpReward > 0) {
        await prisma.profile.update({
          where: { userId },
          data: {
            xp: { increment: badge.xpReward }
          }
        })
      }

      console.log(`🏆 Пользователь ${userId} получил бейдж "${badgeName}" (+${badge.xpReward} XP)`)

      return badge

    } catch (error) {
      console.error('Ошибка при выдаче бейджа:', error)
    }
  }

  static async getNextBestAction(userId: string): Promise<string | null> {
    const profile = await prisma.profile.findUnique({
      where: { userId },
      include: {
        userSkills: true,
        userProjects: {
          include: { project: true }
        },
        careerGoals: true
      }
    })

    if (!profile) return null

    // Логика определения следующего лучшего действия
    
    // Если нет навыков - добавить навыки
    if (profile.userSkills.length === 0) {
      return "Добавьте ваши навыки в профиль (+25 XP за каждый)"
    }

    // Если есть проекты без достижений - заполнить достижения
    const projectsWithoutAchievements = profile.userProjects.filter(p => !p.achievements)
    if (projectsWithoutAchievements.length > 0) {
      const project = projectsWithoutAchievements[0]
      return `Опишите достижения в проекте "${project.project.name}" (+150 XP)`
    }

    // Если нет карьерных целей - добавить их
    if (profile.careerGoals.length === 0) {
      return "Укажите ваши карьерные цели (+50 XP)"
    }

    // Если профиль слабо заполнен
    if (profile.profileStrength < 60) {
      return "Дополните профиль до 60% для получения бейджа 'Активный участник'"
    }

    // Если мало навыков для полиглота
    if (profile.userSkills.length < 5) {
      return `Добавьте еще ${5 - profile.userSkills.length} навыка для получения бейджа 'Полиглот'`
    }

    return "Пообщайтесь с ИИ-консультантом для персональных рекомендаций (+10 XP)"
  }
}
