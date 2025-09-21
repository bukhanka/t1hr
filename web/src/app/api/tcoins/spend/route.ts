import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { GamificationService } from '@/lib/gamification'
import rewardsCatalog from '@/data/rewards-catalog.json'
import { z } from 'zod'

const purchaseSchema = z.object({
  itemId: z.string(),
  quantity: z.number().min(1).default(1)
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Необходима авторизация' }, 
        { status: 401 }
      )
    }

    const body = await request.json()
    const validation = purchaseSchema.safeParse(body)
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Некорректные данные', details: validation.error.errors },
        { status: 400 }
      )
    }

    const { itemId, quantity } = validation.data

    // Найти товар в каталоге
    const item = rewardsCatalog.items.find(i => i.id === itemId)
    if (!item) {
      return NextResponse.json(
        { error: 'Товар не найден' },
        { status: 404 }
      )
    }

    if (!item.inStock) {
      return NextResponse.json(
        { error: 'Товар недоступен' },
        { status: 400 }
      )
    }

    const totalCost = item.cost * quantity

    // Попытка потратить T-Coins
    const result = await GamificationService.spendTCoins(
      session.user.id,
      totalCost,
      'reward_purchase',
      `Покупка: ${item.name} x${quantity}`,
      { itemId, itemName: item.name, quantity, unitCost: item.cost }
    )

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    // В реальном приложении здесь был бы процесс оформления заказа
    return NextResponse.json({
      success: true,
      purchase: {
        itemName: item.name,
        quantity,
        totalCost,
        remainingBalance: result.newBalance
      },
      message: `Успешно куплено: ${item.name} x${quantity}. Остаток: ${result.newBalance} T-Coins`
    })

  } catch (error) {
    console.error('Ошибка при покупке награды:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}
