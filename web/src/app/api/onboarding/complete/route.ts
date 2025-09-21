import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { GamificationService } from '@/lib/gamification'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Необходима авторизация' }, 
        { status: 401 }
      )
    }

    const { sessionId } = await request.json()

    // Проверяем существование сессии онбординга
    const chatSession = await prisma.chatSession.findUnique({
      where: { id: sessionId },
      include: { profile: true }
    })

    if (!chatSession) {
      return NextResponse.json(
        { error: 'Сессия онбординга не найдена' },
        { status: 404 }
      )
    }

    // Проверяем, что пользователь является владельцем сессии
    if (chatSession.profile.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Доступ запрещен' },
        { status: 403 }
      )
    }

    // Получаем текущий профиль
    const profile = await prisma.profile.findUnique({
      where: { userId: session.user.id },
      include: {
        userSkills: { include: { skill: true } }
      }
    })

    if (!profile) {
      return NextResponse.json(
        { error: 'Профиль не найден' },
        { status: 404 }
      )
    }

    // Если онбординг уже завершен, возвращаем успех
    if (profile.onboardingCompleted) {
      return NextResponse.json({
        success: true,
        alreadyCompleted: true,
        profile: {
          onboardingCompleted: profile.onboardingCompleted,
          profileStrength: profile.profileStrength,
          tCoins: profile.tCoins
        }
      })
    }

    // Отмечаем онбординг как завершенный и начисляем награды
    const updatedProfile = await prisma.profile.update({
      where: { userId: session.user.id },
      data: {
        onboardingCompleted: true,
        onboardingCompletedAt: new Date(),
        profileStrength: Math.max(profile.profileStrength, 60), // Мин. 60% после онбординга
        tCoins: profile.tCoins + 200 // Бонус за завершение онбординга
      }
    })

    // Начисляем дополнительные XP за завершение онбординга
    await GamificationService.awardXP(session.user.id, 'PROFILE_UPDATED', 1)

    // Обновляем статус сессии
    await prisma.chatSession.update({
      where: { id: sessionId },
      data: {
        title: "🎉 Онбординг завершен"
      }
    })

    return NextResponse.json({
      success: true,
      rewards: {
        tCoinsEarned: 200,
        profileBonus: updatedProfile.profileStrength - profile.profileStrength,
        xpEarned: 25
      },
      profile: {
        onboardingCompleted: updatedProfile.onboardingCompleted,
        profileStrength: updatedProfile.profileStrength,
        tCoins: updatedProfile.tCoins,
        level: updatedProfile.level,
        xp: updatedProfile.xp
      }
    })

  } catch (error) {
    console.error('Ошибка при завершении онбординга:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}
