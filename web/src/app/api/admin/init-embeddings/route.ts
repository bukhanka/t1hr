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
    
    if (!session?.user?.id || !['HR', 'PROJECT_MANAGER'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Недостаточно прав. Только HR и Project Manager могут инициализировать эмбеддинги' }, 
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
    
    if (!session?.user?.id || !['MANAGER', 'HR', 'PROJECT_MANAGER'].includes(session.user.role)) {
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

    // Проверяем реальное покрытие эмбеддингами (используем raw SQL для pgvector)
    const profilesWithEmbeddingsResult = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*) as count
      FROM "Profile" p
      JOIN "User" u ON p."userId" = u.id
      WHERE u.role = 'EMPLOYEE' AND p.embedding IS NOT NULL
    `
    const profilesWithEmbeddings = Number(profilesWithEmbeddingsResult[0]?.count || 0)

    const coverage = totalProfiles > 0 
      ? Math.round((profilesWithEmbeddings / totalProfiles) * 100)
      : 0

    return NextResponse.json({
      totalProfiles,
      profilesWithEmbeddings,
      coveragePercentage: coverage,
      status: coverage === 0 ? 'not_started' : coverage < 100 ? 'in_progress' : 'completed',
      readyForSemanticSearch: coverage >= 20 // Понизили порог для демо
    })

  } catch (error) {
    console.error('Ошибка при получении статуса эмбеддингов:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}
