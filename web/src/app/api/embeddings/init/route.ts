import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { AutoEmbeddingService } from '@/lib/auto-embeddings'

/**
 * API для инициализации эмбеддингов через интерфейс
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Необходима авторизация' }, 
        { status: 401 }
      )
    }

    // Только HR, менеджеры и project managers могут инициализировать эмбеддинги
    if (!['HR', 'MANAGER', 'PROJECT_MANAGER'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Недостаточно прав для инициализации эмбеддингов' },
        { status: 403 }
      )
    }

    const { action } = await request.json()

    if (action === 'init_missing') {
      console.log(`🚀 ${session.user.name} запустил массовую инициализацию эмбеддингов`)

      // Запускаем в фоне
      AutoEmbeddingService.initializeMissingEmbeddings()
        .then((result) => {
          console.log('✅ Массовая инициализация завершена:', result)
        })
        .catch((error) => {
          console.error('❌ Ошибка массовой инициализации:', error)
        })

      return NextResponse.json({
        message: 'Массовая инициализация эмбеддингов запущена в фоновом режиме',
        status: 'started',
        initiatedBy: session.user.name
      })
    }

    return NextResponse.json(
      { error: 'Неизвестное действие' },
      { status: 400 }
    )

  } catch (error) {
    console.error('Ошибка API инициализации эмбеддингов:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

/**
 * Получение статистики эмбеддингов
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Необходима авторизация' }, 
        { status: 401 }
      )
    }

    if (!['HR', 'MANAGER', 'PROJECT_MANAGER'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Недостаточно прав' },
        { status: 403 }
      )
    }

    const stats = await AutoEmbeddingService.getEmbeddingCoverage()

    return NextResponse.json({
      ...stats,
      ready: stats.percentage >= 20, // Готово к использованию при 20%+ покрытии
      status: stats.percentage === 0 ? 'not_started' : 
              stats.percentage < 100 ? 'in_progress' : 'completed'
    })

  } catch (error) {
    console.error('Ошибка получения статистики эмбеддингов:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}
