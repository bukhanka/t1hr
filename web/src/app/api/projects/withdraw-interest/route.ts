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

    const { projectId } = await request.json()

    if (!projectId) {
      return NextResponse.json(
        { error: 'ID проекта обязателен' }, 
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

    // Находим запись о проекте
    const userProject = await prisma.userProject.findFirst({
      where: {
        profileId: profile.id,
        projectId: projectId
      },
      include: {
        project: true
      }
    })

    if (!userProject) {
      return NextResponse.json(
        { error: 'Вы не выражали интерес к этому проекту' }, 
        { status: 404 }
      )
    }

    // Проверяем, можно ли отозвать интерес
    if (userProject.project.status === 'COMPLETED' || userProject.project.status === 'ARCHIVED') {
      return NextResponse.json(
        { error: 'Нельзя отозвать интерес к завершенному или архивированному проекту' }, 
        { status: 400 }
      )
    }

    // Удаляем запись о проекте
    await prisma.userProject.delete({
      where: {
        id: userProject.id
      }
    })

    console.log(`🚀 Пользователь ${session.user.email} отозвал интерес к проекту "${userProject.project.name}"`)

    return NextResponse.json({ 
      success: true,
      message: `Интерес к проекту "${userProject.project.name}" отозван`
    })

  } catch (error) {
    console.error('Ошибка при отзыве интереса к проекту:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' }, 
      { status: 500 }
    )
  }
}
