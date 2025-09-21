import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { GamificationService } from '@/lib/gamification'
import { z } from 'zod'

const addSkillSchema = z.object({
  skillId: z.string().cuid(),
  level: z.number().min(1).max(5),
  status: z.enum(['USING', 'WANTS_TO_LEARN'])
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
    const validation = addSkillSchema.safeParse(body)
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Некорректные данные', details: validation.error.errors },
        { status: 400 }
      )
    }

    const { skillId, level, status } = validation.data

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
      return NextResponse.json(
        { error: 'Этот навык уже добавлен в ваш профиль' }, 
        { status: 409 }
      )
    }

    // Добавляем навык пользователю
    const userSkill = await prisma.userSkill.create({
      data: {
        profileId: profile.id,
        skillId: skillId,
        level,
        status,
        isVerified: false
      },
      include: {
        skill: true
      }
    })

    // Начисляем XP за добавление навыка
    const xpMultiplier = status === 'USING' ? 1 : 0.5 // За цели меньше XP
    const gamificationResult = await GamificationService.awardXP(
      session.user.id, 
      'SKILL_ADDED',
      xpMultiplier
    )

    console.log(`🎯 Пользователь ${session.user.email} добавил навык "${skill.name}" (${status}, уровень ${level})`)

    return NextResponse.json({ 
      success: true,
      message: `Навык "${skill.name}" добавлен в ваш профиль`,
      userSkill,
      xpReward: gamificationResult?.xpAwarded || 0,
      gamification: gamificationResult
    })

  } catch (error) {
    console.error('Ошибка при добавлении навыка:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' }, 
      { status: 500 }
    )
  }
}
