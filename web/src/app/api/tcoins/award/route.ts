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

    // Проверяем, что пользователь - проектный менеджер
    if (session.user.role !== Role.PROJECT_MANAGER) {
      return NextResponse.json(
        { error: 'Недостаточно прав для выполнения операции' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { employeeId, amount, reason, projectId } = body

    // Валидация данных
    if (!employeeId || !amount || !reason || !projectId) {
      return NextResponse.json(
        { error: 'Все поля обязательны для заполнения' },
        { status: 400 }
      )
    }

    if (amount < 1 || amount > 100) {
      return NextResponse.json(
        { error: 'Сумма должна быть от 1 до 100 T-коинов' },
        { status: 400 }
      )
    }

    // Получаем профиль менеджера
    const managerProfile = await prisma.profile.findUnique({
      where: { userId: session.user.id },
      include: {
        tcoinPermissions: {
          where: {
            isActive: true,
            OR: [
              { projectId: projectId },
              { projectId: null } // Глобальные разрешения
            ]
          }
        }
      }
    })

    if (!managerProfile) {
      return NextResponse.json(
        { error: 'Профиль менеджера не найден' },
        { status: 404 }
      )
    }

    // Проверяем права на начисление T-коинов
    const permission = managerProfile.tcoinPermissions[0]
    if (!permission) {
      return NextResponse.json(
        { error: 'У вас нет прав на начисление T-коинов в этом проекте' },
        { status: 403 }
      )
    }

    // Проверяем лимиты
    if (amount > permission.maxAmount) {
      return NextResponse.json(
        { error: `Максимальная сумма начисления: ${permission.maxAmount} T-коинов` },
        { status: 400 }
      )
    }

    // Проверяем дневной лимит
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const todayTransactions = await prisma.tCoinTransaction.aggregate({
      where: {
        awardedById: managerProfile.id,
        createdAt: {
          gte: today,
          lt: tomorrow
        }
      },
      _sum: { amount: true }
    })

    const todayTotal = todayTransactions._sum.amount || 0
    if (todayTotal + amount > permission.dailyLimit) {
      return NextResponse.json(
        { error: `Превышен дневной лимит. Осталось: ${permission.dailyLimit - todayTotal} T-коинов` },
        { status: 400 }
      )
    }

    // Получаем профиль сотрудника
    const employeeProfile = await prisma.profile.findUnique({
      where: { id: employeeId },
      include: { user: true }
    })

    if (!employeeProfile) {
      return NextResponse.json(
        { error: 'Сотрудник не найден' },
        { status: 404 }
      )
    }

    // Проверяем, что сотрудник участвует в проекте
    const projectMember = await prisma.userProject.findFirst({
      where: {
        profileId: employeeId,
        projectId: projectId
      },
      include: { project: true }
    })

    if (!projectMember) {
      return NextResponse.json(
        { error: 'Сотрудник не участвует в указанном проекте' },
        { status: 400 }
      )
    }

    // Начисляем T-коины в транзакции
    const result = await prisma.$transaction(async (tx) => {
      // Создаем транзакцию начисления
      const transaction = await tx.tCoinTransaction.create({
        data: {
          profileId: employeeId,
          amount: amount,
          type: 'AWARD',
          source: 'PROJECT_MANAGER',
          description: reason,
          awardedById: managerProfile.id,
          projectId: projectId,
        }
      })

      // Обновляем баланс сотрудника
      await tx.profile.update({
        where: { id: employeeId },
        data: {
          tCoins: { increment: amount },
          totalEarned: { increment: amount }
        }
      })

      return transaction
    })

    return NextResponse.json({
      success: true,
      transaction: {
        id: result.id,
        amount: result.amount,
        employee: {
          name: employeeProfile.user.name,
          email: employeeProfile.user.email
        },
        project: projectMember.project.name,
        description: result.description
      }
    })

  } catch (error) {
    console.error('Error awarding T-coins:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}
