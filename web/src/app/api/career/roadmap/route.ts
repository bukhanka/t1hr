import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { openai, MODELS } from '@/lib/openai'
import { SmartRankingService } from '@/lib/smart-ranking'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Необходима авторизация' }, 
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const target = searchParams.get('target')

    if (!target) {
      return NextResponse.json(
        { error: 'Целевая позиция не указана' }, 
        { status: 400 }
      )
    }

    // Получаем полный профиль пользователя
    const profile = await prisma.profile.findUnique({
      where: { userId: session.user.id },
      include: {
        user: { select: { name: true, email: true } },
        userSkills: { include: { skill: true } },
        userProjects: { include: { project: true } },
        careerGoals: true,
        userCourses: { include: { course: true } },
        mentorPrograms: { include: { program: true } }
      }
    })

    if (!profile) {
      return NextResponse.json(
        { error: 'Профиль не найден' }, 
        { status: 404 }
      )
    }

    // Генерируем роадмап с помощью ИИ
    const roadmap = await generateCareerRoadmap(profile, target)

    // Получаем персонализированные рекомендации
    const recommendations = await SmartRankingService.getPersonalizedRecommendations(session.user.id)

    return NextResponse.json({
      goalTarget: target,
      estimatedTime: roadmap.estimatedTime,
      progressPercentage: calculateCurrentProgress(profile, roadmap.steps),
      steps: roadmap.steps,
      recommendations
    })

  } catch (error) {
    console.error('Ошибка при генерации роадмапа:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' }, 
      { status: 500 }
    )
  }
}

async function generateCareerRoadmap(profile: any, target: string) {
  const currentSkills = profile.userSkills.map((us: any) => 
    `${us.skill.name} (уровень ${us.level}/5, ${us.status === 'USING' ? 'использую' : 'изучаю'})`
  ).join(', ')

  const currentProjects = profile.userProjects.map((up: any) => 
    `${up.project.name} (роль: ${up.roleInProject})`
  ).join(', ')

  const currentGoals = profile.careerGoals.map((cg: any) => cg.target).join(', ')

  const prompt = `Создай детальный пошаговый роадмап карьерного развития для IT-сотрудника.

ТЕКУЩИЙ ПРОФИЛЬ:
- Должность: ${profile.jobTitle || 'не указана'}
- Отдел: ${profile.department || 'не указан'}
- Уровень: ${profile.level} (${profile.xp} XP)
- Навыки: ${currentSkills || 'не указаны'}
- Проекты: ${currentProjects || 'не указаны'}
- Другие цели: ${currentGoals || 'нет'}

ЦЕЛЕВАЯ ПОЗИЦИЯ: ${target}

ЗАДАЧА: Создай конкретный план из 6-10 шагов для достижения позиции "${target}".

Для каждого шага укажи:
1. Название шага (краткое и ясное)
2. Подробное описание того, что нужно сделать
3. Тип шага: skill, course, project, experience
4. Примерное время выполнения
5. Вознаграждение XP (от 25 до 200)
6. Статус: pending (все шаги по умолчанию)

ВЕРНИ РЕЗУЛЬТАТ В JSON ФОРМАТЕ:
{
  "estimatedTime": "6-12 месяцев",
  "steps": [
    {
      "title": "Название шага",
      "description": "Подробное описание",
      "type": "skill|course|project|experience", 
      "estimatedTime": "2-4 недели",
      "xpReward": 100,
      "status": "pending",
      "resource": {
        "name": "Название ресурса",
        "link": ""
      }
    }
  ]
}

ВАЖНО:
- Учитывай текущие навыки и не дублируй то, что уже освоено
- Начинай с того, что можно сделать немедленно
- Располагай шаги в логическом порядке
- Будь конкретным и практичным
- Фокусируйся на реальных действиях, а не абстрактных советах`

  try {
    const completion = await openai.chat.completions.create({
      model: MODELS.CHAT,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 2000
    })

    const response = completion.choices[0]?.message?.content?.trim()
    if (!response) {
      throw new Error('Пустой ответ от ИИ')
    }

    // Парсим JSON ответ
    const roadmap = JSON.parse(response)
    
    // Добавляем уникальные ID к шагам
    roadmap.steps = roadmap.steps.map((step: any, index: number) => ({
      ...step,
      id: `step_${Date.now()}_${index}`
    }))

    return roadmap

  } catch (error) {
    console.error('Ошибка генерации роадмапа:', error)
    
    // Fallback роадмап если ИИ не ответил
    return {
      estimatedTime: "6-12 месяцев",
      steps: [
        {
          id: `step_fallback_1`,
          title: "Анализ текущих навыков",
          description: "Проведите оценку ваших текущих компетенций и определите пробелы для достижения позиции " + target,
          type: "skill",
          estimatedTime: "1 неделя",
          xpReward: 50,
          status: "pending",
          resource: { name: "Самооценка навыков", link: "" }
        },
        {
          id: `step_fallback_2`,
          title: "Поиск обучающих ресурсов",
          description: "Найдите курсы и материалы для изучения необходимых технологий",
          type: "course",
          estimatedTime: "2-3 недели",
          xpReward: 75,
          status: "pending",
          resource: { name: "Образовательные платформы", link: "" }
        },
        {
          id: `step_fallback_3`,
          title: "Практический проект",
          description: "Примените новые знания в реальном или учебном проекте",
          type: "project",
          estimatedTime: "4-6 недель",
          xpReward: 150,
          status: "pending",
          resource: { name: "Практические задания", link: "" }
        }
      ]
    }
  }
}

function calculateCurrentProgress(profile: any, steps: any[]): number {
  if (!steps || steps.length === 0) return 0
  
  // Простая логика расчета прогресса на основе текущих навыков и опыта
  let progressPoints = 0
  const maxPoints = steps.length * 20 // 20 очков за каждый потенциальный шаг
  
  // Добавляем очки за существующие навыки
  progressPoints += Math.min(profile.userSkills.length * 5, maxPoints * 0.3)
  
  // Добавляем очки за опыт в проектах
  progressPoints += Math.min(profile.userProjects.length * 8, maxPoints * 0.4)
  
  // Добавляем очки за общий уровень
  progressPoints += Math.min(profile.level * 3, maxPoints * 0.2)
  
  // Добавляем очки за силу профиля
  progressPoints += Math.min((profile.profileStrength / 100) * maxPoints * 0.1, maxPoints * 0.1)
  
  const percentage = Math.round((progressPoints / maxPoints) * 100)
  return Math.min(percentage, 95) // Максимум 95%, чтобы всегда было что улучшать
}
