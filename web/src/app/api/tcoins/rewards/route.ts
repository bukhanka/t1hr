import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import rewardsCatalog from '@/data/rewards-catalog.json'

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

    let filteredItems = rewardsCatalog.items

    // Фильтрация по категории
    if (category && category !== 'all') {
      filteredItems = rewardsCatalog.items.filter(item => item.category === category)
    }

    // Показываем только доступные товары
    filteredItems = filteredItems.filter(item => item.inStock)

    return NextResponse.json({
      categories: rewardsCatalog.categories,
      items: filteredItems,
      total: filteredItems.length
    })

  } catch (error) {
    console.error('Ошибка при получении каталога наград:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}
