import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Role } from '@prisma/client'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ permissionId: string }> }
) {
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

    const { permissionId } = await params

    if (!permissionId) {
      return NextResponse.json(
        { error: 'ID разрешения обязателен' },
        { status: 400 }
      )
    }

    // Проверяем, что разрешение существует
    const permission = await prisma.tCoinAwardPermission.findUnique({
      where: { id: permissionId },
      include: {
        manager: {
          include: { user: { select: { name: true, email: true } } }
        },
        project: { select: { name: true } }
      }
    })

    if (!permission) {
      return NextResponse.json(
        { error: 'Разрешение не найдено' },
        { status: 404 }
      )
    }

    // Удаляем разрешение
    await prisma.tCoinAwardPermission.delete({
      where: { id: permissionId }
    })

    return NextResponse.json({
      success: true,
      message: `Разрешение для ${permission.manager.user.name} удалено`,
      deletedPermission: {
        manager: permission.manager.user.name,
        project: permission.project?.name || 'Все проекты'
      }
    })

  } catch (error) {
    console.error('Error deleting T-coin permission:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ permissionId: string }> }
) {
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

    const { permissionId } = await params
    const body = await request.json()
    const { maxAmount, dailyLimit, isActive } = body

    if (!permissionId) {
      return NextResponse.json(
        { error: 'ID разрешения обязателен' },
        { status: 400 }
      )
    }

    // Проверяем, что разрешение существует
    const existingPermission = await prisma.tCoinAwardPermission.findUnique({
      where: { id: permissionId }
    })

    if (!existingPermission) {
      return NextResponse.json(
        { error: 'Разрешение не найдено' },
        { status: 404 }
      )
    }

    // Валидация данных
    const updateData: any = {}

    if (maxAmount !== undefined) {
      if (maxAmount < 1 || maxAmount > 1000) {
        return NextResponse.json(
          { error: 'Максимальное количество должно быть от 1 до 1000' },
          { status: 400 }
        )
      }
      updateData.maxAmount = maxAmount
    }

    if (dailyLimit !== undefined) {
      if (dailyLimit < 1 || dailyLimit > 5000) {
        return NextResponse.json(
          { error: 'Дневной лимит должен быть от 1 до 5000' },
          { status: 400 }
        )
      }
      updateData.dailyLimit = dailyLimit
    }

    if (isActive !== undefined) {
      updateData.isActive = isActive
    }

    // Обновляем разрешение
    const updatedPermission = await prisma.tCoinAwardPermission.update({
      where: { id: permissionId },
      data: updateData,
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
        id: updatedPermission.id,
        manager: {
          name: updatedPermission.manager.user.name,
          email: updatedPermission.manager.user.email
        },
        project: updatedPermission.project?.name || 'Все проекты',
        maxAmount: updatedPermission.maxAmount,
        dailyLimit: updatedPermission.dailyLimit,
        isActive: updatedPermission.isActive
      }
    })

  } catch (error) {
    console.error('Error updating T-coin permission:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}
