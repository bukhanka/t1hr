import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { LeaderboardService, LeaderboardType } from '@/lib/leaderboard'

const VALID_TYPES: LeaderboardType[] = [
  'tcoins_weekly',
  'tcoins_monthly', 
  'tcoins_alltime',
  'xp_weekly',
  'xp_monthly',
  'profile_strength',
  'activity_weekly'
]

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ type: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Необходима авторизация' }, 
        { status: 401 }
      )
    }

    const { type } = await params
    
    if (!VALID_TYPES.includes(type as LeaderboardType)) {
      return NextResponse.json(
        { error: 'Неподдерживаемый тип лидерборда', validTypes: VALID_TYPES },
        { status: 400 }
      )
    }

    const { searchParams } = new URL(request.url)
    const forceRefresh = searchParams.get('refresh') === 'true'

    let leaderboard
    
    if (forceRefresh) {
      // Принудительно генерируем новый лидерборд
      leaderboard = await LeaderboardService.generateLeaderboard(type as LeaderboardType)
    } else {
      // Используем кэшированный или генерируем новый
      leaderboard = await LeaderboardService.getLeaderboard(type as LeaderboardType)
    }

    if (!leaderboard) {
      return NextResponse.json(
        { error: 'Не удалось сгенерировать лидерборд' },
        { status: 500 }
      )
    }

    // Находим позицию текущего пользователя
    const currentUserPosition = leaderboard.entries.find(entry => entry.userId === session.user.id)
    
    return NextResponse.json({
      ...leaderboard,
      currentUser: currentUserPosition || null,
      metadata: {
        cacheHit: !forceRefresh && leaderboard.generatedAt < new Date(Date.now() - 60000), // Старше минуты = из кэша
        nextUpdate: leaderboard.validUntil,
        refreshUrl: `${request.url}${request.url.includes('?') ? '&' : '?'}refresh=true`
      }
    })

  } catch (error) {
    console.error('Ошибка при получении лидерборда:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}
