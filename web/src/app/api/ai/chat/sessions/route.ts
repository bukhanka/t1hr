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

    // Находим профиль пользователя
    const profile = await prisma.profile.findUnique({
      where: { userId: session.user.id }
    })

    if (!profile) {
      return NextResponse.json([]) // Возвращаем пустой массив если профиля нет
    }

    // Получаем последние сессии чата пользователя
    const chatSessions = await prisma.chatSession.findMany({
      where: { profileId: profile.id },
      include: {
        _count: {
          select: { messages: true }
        }
      },
      orderBy: { updatedAt: 'desc' },
      take: 10
    })

    const formattedSessions = chatSessions.map((session: any) => ({
      id: session.id,
      title: session.title || 'Диалог с Навигатором',
      createdAt: session.createdAt.toISOString(),
      updatedAt: session.updatedAt.toISOString(),
      messageCount: session._count.messages
    }))

    return NextResponse.json(formattedSessions)

  } catch (error) {
    console.error('Ошибка при получении сессий чата:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}
