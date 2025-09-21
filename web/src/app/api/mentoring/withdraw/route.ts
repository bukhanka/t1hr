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

    const { programId } = await request.json()

    if (!programId) {
      return NextResponse.json(
        { error: 'ID программы обязателен' }, 
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

    // Находим запись о менторской программе
    const application = await prisma.userMentorProgram.findFirst({
      where: {
        profileId: profile.id,
        programId: programId
      },
      include: {
        program: true
      }
    })

    if (!application) {
      return NextResponse.json(
        { error: 'Вы не подавали заявку на эту программу' }, 
        { status: 404 }
      )
    }

    // Проверяем, можно ли отозвать заявку
    if (application.status === 'ACCEPTED' || application.status === 'COMPLETED') {
      return NextResponse.json(
        { error: 'Нельзя отозвать принятую или завершенную заявку' }, 
        { status: 400 }
      )
    }

    // Удаляем заявку
    await prisma.userMentorProgram.delete({
      where: {
        id: application.id
      }
    })

    console.log(`👥 Пользователь ${session.user.email} отозвал заявку на менторскую программу "${application.program.title}"`)

    return NextResponse.json({ 
      success: true,
      message: `Заявка на программу "${application.program.title}" отозвана`
    })

  } catch (error) {
    console.error('Ошибка при отзыве заявки на менторство:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' }, 
      { status: 500 }
    )
  }
}
