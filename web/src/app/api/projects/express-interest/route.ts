import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Временная таблица для хранения заявок на проекты (пока нет отдельной модели)
// В реальном продакте здесь была бы отдельная таблица ProjectInterest или подобная
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

    // Проверяем существование проекта
    const project = await prisma.project.findUnique({
      where: { id: projectId }
    })

    if (!project) {
      return NextResponse.json(
        { error: 'Проект не найден' }, 
        { status: 404 }
      )
    }

    if (project.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Проект недоступен' }, 
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

    // Проверяем, не участвует ли уже в проекте
    const existingParticipation = await prisma.userProject.findUnique({
      where: {
        profileId_projectId: {
          profileId: profile.id,
          projectId: projectId
        }
      }
    })

    if (existingParticipation) {
      return NextResponse.json(
        { error: 'Вы уже участвуете в этом проекте' }, 
        { status: 409 }
      )
    }

    // В реальной системе здесь создавалась бы заявка на участие в проекте
    // Для демо мы можем создать запись в UserProject с специальным статусом
    // или использовать отдельную таблицу ProjectApplications
    
    // Временно: создаем запись с пометкой что это заявка
    const interest = await prisma.userProject.create({
      data: {
        profileId: profile.id,
        projectId: projectId,
        roleInProject: 'Заявка на участие',
        achievements: null, // Пустые достижения, так как участие еще не началось
        startDate: null,
        endDate: null
      },
      include: {
        project: true
      }
    })

    console.log(`🚀 Пользователь ${session.user.email} подал заявку на проект "${project.name}"`)

    return NextResponse.json({ 
      success: true,
      message: `Заявка на участие в проекте "${project.name}" отправлена`,
      interest
    })

  } catch (error) {
    console.error('Ошибка при подаче заявки на проект:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' }, 
      { status: 500 }
    )
  }
}
