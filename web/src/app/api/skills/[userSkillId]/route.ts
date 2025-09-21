import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateSkillSchema = z.object({
  level: z.number().min(1).max(5).optional(),
  status: z.enum(['USING', 'WANTS_TO_LEARN']).optional(),
  isVerified: z.boolean().optional()
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ userSkillId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Необходима авторизация' }, 
        { status: 401 }
      )
    }

    const { userSkillId } = await params
    const body = await request.json()
    const validation = updateSkillSchema.safeParse(body)
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Некорректные данные', details: validation.error.errors },
        { status: 400 }
      )
    }

    // Проверяем, что навык принадлежит текущему пользователю
    const userSkill = await prisma.userSkill.findUnique({
      where: { id: userSkillId },
      include: {
        profile: true,
        skill: true
      }
    })

    if (!userSkill || userSkill.profile.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Навык не найден или не принадлежит вам' }, 
        { status: 404 }
      )
    }

    // Обновляем навык
    const updatedSkill = await prisma.userSkill.update({
      where: { id: userSkillId },
      data: validation.data,
      include: {
        skill: true
      }
    })

    console.log(`🔄 Обновлен навык "${updatedSkill.skill.name}" пользователем ${session.user.email}`)

    return NextResponse.json({ 
      success: true,
      message: 'Навык обновлен',
      userSkill: updatedSkill
    })

  } catch (error) {
    console.error('Ошибка при обновлении навыка:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' }, 
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ userSkillId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Необходима авторизация' }, 
        { status: 401 }
      )
    }

    const { userSkillId } = await params

    // Проверяем, что навык принадлежит текущему пользователю
    const userSkill = await prisma.userSkill.findUnique({
      where: { id: userSkillId },
      include: {
        profile: true,
        skill: true
      }
    })

    if (!userSkill || userSkill.profile.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Навык не найден или не принадлежит вам' }, 
        { status: 404 }
      )
    }

    // Удаляем навык
    await prisma.userSkill.delete({
      where: { id: userSkillId }
    })

    console.log(`🗑️ Удален навык "${userSkill.skill.name}" пользователем ${session.user.email}`)

    return NextResponse.json({ 
      success: true,
      message: 'Навык удален из профиля'
    })

  } catch (error) {
    console.error('Ошибка при удалении навыка:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' }, 
      { status: 500 }
    )
  }
}
