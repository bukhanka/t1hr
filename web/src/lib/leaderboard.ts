import { prisma } from './prisma'

export type LeaderboardType = 
  | 'tcoins_weekly'
  | 'tcoins_monthly' 
  | 'tcoins_alltime'
  | 'xp_weekly'
  | 'xp_monthly'
  | 'profile_strength'
  | 'activity_weekly'

export interface LeaderboardEntry {
  position: number
  profileId: string
  userId: string
  name: string
  score: number
  avatar?: string
  department?: string
  level?: number
  badge?: string
  change?: 'up' | 'down' | 'same' | null // Изменение позиции с прошлого периода
}

export interface LeaderboardData {
  type: LeaderboardType
  period: string
  entries: LeaderboardEntry[]
  totalParticipants: number
  generatedAt: Date
  validUntil: Date
}

export class LeaderboardService {
  
  // Получить лидерборд (с кэшированием)
  static async getLeaderboard(type: LeaderboardType): Promise<LeaderboardData | null> {
    // Сначала проверяем кэш
    const cached = await prisma.leaderboard.findFirst({
      where: { 
        type,
        validUntil: { gt: new Date() } // Еще не истек
      },
      orderBy: { generatedAt: 'desc' }
    })

    if (cached) {
      return {
        type: type,
        period: cached.period,
        entries: cached.data as unknown as LeaderboardEntry[],
        totalParticipants: (cached.data as unknown as LeaderboardEntry[]).length,
        generatedAt: cached.generatedAt,
        validUntil: cached.validUntil || new Date()
      }
    }

    // Генерируем новый лидерборд
    return await this.generateLeaderboard(type)
  }

  // Генерировать новый лидерборд
  static async generateLeaderboard(type: LeaderboardType): Promise<LeaderboardData | null> {
    try {
      let entries: LeaderboardEntry[] = []
      let period = 'all_time'
      let validUntil = new Date()
      
      switch (type) {
        case 'tcoins_weekly':
          entries = await this.generateTCoinsWeeklyLeaderboard()
          period = 'weekly'
          validUntil = this.getWeekEnd()
          break
          
        case 'tcoins_monthly':
          entries = await this.generateTCoinsMonthlyLeaderboard()
          period = 'monthly'
          validUntil = this.getMonthEnd()
          break
          
        case 'tcoins_alltime':
          entries = await this.generateTCoinsAllTimeLeaderboard()
          period = 'all_time'
          validUntil = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 часа
          break
          
        case 'xp_weekly':
          entries = await this.generateXPWeeklyLeaderboard()
          period = 'weekly'
          validUntil = this.getWeekEnd()
          break
          
        case 'xp_monthly':
          entries = await this.generateXPMonthlyLeaderboard()
          period = 'monthly'
          validUntil = this.getMonthEnd()
          break
          
        case 'profile_strength':
          entries = await this.generateProfileStrengthLeaderboard()
          period = 'all_time'
          validUntil = new Date(Date.now() + 12 * 60 * 60 * 1000) // 12 часов
          break
          
        case 'activity_weekly':
          entries = await this.generateActivityWeeklyLeaderboard()
          period = 'weekly'
          validUntil = this.getWeekEnd()
          break
          
        default:
          throw new Error(`Неподдерживаемый тип лидерборда: ${type}`)
      }

      // Сохраняем в кэш
      await prisma.leaderboard.create({
        data: {
          type,
          period,
          data: entries as any,
          generatedAt: new Date(),
          validUntil
        }
      })

      return {
        type,
        period,
        entries,
        totalParticipants: entries.length,
        generatedAt: new Date(),
        validUntil
      }

    } catch (error) {
      console.error('Ошибка генерации лидерборда:', error)
      return null
    }
  }

