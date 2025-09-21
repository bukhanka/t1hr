import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createShortListSchema = z.object({
  title: z.string().min(1, 'Название не может быть пустым'),
  description: z.string().optional().nullable()
})

// GET - получить все шорт-листы менеджера
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id || session.user.role !== 'MANAGER') {
      return NextResponse.json(
        { error: 'Недостаточно прав' },
        { status: 403 }
      )
    }

    const shortlists = await prisma.shortList.findMany({
      where: {
        managerId: session.user.id
      },
      include: {
        candidates: {
          include: {
            profile: {
              include: {
                user: {
                  select: { name: true, email: true }
                },
                userSkills: {
                  include: { skill: true },
                  where: { status: 'USING' },
                  take: 5
                }
              }
            }
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    })

    return NextResponse.json({ shortlists })

  } catch (error) {
    console.error('Ошибка при получении шорт-листов:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

// POST - создать новый шорт-лист
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id || session.user.role !== 'MANAGER') {
      return NextResponse.json(
        { error: 'Недостаточно прав' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validation = createShortListSchema.safeParse(body)
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Некорректные данные', details: validation.error.errors },
        { status: 400 }
      )
    }

    const { title, description } = validation.data

    const shortlist = await prisma.shortList.create({
      data: {
        managerId: session.user.id,
        title,
        description
      },
      include: {
        candidates: {
          include: {
            profile: {
              include: {
                user: {
                  select: { name: true, email: true }
                },
                userSkills: {
                  include: { skill: true },
                  where: { status: 'USING' },
                  take: 5
                }
              }
            }
          }
        }
      }
    })

    return NextResponse.json(shortlist, { status: 201 })

  } catch (error) {
    console.error('Ошибка при создании шорт-листа:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}
