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
        { error: 'Доступ запрещен. Только сотрудники могут отзывать заявки.' }, 
        { status: 403 }
      )
    }

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

    if (!profile.rotationApplication) {
      return NextResponse.json(
        { error: 'У вас нет активной заявки на ротацию' }, 
        { status: 404 }
      )
    }

    if (profile.rotationApplication.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Можно отозвать только заявки со статусом "Ожидает рассмотрения"' }, 
        { status: 400 }
      )
    }

    // Обновляем статус заявки на WITHDRAWN
    const updatedApplication = await prisma.rotationApplication.update({
      where: { id: profile.rotationApplication.id },
      data: {
        status: 'WITHDRAWN',
        updatedAt: new Date()
      }
    })

    console.log(`🔄 Сотрудник ${session.user.email} отозвал заявку на ротацию`)

    return NextResponse.json({ 
      success: true,
      message: 'Заявка на ротацию успешно отозвана',
      application: {
        id: updatedApplication.id,
        status: updatedApplication.status,
        updatedAt: updatedApplication.updatedAt
      }
    })

  } catch (error) {
    console.error('Ошибка при отзыве заявки на ротацию:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' }, 
      { status: 500 }
    )
  }
}
