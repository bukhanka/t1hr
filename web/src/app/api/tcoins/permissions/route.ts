import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
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

    // Проверяем, что пользователь - HR
    if (session.user.role !== Role.HR) {
      return NextResponse.json(
        { error: 'Недостаточно прав для выполнения операции' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { managerId, projectId, maxAmount, dailyLimit } = body

    // Валидация данных
    if (!managerId || !maxAmount || !dailyLimit) {
      return NextResponse.json(
        { error: 'Обязательные поля: managerId, maxAmount, dailyLimit' },
        { status: 400 }
      )
    }

    if (maxAmount < 1 || maxAmount > 1000) {
      return NextResponse.json(
        { error: 'Максимальное количество должно быть от 1 до 1000' },
        { status: 400 }
      )
    }

    if (dailyLimit < 1 || dailyLimit > 5000) {
      return NextResponse.json(
        { error: 'Дневной лимит должен быть от 1 до 5000' },
        { status: 400 }
      )
    }

    // Проверяем, что менеджер существует и является проектным менеджером
    const manager = await prisma.profile.findFirst({
      where: {
        id: managerId,
        user: { role: Role.PROJECT_MANAGER }
      },
      include: { user: { select: { name: true, email: true } } }
    })

    if (!manager) {
      return NextResponse.json(
        { error: 'Проектный менеджер не найден' },
        { status: 404 }
      )
    }

    // Если указан проект, проверяем что он существует
    if (projectId) {
      const project = await prisma.project.findUnique({
        where: { id: projectId }
      })

      if (!project) {
        return NextResponse.json(
          { error: 'Проект не найден' },
          { status: 404 }
        )
      }
    }

    // Проверяем, что такое разрешение еще не существует
    const existingPermission = await prisma.tCoinAwardPermission.findUnique({
      where: {
        managerId_projectId: {
          managerId: managerId,
          projectId: projectId || null
        }
      }
    })

    if (existingPermission) {
      return NextResponse.json(
        { error: 'Разрешение для этого менеджера и проекта уже существует' },
        { status: 409 }
      )
    }

    // Создаем разрешение
    const permission = await prisma.tCoinAwardPermission.create({
      data: {
        managerId,
        projectId: projectId || null,
        maxAmount,
        dailyLimit,
        isActive: true
      },
      include: {
        manager: {
          include: { user: { select: { name: true, email: true } } }
        },
        project: { select: { name: true } }
      }
    })

    return NextResponse.json({
      success: true,
      permission: {
        id: permission.id,
        manager: {
          name: permission.manager.user.name,
          email: permission.manager.user.email
        },
        project: permission.project?.name || 'Все проекты',
        maxAmount: permission.maxAmount,
        dailyLimit: permission.dailyLimit
      }
    })

  } catch (error) {
    console.error('Error creating T-coin permission:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}
