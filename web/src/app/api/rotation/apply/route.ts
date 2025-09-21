import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Role } from '@prisma/client'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Необходима авторизация' }, 
        { status: 401 }
      )
    }

    if (session.user.role !== Role.EMPLOYEE) {
      return NextResponse.json(
        { error: 'Доступ запрещен. Только сотрудники могут подавать заявки на ротацию.' }, 
        { status: 403 }
      )
    }

    const { reason } = await request.json()

    // Проверяем профиль пользователя
    const profile = await prisma.profile.findUnique({
      where: { userId: session.user.id },
      include: {
        rotationApplication: true
      }
    })

    if (!profile) {
      return NextResponse.json(
        { error: 'Профиль не найден' }, 
        { status: 404 }
      )
    }

    // Проверяем, не подал ли уже заявку
    if (profile.rotationApplication) {
      const status = profile.rotationApplication.status
      if (status === 'PENDING') {
        return NextResponse.json(
          { error: 'У вас уже есть активная заявка на ротацию' }, 
          { status: 409 }
        )
      }
      if (status === 'APPROVED') {
        return NextResponse.json(
          { error: 'Вы уже участвуете в программе ротации' }, 
          { status: 409 }
        )
      }
    }

    // Проверяем, не участвует ли уже в ротации
    if (profile.rotationStatus === 'ROTATION') {
      return NextResponse.json(
        { error: 'Вы уже участвуете в программе ротации' }, 
        { status: 409 }
      )
    }

    // Создаем заявку на ротацию
    const application = await prisma.rotationApplication.create({
      data: {
        profileId: profile.id,
        reason: reason || 'Хочу участвовать в программе ротации для профессионального развития'
      },
      include: {
        profile: {
          include: {
            user: true
          }
        }
      }
    })

    console.log(`🔄 Сотрудник ${session.user.email} подал заявку на ротацию`)

    return NextResponse.json({ 
      success: true,
      message: 'Заявка на ротацию успешно подана',
      application: {
        id: application.id,
        status: application.status,
        reason: application.reason,
        createdAt: application.createdAt
      }
    })

  } catch (error) {
    console.error('Ошибка при подаче заявки на ротацию:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' }, 
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Необходима авторизация' }, 
        { status: 401 }
      )
    }

    if (session.user.role !== Role.EMPLOYEE) {
      return NextResponse.json(
        { error: 'Доступ запрещен' }, 
        { status: 403 }
      )
    }

    // Получаем заявку пользователя
    const profile = await prisma.profile.findUnique({
      where: { userId: session.user.id },
      include: {
        rotationApplication: {
          include: {
            reviewer: true
          }
        }
      }
    })

    if (!profile) {
      return NextResponse.json(
        { error: 'Профиль не найден' }, 
        { status: 404 }
      )
    }

    return NextResponse.json({
      application: profile.rotationApplication,
      currentRotationStatus: profile.rotationStatus
    })

  } catch (error) {
    console.error('Ошибка при получении заявки на ротацию:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' }, 
      { status: 500 }
    )
  }
}
