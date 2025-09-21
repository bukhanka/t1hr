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

    const { courseId } = await request.json()

    if (!courseId) {
      return NextResponse.json(
        { error: 'ID курса обязателен' }, 
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

    // Находим запись о курсе
    const enrollment = await prisma.userCourse.findUnique({
      where: {
        profileId_courseId: {
          profileId: profile.id,
          courseId: courseId
        }
      },
      include: {
        course: true
      }
    })

    if (!enrollment) {
      return NextResponse.json(
        { error: 'Вы не записаны на этот курс' }, 
        { status: 404 }
      )
    }

    // Проверяем, можно ли отозвать заявку
    if (enrollment.status === 'COMPLETED') {
      return NextResponse.json(
        { error: 'Нельзя отозвать заявку на завершенный курс' }, 
        { status: 400 }
      )
    }

    // Удаляем запись о курсе
    await prisma.userCourse.delete({
      where: {
        profileId_courseId: {
          profileId: profile.id,
          courseId: courseId
        }
      }
    })

    console.log(`📚 Пользователь ${session.user.email} отозвал заявку на курс "${enrollment.course.title}"`)

    return NextResponse.json({ 
      success: true,
      message: `Заявка на курс "${enrollment.course.title}" отозвана`
    })

  } catch (error) {
    console.error('Ошибка при отзыве заявки на курс:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' }, 
      { status: 500 }
    )
  }
}
