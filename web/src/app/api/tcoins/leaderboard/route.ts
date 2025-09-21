import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

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
    const period = searchParams.get('period') || 'weekly' // weekly, monthly, all_time
    const limit = parseInt(searchParams.get('limit') || '10')

    // Определяем временные рамки
    const now = new Date()
    let dateFilter: Date | undefined

    switch (period) {
      case 'weekly':
        dateFilter = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case 'monthly':
        dateFilter = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      case 'all_time':
      default:
        dateFilter = undefined
    }

    let leaderboardData

    if (period === 'all_time') {
      // Лидерборд по общему количеству T-Coins
      leaderboardData = await prisma.profile.findMany({
        select: {
          id: true,
          tCoins: true,
          totalEarned: true,
          user: {
            select: {
              name: true,
              image: true
            }
          },
          jobTitle: true,
          department: true
        },
        orderBy: { totalEarned: 'desc' },
        take: limit
      })

      const formattedData = leaderboardData.map((profile, index) => ({
        position: index + 1,
        profileId: profile.id,
        name: profile.user.name || 'Аноним',
        avatar: profile.user.image,
        jobTitle: profile.jobTitle,
        department: profile.department,
        score: profile.totalEarned,
        current: profile.tCoins,
        type: 'total_earned'
      }))

      return NextResponse.json({
        period,
        data: formattedData,
        total: formattedData.length,
        generatedAt: new Date()
      })

    } else {
      // Лидерборд по заработанным T-Coins за период
      const transactions = await prisma.tCoinTransaction.findMany({
        where: {
          type: 'earned',
          ...(dateFilter ? { createdAt: { gte: dateFilter } } : {})
        },
        include: {
          profile: {
            select: {
              id: true,
              user: {
                select: {
                  name: true,
                  image: true
                }
              },
              jobTitle: true,
              department: true
            }
          }
        }
      })

      // Группируем по профилям и считаем сумму
      const profileEarnings = new Map()

      transactions.forEach(transaction => {
        const profileId = transaction.profile.id
        if (!profileEarnings.has(profileId)) {
          profileEarnings.set(profileId, {
            profileId,
            name: transaction.profile.user.name || 'Аноним',
            avatar: transaction.profile.user.image,
            jobTitle: transaction.profile.jobTitle,
            department: transaction.profile.department,
            score: 0,
            type: `earned_${period}`
          })
        }
        
        const profile = profileEarnings.get(profileId)
        profile.score += transaction.amount
      })

      // Сортируем и ограничиваем
      const sortedData = Array.from(profileEarnings.values())
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map((profile, index) => ({
          ...profile,
          position: index + 1
        }))

      return NextResponse.json({
        period,
        data: sortedData,
        total: sortedData.length,
        generatedAt: new Date()
      })
    }

  } catch (error) {
    console.error('Ошибка при получении лидерборда T-Coins:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}
