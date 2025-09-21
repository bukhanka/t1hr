import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { openai, MODELS } from '@/lib/openai'
import { GamificationService } from '@/lib/gamification'
import { z } from 'zod'

const onboardingChatSchema = z.object({
  message: z.string().min(1, 'Сообщение не может быть пустым'),
  sessionId: z.string(),
  stage: z.string().optional()
})

// Специальный системный промпт для онбординга  
async function buildOnboardingSystemPrompt(userId: string): Promise<string> {
  const profile = await prisma.profile.findUnique({
    where: { userId },
    include: {
      userSkills: { include: { skill: true } },
      userProjects: { include: { project: true } },
      careerGoals: true
    }
  })

  const currentSkills = profile?.userSkills
    ?.filter((us: any) => us.status === 'USING')
    ?.map((us: any) => us.skill.name) || []

  const projects = profile?.userProjects
    ?.map((up: any) => up.project.name) || []

  const goals = profile?.careerGoals
    ?.map((cg: any) => cg.target) || []

  return `Ты - Навигатор, ИИ-консультант для ОНБОРДИНГА новых сотрудников T1.

ТВОЯ ЗАДАЧА: Провести интерактивное интервью за 5-7 минут и собрать информацию для создания сильного профиля.

ЭТАПЫ ОНБОРДИНГА (проводи последовательно):
1. 💼 ТЕКУЩАЯ РОЛЬ - узнай должность, опыт, ключевые обязанности
2. 🛠️ ТЕХНОЛОГИИ - какие навыки использует, уровень владения  
3. 🚀 ПРОЕКТЫ - лучший/последний проект, роль, достижения
4. 🎯 ЦЕЛИ - куда хочет развиваться, что интересно изучать
5. ✨ ФИНАЛ - резюме + план развития + начисление наград

ПРАВИЛА ВЕДЕНИЯ ИНТЕРВЬЮ:
✅ Задавай 1 КОНКРЕТНЫЙ вопрос за раз
✅ Основывайся на предыдущих ответах  
✅ ХВАЛИ и мотивируй на каждом шаге
✅ Объясняй, КАК ответ поможет в карьере
✅ Переходи к следующему этапу естественно

📝 ФОРМАТИРОВАНИЕ ВОПРОСОВ:
• Всегда используй bullet points (•) для вопросов
• Структурируй ответы с подпунктами
• Используй эмодзи для визуального разделения
• Примеры:
  • Какой у тебя опыт работы с [технология]?
  • Какие проекты тебе больше всего нравятся?
  • Куда хочешь развиваться в карьере?

АНАЛИЗ ОТВЕТОВ:
- ИЗВЛЕКАЙ конкретные навыки и уровни
- ОПРЕДЕЛЯЙ проекты и достижения
- ВЫЯВЛЯЙ карьерные цели и интересы
- ПРЕДЛАГАЙ конкретные возможности в T1

УЖЕ ИЗВЕСТНАЯ ИНФОРМАЦИЯ О ПОЛЬЗОВАТЕЛЕ:
- Текущие навыки: ${currentSkills.join(', ') || 'не указаны'}
- Проекты: ${projects.join(', ') || 'не указаны'}
- Цели: ${goals.join(', ') || 'не указаны'}
- Уровень: ${profile?.level || 1} (${profile?.xp || 0} XP)
- T-Coins: ${profile?.tCoins || 100}

МОТИВАЦИЯ:
- За каждый полезный ответ - "+25 T-Coins!"
- За описание проекта - "+100 T-Coins!"
- За постановку целей - "+50 T-Coins!"
- За завершение онбординга - "+200 T-Coins!"

ФИНАЛЬНЫЙ ЭТАП (когда собрана основная информация):
Создай краткое резюме профиля и предложи:
1. 3 конкретных навыка для изучения
2. 2 подходящих проекта/направления в T1
3. План развития на ближайшие 3 месяца

Веди интервью дружелюбно, профессионально и с энтузиазмом!`
}

