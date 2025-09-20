import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const profileUpdateSchema = z.object({
  jobTitle: z.string().optional(),
  department: z.string().optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Необходима авторизация' }, 
        { status: 401 }
      )
    }

    const { userId } = params

    // Проверяем права доступа
    if (session.user.id !== userId && session.user.role === 'EMPLOYEE') {
      return NextResponse.json(
        { error: 'Недостаточно прав' },
        { status: 403 }
      )
    }

    const profile = await prisma.profile.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true
          }
        },
        userSkills: {
          include: { skill: true },
          orderBy: { skill: { name: 'asc' } }
        },
        userProjects: {
          include: { project: true },
          orderBy: { updatedAt: 'desc' }
        },
        careerGoals: {
          orderBy: { priority: 'desc' }
        },
        badges: {
          include: { badge: true },
          orderBy: { awardedAt: 'desc' }
        }
      }
    })

    if (!profile) {
      return NextResponse.json(
        { error: 'Профиль не найден' },
        { status: 404 }
      )
    }

    // Для менеджеров и HR скрываем конфиденциальную информацию
    if (session.user.role !== 'EMPLOYEE' && session.user.id !== userId) {
      const publicProfile = {
        ...profile,
        careerGoals: [], // Скрываем карьерные цели от менеджеров
        user: {
          ...profile.user,
          email: session.user.role === 'HR' ? profile.user.email : undefined
        }
      }
      return NextResponse.json(publicProfile)
    }

    return NextResponse.json(profile)

  } catch (error) {
    console.error('Ошибка при получении профиля:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Необходима авторизация' }, 
        { status: 401 }
      )
    }

    const { userId } = params

    // Только сотрудник может редактировать свой профиль
    if (session.user.id !== userId) {
      return NextResponse.json(
        { error: 'Можно редактировать только свой профиль' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validation = profileUpdateSchema.safeParse(body)
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Некорректные данные', details: validation.error.errors },
        { status: 400 }
      )
    }

    const updateData = validation.data

    // Обновляем профиль
    const updatedProfile = await prisma.profile.update({
      where: { userId },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true
          }
        },
        userSkills: {
          include: { skill: true }
        },
        userProjects: {
          include: { project: true }
        },
        careerGoals: true,
        badges: {
          include: { badge: true }
        }
      }
    })

    // Обновляем силу профиля
    await updateProfileStrength(userId)

    return NextResponse.json(updatedProfile)

  } catch (error) {
    console.error('Ошибка при обновлении профиля:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

// Функция для пересчета силы профиля
async function updateProfileStrength(userId: string) {
  const profile = await prisma.profile.findUnique({
    where: { userId },
    include: {
      userSkills: true,
      userProjects: true,
      careerGoals: true
    }
  })

  if (!profile) return

  let strength = 0

  // Базовая информация (20%)
  if (profile.jobTitle) strength += 10
  if (profile.department) strength += 10

  // Навыки (30%)
  const skillsCount = profile.userSkills.length
  if (skillsCount > 0) strength += Math.min(30, skillsCount * 3)

  // Проекты и достижения (40%)
  const projectsWithAchievements = profile.userProjects.filter(p => p.achievements)
  if (projectsWithAchievements.length > 0) {
    strength += Math.min(40, projectsWithAchievements.length * 8)
  }

  // Карьерные цели (10%)
  if (profile.careerGoals.length > 0) strength += 10

  // Максимум 100%
  strength = Math.min(100, strength)

  await prisma.profile.update({
    where: { userId },
    data: { profileStrength: strength }
  })
}
