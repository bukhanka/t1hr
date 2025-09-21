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

    // Проверяем, не добавлен ли уже навык в цели
    const existingSkill = await prisma.userSkill.findFirst({
      where: {
        profileId: profile.id,
        skillId: skillId
      }
    })

    if (existingSkill) {
      return NextResponse.json(
        { error: 'Навык уже добавлен в цели' }, 
        { status: 409 }
      )
    }

    // Добавляем навык в цели (со статусом WANTS_TO_LEARN)
    const userSkill = await prisma.userSkill.create({
      data: {
        profileId: profile.id,
        skillId: skillId,
        level: 1, // Начальный уровень для навыка в целях
        status: 'WANTS_TO_LEARN'
      },
      include: {
        skill: true
      }
    })

    // Начисляем XP за добавление навыка в цели
    const gamificationResult = await GamificationService.awardXP(
      session.user.id, 
      'SKILL_ADDED',
      1
    )

    console.log(`🎯 Пользователь ${session.user.email} добавил навык "${skill.name}" в цели`)

    return NextResponse.json({ 
      success: true,
      message: `Навык "${skill.name}" добавлен в цели`,
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