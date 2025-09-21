import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { GamificationService } from '@/lib/gamification'
import { z } from 'zod'

const createGoalSchema = z.object({
  goalType: z.enum(['vertical_growth', 'horizontal_switch', 'skill_mastery', 'leadership']),
  target: z.string().min(1).max(100),
  priority: z.number().min(1).max(5)
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Необходима авторизация' }, 
        { status: 401 }
      )
    }

    const body = await request.json()
    const validation = createGoalSchema.safeParse(body)
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Некорректные данные', details: validation.error.errors },
        { status: 400 }
      )
    }

    const { goalType, target, priority } = validation.data

    // Получаем профиль пользователя
    const profile = await prisma.profile.findUnique({
      where: { userId: session.user.id }
    })

    if (!profile) {
      return NextResponse.json(
        { error: 'Профиль не найден' }, 
        { status: 404 }
      )
    }

    // Проверяем, нет ли уже такой цели
    const existingGoal = await prisma.careerGoal.findFirst({
      where: {
        profileId: profile.id,
        target: target
      }
    })

    if (existingGoal) {
      return NextResponse.json(
        { error: 'Цель с таким названием уже существует' }, 
        { status: 409 }
      )
    }

    // Создаем карьерную цель
    const careerGoal = await prisma.careerGoal.create({
      data: {
        profileId: profile.id,
        goalType,
        target,
        priority
      }
    })

    // Начисляем XP за постановку цели
    const gamificationResult = await GamificationService.awardXP(
      session.user.id, 
      'CAREER_GOAL_SET',
      1
    )

    console.log(`🎯 Пользователь ${session.user.email} поставил карьерную цель: "${target}"`)

    return NextResponse.json({ 
      success: true,
      message: `Карьерная цель "${target}" добавлена`,
      careerGoal,
      xpReward: gamificationResult?.xpAwarded || 0,
      gamification: gamificationResult
    })

  } catch (error) {
    console.error('Ошибка при создании карьерной цели:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' }, 
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Необходима авторизация' }, 
        { status: 401 }
      )
    }

    // Получаем карьерные цели пользователя
    const profile = await prisma.profile.findUnique({
      where: { userId: session.user.id },
      include: {
        careerGoals: {
          orderBy: [
            { priority: 'desc' },
            { createdAt: 'desc' }
          ]
        }
      }
    })

    if (!profile) {
      return NextResponse.json(
        { error: 'Профиль не найден' }, 
        { status: 404 }
      )
    }

    return NextResponse.json(profile.careerGoals)

  } catch (error) {
    console.error('Ошибка при получении карьерных целей:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' }, 
      { status: 500 }
    )
  }
}
