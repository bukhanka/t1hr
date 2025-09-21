import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Необходима авторизация' }, 
        { status: 401 }
      )
    }

    const { jobId } = await request.json()

    if (!jobId) {
      return NextResponse.json(
        { error: 'ID вакансии обязателен' }, 
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

    // Проверяем существование вакансии
    const job = await prisma.jobOpening.findUnique({
      where: { id: jobId }
    })

    if (!job) {
      return NextResponse.json(
        { error: 'Вакансия не найдена' }, 
        { status: 404 }
      )
    }

    // В реальной системе здесь была бы проверка существования заявки в таблице JobApplications
    // Для демо просто логируем отзыв заявки
    
    console.log(`💼 Пользователь ${session.user.email} отозвал заявку на вакансию "${job.title}"`)

    return NextResponse.json({ 
      success: true,
      message: `Заявка на вакансию "${job.title}" отозвана`,
      note: 'В данной демо-версии отзыв заявки логируется на сервере. В продакшене будет удалена запись из базы данных.'
    })

  } catch (error) {
    console.error('Ошибка при отзыве заявки на вакансию:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' }, 
      { status: 500 }
    )
  }
}
