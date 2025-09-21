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

    // Получаем все доступные навыки, отсортированные по популярности
    const skills = await prisma.skill.findMany({
      select: {
        id: true,
        name: true,
        category: true,
        _count: {
          select: {
            userSkills: true
          }
        }
      },
      orderBy: [
        { userSkills: { _count: 'desc' } }, // Сначала популярные
        { name: 'asc' } // Потом по алфавиту
      ]
    })

    return NextResponse.json(skills.map(skill => ({
      id: skill.id,
      name: skill.name,
      category: skill.category,
      usageCount: skill._count.userSkills
    })))

  } catch (error) {
    console.error('Ошибка при получении списка навыков:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' }, 
      { status: 500 }
    )
  }
}
