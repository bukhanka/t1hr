import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { SmartRankingService } from '@/lib/smart-ranking'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Необходима авторизация' }, 
        { status: 401 }
      )
    }

    // Только сотрудники могут получать персональные рекомендации
    if (session.user.role !== 'EMPLOYEE') {
      return NextResponse.json(
        { error: 'Рекомендации доступны только сотрудникам' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') // 'courses', 'projects', 'jobs', 'mentors', 'all'

    console.log(`🎯 Генерируем персонализированные рекомендации для ${session.user.id}`)

    const recommendations = await SmartRankingService.getPersonalizedRecommendations(session.user.id)

    // Фильтруем по типу если указан
    if (type && type !== 'all') {
      const filtered = {
        [type]: recommendations[type as keyof typeof recommendations] || []
      }
      
      return NextResponse.json({
        recommendations: filtered,
        type,
        algorithm: 'smart_ranking',
        timestamp: new Date()
      })
    }

    return NextResponse.json({
      recommendations,
      type: 'all',
      algorithm: 'smart_ranking',
      timestamp: new Date(),
      summary: {
        totalCourses: recommendations.courses.length,
        totalProjects: recommendations.projects.length,
        totalJobs: recommendations.jobs.length,
        totalMentors: recommendations.mentors.length
      }
    })

  } catch (error) {
    console.error('Ошибка при генерации рекомендаций:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}
