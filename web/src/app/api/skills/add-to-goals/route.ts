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

    const { skillId } = await request.json()

    if (!skillId) {
      return NextResponse.json(
        { error: 'ID навыка обязателен' }, 
        { status: 400 }
      )
    }

    // Проверяем существование навыка
    const skill = await prisma.skill.findUnique({
      where: { id: skillId }
    })

    if (!skill) {
      return NextResponse.json(
        { error: 'Навык не найден' }, 
        { status: 404 }
      )
    }

    // Проверяем профиль пользователя
    const profile = await prisma.profile.findUnique({
      where: { userId: session.user.id }
    })

    if (!profile) {
      return NextResponse.json(
        { error: 'Профиль не найден' }, 
        { status: 404 }
      )
    }

    // Проверяем, нет ли уже такого навыка у пользователя
    const existingSkill = await prisma.userSkill.findUnique({
      where: {
        profileId_skillId: {
          profileId: profile.id,
          skillId: skillId
        }
      }
    })

    if (existingSkill) {
      // Если навык есть, но со статусом USING, меняем на WANTS_TO_LEARN не имеет смысла
      if (existingSkill.status === 'USING') {
        return NextResponse.json(
          { error: 'Этот навык уже в вашем арсенале' }, 
          { status: 409 }
        )
      } else {
        return NextResponse.json(
          { error: 'Этот навык уже в ваших целях изучения' }, 
          { status: 409 }
        )
      }
    }

    // Добавляем навык в цели изучения
    const userSkill = await prisma.userSkill.create({
      data: {
        profileId: profile.id,
        skillId: skillId,
        level: 1, // Начальный уровень
        isVerified: false,
        status: 'WANTS_TO_LEARN'
      },
      include: {
        skill: true
      }
    })

    // Начисляем XP за добавление цели изучения
    const gamificationResult = await GamificationService.awardXP(
      session.user.id, 
      'CAREER_GOAL_SET', // Используем событие для целей
      0.5 // Половина награды, так как это пока только цель
    )

    console.log(`🎯 Пользователь ${session.user.email} добавил навык "${skill.name}" в цели изучения`)

    return NextResponse.json({ 
      success: true,
      message: `Навык "${skill.name}" добавлен в ваши цели изучения`,
      userSkill,
      gamification: gamificationResult
    })

  } catch (error) {
    console.error('Ошибка при добавлении навыка в цели:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' }, 
      { status: 500 }
    )
  }
}