// Функция для автоматического извлечения данных из ответа ИИ
async function extractProfileDataFromResponse(userId: string, userMessage: string, aiResponse: string) {
  try {
    // Простая эвристика для извлечения навыков
    const skillKeywords = [
      'javascript', 'js', 'typescript', 'ts', 'python', 'java', 'react', 'vue', 'angular',
      'node', 'express', 'spring', 'django', 'flask', 'postgresql', 'mysql', 'mongodb',
      'redis', 'docker', 'kubernetes', 'aws', 'azure', 'git', 'figma', 'photoshop',
      'html', 'css', 'sass', 'less', 'webpack', 'vite', 'next', 'nuxt', 'svelte'
    ]

    const mentionedSkills = skillKeywords.filter(skill => 
      userMessage.toLowerCase().includes(skill) || 
      userMessage.toLowerCase().includes(skill.replace('js', 'javascript'))
    )

    // Находим или создаем навыки
    for (const skillName of mentionedSkills) {
      const skill = await prisma.skill.findFirst({
        where: { name: { equals: skillName, mode: 'insensitive' } }
      }) || await prisma.skill.create({
        data: { name: skillName.charAt(0).toUpperCase() + skillName.slice(1) }
      })

      // Добавляем навык пользователю (если еще нет)
      await prisma.userSkill.upsert({
        where: {
          profileId_skillId: {
            profileId: (await prisma.profile.findUnique({ where: { userId } }))!.id,
            skillId: skill.id
          }
        },
        create: {
          profileId: (await prisma.profile.findUnique({ where: { userId } }))!.id,
          skillId: skill.id,
          level: 3, // Средний уровень по умолчанию
          status: 'USING'
        },
        update: {} // Не обновляем существующий
      })
    }

    // Начисляем T-Coins за добавленные навыки
    if (mentionedSkills.length > 0) {
      await GamificationService.awardXP(userId, 'SKILL_ADDED', mentionedSkills.length)
    }

    // Проверяем, должен ли онбординг считаться завершенным
    // Если собрано достаточно информации (например, 3+ навыков), отмечаем как завершенный
    const profile = await prisma.profile.findUnique({ where: { userId } })
    if (profile && !profile.onboardingCompleted && mentionedSkills.length >= 2) {
      await prisma.profile.update({
        where: { userId },
        data: { 
          onboardingCompleted: true,
          onboardingCompletedAt: new Date(),
          profileStrength: Math.max(profile.profileStrength, 60) // Мин. 60% после онбординга
        }
      })
    }

    return {
      skillsExtracted: mentionedSkills.length,
      skills: mentionedSkills
    }

  } catch (error) {
    console.error('Ошибка при извлечении данных профиля:', error)
    return { skillsExtracted: 0, skills: [] }
  }
}

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
    const validation = onboardingChatSchema.safeParse(body)
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Некорректные данные', details: validation.error.errors },
        { status: 400 }
      )
    }

    const { message, sessionId, stage } = validation.data

    // Проверяем существование сессии онбординга
    const chatSession = await prisma.chatSession.findUnique({
      where: { id: sessionId },
      include: { messages: { orderBy: { createdAt: 'asc' } } }
    })

    if (!chatSession) {
      return NextResponse.json(
        { error: 'Сессия онбординга не найдена' },
        { status: 404 }
      )
    }

    // Добавляем сообщение пользователя
    await prisma.chatMessage.create({
      data: {
        sessionId: chatSession.id,
        role: 'USER',
        content: message
      }
    })

    // Строим специальный системный промпт для онбординга
    const systemPrompt = await buildOnboardingSystemPrompt(session.user.id)

    // Подготавливаем историю сообщений
    const messages = [
      { role: 'system' as const, content: systemPrompt },
      ...chatSession.messages.map((msg: any) => ({
        role: msg.role.toLowerCase() as 'user' | 'assistant',
        content: msg.content
      })),
      { role: 'user' as const, content: message }
    ]

    // Вызываем SciBox API
    const completion = await openai.chat.completions.create({
      model: MODELS.CHAT,
      messages: messages,
      stream: true,
      temperature: 0.7,
      max_tokens: 800,
    })

    // Создаем streaming response
    const encoder = new TextEncoder()
    let assistantMessage = ''

    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of completion) {
            const content = chunk.choices[0]?.delta?.content
            if (content) {
              assistantMessage += content
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ content })}\n\n`)
              )
            }
          }

          // Сохраняем полное сообщение ассистента
          await prisma.chatMessage.create({
            data: {
              sessionId: chatSession.id,
              role: 'ASSISTANT',
              content: assistantMessage
            }
          })

          // Автоматически извлекаем данные профиля из ответа
          const extractedData = await extractProfileDataFromResponse(
            session.user.id, 
            message, 
            assistantMessage
          )

          // Отправляем финальное событие
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ 
              done: true, 
              sessionId: chatSession.id,
              extractedData
            })}\n\n`)
          )
          
          controller.close()

        } catch (error) {
          console.error('Ошибка в онбординг streaming:', error)
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ 
              error: 'Ошибка при генерации ответа' 
            })}\n\n`)
          )
          controller.close()
        }
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })

  } catch (error) {
    console.error('Ошибка в API онбординга:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}
