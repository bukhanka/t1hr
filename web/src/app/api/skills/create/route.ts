import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createSkillSchema = z.object({
  name: z.string().min(1).max(50),
  category: z.string().optional().default('Custom')
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

    const body = await request.json()
    const validation = createSkillSchema.safeParse(body)
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Некорректные данные', details: validation.error.errors },
        { status: 400 }
      )
    }

    const { name, category } = validation.data

    // Проверяем, нет ли уже такого навыка
    const existingSkill = await prisma.skill.findFirst({
      where: { name: { equals: name.trim(), mode: 'insensitive' } }
    })

    if (existingSkill) {
      return NextResponse.json(existingSkill)
    }

    // Создаем новый навык
    const skill = await prisma.skill.create({
      data: {
        name: name.trim(),
        category: category || 'Custom',
        description: `Пользовательский навык: ${name.trim()}`
      }
    })

    console.log(`📝 Создан новый навык: "${skill.name}" пользователем ${session.user.email}`)

    return NextResponse.json(skill)

  } catch (error) {
    console.error('Ошибка при создании навыка:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' }, 
      { status: 500 }
    )
  }
}
