import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

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

    // Находим навык в целях (со статусом WANTS_TO_LEARN)
    const userSkill = await prisma.userSkill.findFirst({
      where: {
        profileId: profile.id,
        skillId: skillId,
        status: 'WANTS_TO_LEARN'
      },
      include: {
        skill: true
      }
    })

    if (!userSkill) {
      return NextResponse.json(
        { error: 'Навык не добавлен в цели' }, 
        { status: 404 }
      )
    }

    // Удаляем навык из целей
    await prisma.userSkill.delete({
      where: {
        id: userSkill.id
      }
    })

    console.log(`🎯 Пользователь ${session.user.email} удалил навык "${userSkill.skill.name}" из целей`)

    return NextResponse.json({ 
      success: true,
      message: `Навык "${userSkill.skill.name}" удален из целей`
    })

  } catch (error) {
    console.error('Ошибка при удалении навыка из целей:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' }, 
      { status: 500 }
    )
  }
}
