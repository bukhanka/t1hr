import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { VectorizationService } from '@/lib/vectorization'
import { GamificationService } from '@/lib/gamification'
import { z } from 'zod'

const updateEmbeddingSchema = z.object({
  profileId: z.string().optional(),
  rebuildAll: z.boolean().optional()
})

// POST - обновление эмбеддинга для профиля
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
    const validation = updateEmbeddingSchema.safeParse(body)
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Некорректные данные', details: validation.error.errors },
        { status: 400 }
      )
    }

    const { profileId, rebuildAll } = validation.data

    if (rebuildAll) {
      // Только HR может перестроить все эмбеддинги
      if (session.user.role !== 'HR') {
        return NextResponse.json(
          { error: 'Недостаточно прав для перестройки всех эмбеддингов' },
          { status: 403 }
        )
      }

      // Запускаем фоновое перестроение всех эмбеддингов
      VectorizationService.rebuildAllEmbeddings().catch(error => {
        console.error('Ошибка при перестройке эмбеддингов:', error)
      })

      return NextResponse.json({
        message: 'Процесс перестройки эмбеддингов запущен в фоне',
        rebuildAll: true
      })

    } else {
      // Обновление эмбеддинга для конкретного профиля
      const targetProfileId = profileId || session.user.profileId

      if (!targetProfileId) {
        return NextResponse.json(
          { error: 'ID профиля не найден' },
          { status: 400 }
        )
      }

      // Пользователи могут обновлять только свой профиль (кроме HR)
      if (session.user.role === 'EMPLOYEE' && targetProfileId !== session.user.profileId) {
        return NextResponse.json(
          { error: 'Можно обновлять только свой профиль' },
          { status: 403 }
        )
      }

      const success = await VectorizationService.updateProfileEmbedding(targetProfileId)

      if (success) {
        // Начисляем XP за обновление профиля
        await GamificationService.awardXP(session.user.id, 'PROFILE_UPDATED')

        return NextResponse.json({
          message: 'Эмбеддинг успешно обновлен',
          profileId: targetProfileId,
          success: true
        })
      } else {
        return NextResponse.json(
          { error: 'Не удалось обновить эмбеддинг' },
          { status: 500 }
        )
      }
    }

  } catch (error) {
    console.error('Ошибка в API обновления эмбеддингов:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

// GET - получение статистики по эмбеддингам
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id || !['MANAGER', 'HR'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Недостаточно прав' },
        { status: 403 }
      )
    }

    // Получаем статистику
    const totalProfiles = await prisma.profile.count({
      where: { user: { role: 'EMPLOYEE' } }
    })

    // Временно закомментировано из-за отсутствия поля embeddingText
    // const profilesWithEmbeddings = await prisma.profile.count({
    //   where: { 
    //     user: { role: 'EMPLOYEE' },
    //     embeddingText: { not: null }
    //   }
    // })
    const profilesWithEmbeddings = 0 // Временно установлено в 0

    const coveragePercentage = totalProfiles > 0 
      ? Math.round((profilesWithEmbeddings / totalProfiles) * 100)
      : 0

    return NextResponse.json({
      totalProfiles,
      profilesWithEmbeddings,
      coveragePercentage,
      readyForSemanticSearch: coveragePercentage > 50
    })

  } catch (error) {
    console.error('Ошибка при получении статистики эмбеддингов:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}
