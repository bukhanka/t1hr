import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// DELETE - удалить кандидата из шорт-листа
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ shortlistId: string, candidateId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { shortlistId, candidateId } = await params
    
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

    // Удаляем кандидата
    const deleted = await prisma.shortListCandidate.deleteMany({
      where: {
        id: candidateId,
        shortListId: shortlistId
      }
    })

    if (deleted.count === 0) {
      return NextResponse.json(
        { error: 'Кандидат не найден в шорт-листе' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Ошибка при удалении кандидата из шорт-листа:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}