  // T-Coins за неделю
  private static async generateTCoinsWeeklyLeaderboard(): Promise<LeaderboardEntry[]> {
    const weekStart = this.getWeekStart()
    
    const results = await prisma.profile.findMany({
      where: {
        tcoinTransactions: {
          some: {
            createdAt: { gte: weekStart },
            type: 'earned'
          }
        }
      },
      include: {
        user: true,
        tcoinTransactions: {
          where: {
            createdAt: { gte: weekStart },
            type: 'earned'
          }
        }
      }
    })

    return results
      .map(profile => {
        const weeklyEarnings = profile.tcoinTransactions.reduce((sum, t) => sum + t.amount, 0)
        return {
          position: 0,
          profileId: profile.id,
          userId: profile.userId,
          name: profile.user.name || 'Пользователь',
          score: weeklyEarnings,
          avatar: profile.user.image || undefined,
          department: profile.department || undefined,
          level: profile.level
        }
      })
      .filter(entry => entry.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((entry, index) => ({ ...entry, position: index + 1 }))
      .slice(0, 50) // Топ-50
  }

  // T-Coins за месяц
  private static async generateTCoinsMonthlyLeaderboard(): Promise<LeaderboardEntry[]> {
    const monthStart = this.getMonthStart()
    
    const results = await prisma.profile.findMany({
      where: {
        tcoinTransactions: {
          some: {
            createdAt: { gte: monthStart },
            type: 'earned'
          }
        }
      },
      include: {
        user: true,
        tcoinTransactions: {
          where: {
            createdAt: { gte: monthStart },
            type: 'earned'
          }
        }
      }
    })

    return results
      .map(profile => {
        const monthlyEarnings = profile.tcoinTransactions.reduce((sum, t) => sum + t.amount, 0)
        return {
          position: 0,
          profileId: profile.id,
          userId: profile.userId,
          name: profile.user.name || 'Пользователь',
          score: monthlyEarnings,
          avatar: profile.user.image || undefined,
          department: profile.department || undefined,
          level: profile.level
        }
      })
      .filter(entry => entry.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((entry, index) => ({ ...entry, position: index + 1 }))
      .slice(0, 100) // Топ-100
  }

  // Все T-Coins
  private static async generateTCoinsAllTimeLeaderboard(): Promise<LeaderboardEntry[]> {
    const results = await prisma.profile.findMany({
      where: {
        totalEarned: { gt: 0 }
      },
      include: {
        user: true
      }
    })

    return results
      .map(profile => ({
        position: 0,
        profileId: profile.id,
        userId: profile.userId,
        name: profile.user.name || 'Пользователь',
        score: profile.totalEarned,
        avatar: profile.user.image || undefined,
        department: profile.department || undefined,
        level: profile.level
      }))
      .sort((a, b) => b.score - a.score)
      .map((entry, index) => ({ ...entry, position: index + 1 }))
      .slice(0, 100)
  }

  // XP за неделю  
  private static async generateXPWeeklyLeaderboard(): Promise<LeaderboardEntry[]> {
    const weekStart = this.getWeekStart()
    
    // Получаем профили пользователей, которые получали XP на этой неделе
    // Для простоты используем общий XP, в реальности можно отслеживать по транзакциям
    const results = await prisma.profile.findMany({
      where: {
        updatedAt: { gte: weekStart },
        xp: { gt: 0 }
      },
      include: {
        user: true
      },
      orderBy: { xp: 'desc' },
      take: 50
    })

    return results.map((profile, index) => ({
      position: index + 1,
      profileId: profile.id,
      userId: profile.userId,
      name: profile.user.name || 'Пользователь',
      score: profile.xp, // В реальности здесь был бы XP за неделю
      avatar: profile.user.image || undefined,
      department: profile.department || undefined,
      level: profile.level
    }))
  }

  // XP за месяц
  private static async generateXPMonthlyLeaderboard(): Promise<LeaderboardEntry[]> {
    const monthStart = this.getMonthStart()
    
    const results = await prisma.profile.findMany({
      where: {
        updatedAt: { gte: monthStart },
        xp: { gt: 0 }
      },
      include: {
        user: true
      },
      orderBy: { xp: 'desc' },
      take: 100
    })

    return results.map((profile, index) => ({
      position: index + 1,
      profileId: profile.id,
      userId: profile.userId,
      name: profile.user.name || 'Пользователь',
      score: profile.xp,
      avatar: profile.user.image || undefined,
      department: profile.department || undefined,
      level: profile.level
    }))
  }

  // Сила профиля
  private static async generateProfileStrengthLeaderboard(): Promise<LeaderboardEntry[]> {
    const results = await prisma.profile.findMany({
      where: {
        profileStrength: { gt: 0 }
      },
      include: {
        user: true
      },
      orderBy: { profileStrength: 'desc' },
      take: 50
    })

    return results.map((profile, index) => ({
      position: index + 1,
      profileId: profile.id,
      userId: profile.userId,
      name: profile.user.name || 'Пользователь',
      score: profile.profileStrength,
      avatar: profile.user.image || undefined,
      department: profile.department || undefined,
      level: profile.level,
      badge: profile.profileStrength >= 90 ? '🏆' : profile.profileStrength >= 70 ? '🥈' : profile.profileStrength >= 50 ? '🥉' : undefined
    }))
  }

  // Активность за неделю
  private static async generateActivityWeeklyLeaderboard(): Promise<LeaderboardEntry[]> {
    const weekStart = this.getWeekStart()
    
    // Подсчитываем активность на основе обновлений профиля и транзакций
    const results = await prisma.profile.findMany({
      where: {
        OR: [
          { updatedAt: { gte: weekStart } },
          { 
            tcoinTransactions: {
              some: { createdAt: { gte: weekStart } }
            }
          }
        ]
      },
      include: {
        user: true,
        tcoinTransactions: {
          where: { createdAt: { gte: weekStart } }
        }
      }
    })

    return results
      .map(profile => {
        // Простая метрика активности: кол-во транзакций + бонус за обновление профиля
        const activityScore = profile.tcoinTransactions.length + 
          (profile.updatedAt >= weekStart ? 5 : 0)
        
        return {
          position: 0,
          profileId: profile.id,
          userId: profile.userId,
          name: profile.user.name || 'Пользователь',
          score: activityScore,
          avatar: profile.user.image || undefined,
          department: profile.department || undefined,
          level: profile.level
        }
      })
      .filter(entry => entry.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((entry, index) => ({ ...entry, position: index + 1 }))
      .slice(0, 50)
  }

  // Вспомогательные функции для дат
  private static getWeekStart(): Date {
    const now = new Date()
    const day = now.getDay()
    const diff = now.getDate() - day + (day === 0 ? -6 : 1) // Понедельник
    return new Date(now.setDate(diff))
  }

  private static getWeekEnd(): Date {
    const weekStart = this.getWeekStart()
    return new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000)
  }

  private static getMonthStart(): Date {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1)
  }

  private static getMonthEnd(): Date {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth() + 1, 0)
  }

  // Очистка устаревших лидербордов
  static async cleanupExpiredLeaderboards(): Promise<void> {
    await prisma.leaderboard.deleteMany({
      where: {
        validUntil: { lt: new Date() }
      }
    })
  }
}
