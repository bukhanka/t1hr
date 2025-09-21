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

    // Получаем полный профиль пользователя
    const profile = await prisma.profile.findUnique({
      where: { userId: session.user.id },
      include: {
        userSkills: {
          include: { skill: true },
          orderBy: { skill: { name: 'asc' } }
        },
        userProjects: {
          include: { project: true },
          orderBy: { updatedAt: 'desc' }
        },
        careerGoals: {
          orderBy: { priority: 'desc' }
        },
        badges: {
          include: { badge: true },
          orderBy: { awardedAt: 'desc' },
          take: 10
        }
      }
    })

    if (!profile) {
      return NextResponse.json(
        { error: 'Профиль не найден' }, 
        { status: 404 }
      )
    }

    return NextResponse.json(profile)

  } catch (error) {
    console.error('Ошибка при получении профиля:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' }, 
      { status: 500 }
    )
  }
}
