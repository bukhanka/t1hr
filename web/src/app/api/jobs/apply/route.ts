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

    const { jobId } = await request.json()

    if (!jobId) {
      return NextResponse.json(
        { error: 'ID вакансии обязателен' }, 
        { status: 400 }
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

    if (job.status !== 'OPEN') {
      return NextResponse.json(
        { error: 'Вакансия недоступна' }, 
        { status: 400 }
      )
    }

    // Проверяем профиль пользователя
    const profile = await prisma.profile.findUnique({
      where: { userId: session.user.id },
      include: {
        userSkills: {
          include: { skill: true }
        }
      }
    })

    if (!profile) {
      return NextResponse.json(
        { error: 'Профиль не найден' }, 
        { status: 404 }
      )
    }

    // Анализируем соответствие навыков требованиям
    const userSkillNames = profile.userSkills
      .filter(us => us.status === 'USING')
      .map(us => us.skill.name.toLowerCase())
    
    const requiredSkills = job.requirements.map(req => req.toLowerCase())
    const matchingSkills = requiredSkills.filter(req => 
      userSkillNames.some(userSkill => userSkill.includes(req) || req.includes(userSkill))
    )
    
    const matchPercentage = Math.round((matchingSkills.length / requiredSkills.length) * 100)

    // В реальной системе здесь была бы таблица JobApplications
    // Для демо логируем заявку и начисляем XP за активность
    
    // Начисляем XP за подачу заявки
    const gamificationResult = await GamificationService.awardXP(
      session.user.id, 
      'CAREER_GOAL_SET', // Используем событие для карьерных целей
      1.0
    )

    console.log(`💼 Пользователь ${session.user.email} подал заявку на вакансию "${job.title}"`)
    console.log(`   Соответствие навыков: ${matchPercentage}% (${matchingSkills.length}/${requiredSkills.length})`)
    console.log(`   Совпадающие навыки: ${matchingSkills.join(', ')}`)

    // В продакшене здесь была бы запись в таблицу заявок:
    // const application = await prisma.jobApplication.create({
    //   data: {
    //     profileId: profile.id,
    //     jobId: jobId,
    //     status: 'PENDING',
    //     matchPercentage,
    //     appliedAt: new Date()
    //   }
    // })

    return NextResponse.json({ 
      success: true,
      message: `Заявка на вакансию "${job.title}" отправлена`,
      matchPercentage,
      matchingSkills,
      requiredSkills: job.requirements,
      gamification: gamificationResult,
      note: 'В данной демо-версии заявка логируется на сервере. В продакшене будет создана запись в базе данных.'
    })

  } catch (error) {
    console.error('Ошибка при подаче заявки на вакансию:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' }, 
      { status: 500 }
    )
  }
}
