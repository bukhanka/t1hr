import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { VectorizationService } from '@/lib/vectorization'

/**
 * Административный endpoint для инициализации эмбеддингов
 * Только для HR пользователей
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id || session.user.role !== 'HR') {
      return NextResponse.json(
        { error: 'Недостаточно прав. Только HR может инициализировать эмбеддинги' }, 
        { status: 403 }
      )
    }

    console.log(`🚀 Пользователь ${session.user.name} инициировал перестройку эмбеддингов`)

    // Запускаем процесс перестройки в фоне
    VectorizationService.rebuildAllEmbeddings()
      .then(() => {
        console.log('✅ Процесс инициализации эмбеддингов завершен успешно')
      })
      .catch((error) => {
        console.error('❌ Ошибка при инициализации эмбеддингов:', error)
      })

    return NextResponse.json({
      message: 'Процесс инициализации эмбеддингов запущен в фоновом режиме',
      status: 'started',
      initiatedBy: session.user.name
    })

  } catch (error) {
    console.error('Ошибка в админ API инициализации эмбеддингов:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

/**
 * Получение статуса инициализации эмбеддингов
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id || !['MANAGER', 'HR'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Недостаточно прав' },
        { status: 403 }
      )
    }

    // Импортируем prisma здесь, чтобы избежать конфликтов
    const { prisma } = await import('@/lib/prisma')

    const totalProfiles = await prisma.profile.count({
      where: { user: { role: 'EMPLOYEE' } }
    })

    const profilesWithEmbeddings = await prisma.profile.count({
      where: { 
        user: { role: 'EMPLOYEE' },
        embeddingText: { not: null }
      }
    })

    const coverage = totalProfiles > 0 
      ? Math.round((profilesWithEmbeddings / totalProfiles) * 100)
      : 0

    return NextResponse.json({
      totalProfiles,
      profilesWithEmbeddings,
      coveragePercentage: coverage,
      status: coverage === 100 ? 'complete' : coverage > 0 ? 'partial' : 'not_started',
      readyForSemanticSearch: coverage >= 50
    })

  } catch (error) {
    console.error('Ошибка при получении статуса эмбеддингов:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}
