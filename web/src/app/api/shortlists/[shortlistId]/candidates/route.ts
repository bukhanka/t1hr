import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const addCandidateSchema = z.object({
  profileId: z.string(),
  notes: z.string().optional()
})

// POST - добавить кандидата в шорт-лист
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ shortlistId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { shortlistId } = await params
    
    if (!session?.user?.id || session.user.role !== 'MANAGER') {
      return NextResponse.json(
        { error: 'Недостаточно прав' },
        { status: 403 }
      )
    }

    // Проверяем, что шорт-лист принадлежит менеджеру
    const shortlist = await prisma.shortList.findFirst({
      where: {
        id: shortlistId,
        managerId: session.user.id
      }
    })

    if (!shortlist) {
      return NextResponse.json(
        { error: 'Шорт-лист не найден' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const validation = addCandidateSchema.safeParse(body)
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Некорректные данные', details: validation.error.errors },
        { status: 400 }
      )
    }

    const { profileId, notes } = validation.data

    // Проверяем, что профиль существует и это сотрудник
    const profile = await prisma.profile.findFirst({
      where: {
        id: profileId,
        user: { role: 'EMPLOYEE' }
      }
    })

    if (!profile) {
      return NextResponse.json(
        { error: 'Профиль сотрудника не найден' },
        { status: 404 }
      )
    }

    // Добавляем кандидата в шорт-лист (или обновляем заметки если уже есть)
    const candidate = await prisma.shortListCandidate.upsert({
      where: {
        shortListId_profileId: {
          shortListId: shortlistId,
          profileId: profileId
        }
      },
      update: {
        notes: notes || null
      },
      create: {
        shortListId: shortlistId,
        profileId: profileId,
        notes: notes || null
      },
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
    })

    return NextResponse.json(candidate, { status: 201 })

  } catch (error) {
    console.error('Ошибка при добавлении кандидата в шорт-лист:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}
