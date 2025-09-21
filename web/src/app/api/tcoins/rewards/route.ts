import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Необходима авторизация' }, 
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')

    // Строим условия для фильтрации
    const where: any = {
      isActive: true,
      inStock: true
    }

    // Фильтрация по категории
    if (category && category !== 'all') {
      where.category = category
    }

    // Получаем товары из базы данных
    const items = await prisma.rewardItem.findMany({
      where,
      orderBy: [
        { category: 'asc' },
        { cost: 'asc' }
      ]
    })

    // Категории
    const categories = {
      merch: 'Мерч T1',
      development: 'Развитие',
      privileges: 'Привилегии'
    }

    return NextResponse.json({
      categories,
      items,
      total: items.length
    })

  } catch (error) {
    console.error('Ошибка при получении каталога наград:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}
