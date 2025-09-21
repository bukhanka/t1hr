import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { GamificationService } from '@/lib/gamification'
import { z } from 'zod'

const updateStepSchema = z.object({
  status: z.enum(['pending', 'in_progress', 'completed'])
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ stepId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Необходима авторизация' }, 
        { status: 401 }
      )
    }

    const { stepId } = await params
    const body = await request.json()
    const validation = updateStepSchema.safeParse(body)
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Некорректные данные', details: validation.error.errors },
        { status: 400 }
      )
    }

    const { status } = validation.data

    // Поскольку роадмап генерируется динамически, мы не храним шаги в БД
    // Начисляем XP за завершение шага
    if (status === 'completed') {
      const gamificationResult = await GamificationService.awardXP(
        session.user.id, 
        'MILESTONE_REACHED',
        1.2 // Больший множитель за завершение важного шага
      )

      console.log(`🏆 Пользователь ${session.user.email} завершил шаг роадмапа: ${stepId}`)
      
      return NextResponse.json({ 
        success: true,
        message: 'Шаг роадмапа завершен!',
        xpReward: gamificationResult?.xpAwarded || 0,
        gamification: gamificationResult
      })
    }

    return NextResponse.json({ 
      success: true,
      message: `Статус шага изменен на: ${status}`,
    })

  } catch (error) {
    console.error('Ошибка при обновлении шага роадмапа:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' }, 
      { status: 500 }
    )
  }
}
