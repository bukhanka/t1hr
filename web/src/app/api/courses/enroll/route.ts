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

    const { courseId } = await request.json()

    if (!courseId) {
      return NextResponse.json(
        { error: 'ID курса обязателен' }, 
        { status: 400 }
      )
    }

    // Проверяем существование курса
    const course = await prisma.course.findUnique({
      where: { id: courseId }
    })

    if (!course) {
      return NextResponse.json(
        { error: 'Курс не найден' }, 
        { status: 404 }
      )
    }

    if (course.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Курс недоступен для записи' }, 
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

    // Проверяем, не записан ли уже на курс
    const existingEnrollment = await prisma.userCourse.findUnique({
      where: {
        profileId_courseId: {
          profileId: profile.id,
          courseId: courseId
        }
      }
    })

    if (existingEnrollment) {
      return NextResponse.json(
        { error: 'Вы уже записаны на этот курс' }, 
        { status: 409 }
      )
    }

    // Записываем на курс
    const enrollment = await prisma.userCourse.create({
      data: {
        profileId: profile.id,
        courseId: courseId,
        status: 'PLANNED',
        progress: 0
      },
      include: {
        course: true
      }
    })

    // Начисляем XP за запись на курс
    const gamificationResult = await GamificationService.awardXP(
      session.user.id, 
      'SKILL_ADDED', // Используем существующий тип события
      0.5 // Половина от обычной награды, так как это только запись
    )

    console.log(`📚 Пользователь ${session.user.email} записался на курс "${course.title}"`)

    return NextResponse.json({ 
      success: true,
      message: `Вы успешно записаны на курс "${course.title}"`,
      enrollment,
      gamification: gamificationResult
    })

  } catch (error) {
    console.error('Ошибка при записи на курс:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' }, 
      { status: 500 }
    )
  }
}
