import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { LeaderboardType } from '@/lib/leaderboard'

interface LeaderboardInfo {
  type: LeaderboardType
  title: string
  description: string
  icon: string
  period: string
  updateFrequency: string
}

const LEADERBOARD_CONFIGS: LeaderboardInfo[] = [
  {
    type: 'tcoins_weekly',
    title: 'T-Coins за неделю',
    description: 'Кто больше всех заработал T-Coins на этой неделе',
    icon: '🏆',
    period: 'weekly',
    updateFrequency: 'Обновляется в конце недели'
  },
  {
    type: 'tcoins_monthly',
    title: 'T-Coins за месяц',
    description: 'Топ заработчиков T-Coins в этом месяце',
    icon: '💰',
    period: 'monthly', 
    updateFrequency: 'Обновляется ежедневно'
  },
  {
    type: 'tcoins_alltime',
    title: 'T-Coins все время',
    description: 'Легенды T1 по общему количеству заработанных T-Coins',
    icon: '👑',
    period: 'all_time',
    updateFrequency: 'Обновляется каждые 24 часа'
  },
  {
    type: 'xp_weekly', 
    title: 'XP за неделю',
    description: 'Самые активные участники развития на этой неделе',
    icon: '⚡',
    period: 'weekly',
    updateFrequency: 'Обновляется в конце недели'
  },
  {
    type: 'xp_monthly',
    title: 'XP за месяц', 
    description: 'Лидеры роста и развития за месяц',
    icon: '🚀',
    period: 'monthly',
    updateFrequency: 'Обновляется ежедневно'
  },
  {
    type: 'profile_strength',
    title: 'Сила профиля',
    description: 'У кого самый полный и качественный профиль',
    icon: '💪',
    period: 'all_time',
    updateFrequency: 'Обновляется каждые 12 часов'
  },
  {
    type: 'activity_weekly',
    title: 'Активность недели',
    description: 'Самые вовлеченные пользователи платформы',
    icon: '🔥',
    period: 'weekly',
    updateFrequency: 'Обновляется в конце недели'
  }
]

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Необходима авторизация' }, 
        { status: 401 }
      )
    }

    return NextResponse.json({
      leaderboards: LEADERBOARD_CONFIGS,
      total: LEADERBOARD_CONFIGS.length,
      categories: {
        tcoins: LEADERBOARD_CONFIGS.filter(l => l.type.includes('tcoins')),
        xp: LEADERBOARD_CONFIGS.filter(l => l.type.includes('xp')),
        other: LEADERBOARD_CONFIGS.filter(l => !l.type.includes('tcoins') && !l.type.includes('xp'))
      }
    })

  } catch (error) {
    console.error('Ошибка при получении списка лидербордов:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}
