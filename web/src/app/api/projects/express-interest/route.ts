import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { GamificationService } from '@/lib/gamification'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Необходима авторизация' }, 
        { status: 401 }
      )
    }

    const { projectId } = await request.json()

    if (!projectId) {
      return NextResponse.json(
        { error: 'ID проекта обязателен' }, 
        { status: 400 }
      )
    }

    // Проверяем существование проекта
    const project = await prisma.project.findUnique({
      where: { id: projectId }
    })

    if (!project) {
      return NextResponse.json(
        { error: 'Проект не найден' }, 
        { status: 404 }
      )
    }

    if (project.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Проект недоступен для участия' }, 
        { status: 400 }
      )
    }

    // Проверяем профиль пользователя
    const profile = await prisma.profile.findUnique({
      where: { userId: session.user.id }
    })

    if (!profile) {
      return NextResponse.json(
        { error: 'Профиль не найден' }, 
        { status: 404 }
      )
    }

    // Проверяем, не выразил ли уже интерес к проекту
    const existingInterest = await prisma.userProject.findFirst({
      where: {
        profileId: profile.id,
        projectId: projectId
      }
    })

    if (existingInterest) {
      return NextResponse.json(
        { error: 'Вы уже выразили интерес к этому проекту' }, 
        { status: 409 }
      )
    }

    // Выражаем интерес к проекту
    const userProject = await prisma.userProject.create({
      data: {
        profileId: profile.id,
        projectId: projectId,
        roleInProject: 'PARTICIPANT'
      },
      include: {
        project: true
      }
    })

    // Начисляем XP за выражение интереса к проекту
    const gamificationResult = await GamificationService.awardXP(
      session.user.id, 
      'PROJECT_ADDED',
      0.5
    )

    console.log(`🚀 Пользователь ${session.user.email} выразил интерес к проекту "${project.name}"`)

    return NextResponse.json({ 
      success: true,
      message: `Интерес к проекту "${project.name}" выражен`,
      userProject,
      gamification: gamificationResult
    })

  } catch (error) {
    console.error('Ошибка при выражении интереса к проекту:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' }, 
      { status: 500 }
    )
  }
}