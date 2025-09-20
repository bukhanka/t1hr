import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Необходима авторизация' }, 
        { status: 401 }
      )
    }

    const { sessionId } = await params

    // Находим профиль пользователя
    const profile = await prisma.profile.findUnique({
      where: { userId: session.user.id }
    })

    if (!profile) {
      return NextResponse.json(
        { error: 'Профиль не найден' },
        { status: 404 }
      )
    }

    // Получаем сессию чата с сообщениями
    const chatSession = await prisma.chatSession.findUnique({
      where: { 
        id: sessionId,
      },
      include: { 
        messages: { 
          orderBy: { createdAt: 'asc' } 
        }
      }
    })

    if (!chatSession) {
      return NextResponse.json(
        { error: 'Сессия чата не найдена' },
        { status: 404 }
      )
    }

    // Проверяем, что сессия принадлежит пользователю
    if (chatSession.profileId !== profile.id) {
      return NextResponse.json(
        { error: 'Доступ запрещен' },
        { status: 403 }
      )
    }

    const formattedSession = {
      id: chatSession.id,
      title: chatSession.title || 'Диалог с Навигатором',
      createdAt: chatSession.createdAt.toISOString(),
      updatedAt: chatSession.updatedAt.toISOString(),
      messages: chatSession.messages.map(msg => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        createdAt: msg.createdAt.toISOString()
      }))
    }

    return NextResponse.json(formattedSession)

  } catch (error) {
    console.error('Ошибка при получении сессии чата:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}
