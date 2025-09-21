import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { GamificationService } from '@/lib/gamification'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Необходима авторизация' }, 
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')

    const history = await GamificationService.getTCoinHistory(session.user.id, limit)

    return NextResponse.json({
      transactions: history,
      total: history.length
    })

  } catch (error) {
    console.error('Ошибка при получении истории T-Coins:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}
