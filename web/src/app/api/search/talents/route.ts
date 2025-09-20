import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { VectorizationService } from '@/lib/vectorization'
import { z } from 'zod'

const searchRequestSchema = z.object({
  query: z.string().min(1, 'Поисковый запрос не может быть пустым'),
  filters: z.object({
    skills: z.array(z.string()).optional(),
    departments: z.array(z.string()).optional(),
    levels: z.array(z.string()).optional(),
    availability: z.enum(['available', 'busy', 'any']).optional()
  }).optional()
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

    // Только менеджеры и HR могут искать таланты
    if (!['MANAGER', 'HR'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Недостаточно прав для поиска' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validation = searchRequestSchema.safeParse(body)
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Некорректные данные', details: validation.error.errors },
        { status: 400 }
      )
    }

    const { query, filters } = validation.data

    // Используем семантический поиск с векторными эмбеддингами
    let searchResults = await VectorizationService.semanticSearch(query, 20, 0.3)
    
    // Fallback на обычный поиск, если векторный поиск не дал результатов
    if (!searchResults || searchResults.length === 0) {
      console.log('Векторный поиск не дал результатов, используем fallback')
      
      const profiles = await prisma.profile.findMany({
        where: {
          user: { role: 'EMPLOYEE' },
          ...(filters?.departments && {
            department: { in: filters.departments }
          })
        },
        include: {
          user: {
            select: { id: true, name: true, email: true }
          },
          userSkills: {
            include: { skill: true },
            where: { status: 'USING' }
          },
          userProjects: {
            include: { project: true },
            where: { achievements: { not: null } },
            take: 3
          }
        }
      })

      // Простой алгоритм матчинга как fallback
      const scoredProfiles = profiles.map(profile => {
        let score = 0
        const queryLower = query.toLowerCase()
        
        profile.userSkills.forEach(userSkill => {
          if (userSkill.skill.name.toLowerCase().includes(queryLower)) {
            score += userSkill.level * 10
            if (userSkill.isVerified) score += 5
          }
        })

        if (profile.jobTitle?.toLowerCase().includes(queryLower)) score += 20
        if (profile.department?.toLowerCase().includes(queryLower)) score += 15

        profile.userProjects.forEach(userProject => {
          if (userProject.achievements?.toLowerCase().includes(queryLower) ||
              userProject.project.name.toLowerCase().includes(queryLower)) {
            score += 10
          }
        })

        return {
          profileId: profile.id,
          similarity: Math.min(1.0, score / 100), // Нормализуем в 0-1
          profile
        }
      }).filter(result => result.similarity > 0.1)
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, 20)

      searchResults = scoredProfiles
    }

    // Дополнительная фильтрация результатов поиска
    let filteredResults = searchResults

    if (filters?.skills && filters.skills.length > 0) {
      filteredResults = searchResults.filter(result => {
        const profileSkillNames = result.profile.userSkills.map((us: any) => 
          us.skill.name.toLowerCase()
        )
        const matchedSkills = filters.skills?.filter(skill => 
          profileSkillNames.includes(skill.toLowerCase())
        ) || []
        return matchedSkills.length > 0
      })
    }

    if (filters?.departments && filters.departments.length > 0) {
      filteredResults = filteredResults.filter(result => 
        filters.departments?.includes(result.profile.department) || false
      )
    }

    const sortedResults = filteredResults

    // Форматируем результаты для фронтенда
    const formattedResults = sortedResults.map(({ profile, similarity }) => ({
      id: profile.user.id,
      name: profile.user.name,
      email: session.user.role === 'HR' ? profile.user.email : undefined,
      jobTitle: profile.jobTitle,
      department: profile.department,
      profileStrength: profile.profileStrength,
      level: profile.level,
      xp: profile.xp,
      matchPercentage: Math.round(similarity * 100),
      semanticSimilarity: similarity,
      skills: profile.userSkills.slice(0, 6).map((us: any) => ({
        name: us.skill.name,
        level: us.level,
        isVerified: us.isVerified
      })),
      recentProjects: profile.userProjects.slice(0, 2).map((up: any) => ({
        name: up.project.name,
        role: up.roleInProject,
        achievements: up.achievements
      })),
      availability: 'available' // TODO: Реальная логика доступности
    }))

    return NextResponse.json({
      results: formattedResults,
      total: formattedResults.length,
      query,
      filters
    })

  } catch (error) {
    console.error('Ошибка при поиске талантов:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

// GET роут для получения фильтров и статистики
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id || !['MANAGER', 'HR'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Недостаточно прав' },
        { status: 403 }
      )
    }

    // Получаем доступные фильтры
    const [skills, departments, jobTitles] = await Promise.all([
      prisma.skill.findMany({
        select: { name: true, category: true },
        orderBy: { name: 'asc' }
      }),
      prisma.profile.findMany({
        where: { department: { not: null } },
        select: { department: true },
        distinct: ['department']
      }),
      prisma.profile.findMany({
        where: { jobTitle: { not: null } },
        select: { jobTitle: true },
        distinct: ['jobTitle']
      })
    ])

    return NextResponse.json({
      filters: {
        skills: skills,
        departments: departments.map(d => d.department).filter(Boolean),
        jobTitles: jobTitles.map(j => j.jobTitle).filter(Boolean),
        levels: ['Junior', 'Middle', 'Senior', 'Expert']
      }
    })

  } catch (error) {
    console.error('Ошибка при получении фильтров:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}
