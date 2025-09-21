import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { openai, MODELS } from '@/lib/openai'
import { z } from 'zod'

const chatRequestSchema = z.object({
  message: z.string().min(1, 'Сообщение не может быть пустым'),
  sessionId: z.string().optional(),
  context: z.object({
    triggerSource: z.string().optional(),
    timestamp: z.string().optional()
  }).optional()
})

function getContextualIntro(triggerSource?: string) {
  const contextIntros = {
    'profile': 'КОНТЕКСТ: Пользователь редактирует профиль. Акцент на советы по заполнению, улучшению профиля и получению XP.',
    'dashboard': 'КОНТЕКСТ: Пользователь на главном дашборде. Акцент на персональные рекомендации и следующие шаги развития.',
    'projects': 'КОНТЕКСТ: Пользователь просматривает проекты. Акцент на подходящие проекты и описание достижений.',
    'manager': 'КОНТЕКСТ: Вызов менеджером. Акцент на поиск талантов, оценку команды, подбор кандидатов.',
    'hr': 'КОНТЕКСТ: Вызов HR-специалистом. Акцент на аналитику, тенденции, кадровые инсайты.',
    default: 'КОНТЕКСТ: Общий разговор о карьерном развитии.'
  }
  
  return contextIntros[triggerSource as keyof typeof contextIntros] || contextIntros.default
}

async function buildSystemPrompt(userId: string, context?: { triggerSource?: string }) {
  console.log('🧠 Building enhanced system prompt with corporate data...')
  
  // Загружаем профиль пользователя
  const profile = await prisma.profile.findUnique({
    where: { userId },
    include: {
      userSkills: {
        include: { skill: true }
      },
      userProjects: {
        include: { project: true }
      },
      careerGoals: true,
      badges: {
        include: { badge: true }
      }
    }
  })

  if (!profile) {
    return "Ты - Навигатор, внутренний карьерный ИИ-консультант в компании T1. Помогай пользователю с карьерными вопросами."
  }

  // КОРПОРАТИВНЫЕ ДАННЫЕ: Загружаем релевантные возможности с ограничениями
  console.log('🏢 Loading corporate opportunities...')
  
  // Активные проекты (ограничиваем до 5)
  const availableProjects = await prisma.project.findMany({
    where: { status: 'ACTIVE' },
    select: { 
      name: true, 
      description: true 
    },
    orderBy: { updatedAt: 'desc' },
    take: 5
  })
  
  // Открытые вакансии (приоритет по отделу пользователя)
  const openJobs = await prisma.jobOpening.findMany({
    where: { 
      status: 'OPEN',
      ...(profile.department ? {
        OR: [
          { department: profile.department },
          { department: { contains: 'IT' } } 
        ]
      } : {})
    },
    select: { 
      title: true, 
      department: true, 
      level: true, 
      requirements: true 
    },
    take: 4
  })
  
  // Релевантные курсы (на основе навыков которые хочет изучить)
  const wantToLearnSkillNames = profile.userSkills
    .filter((us: any) => us.status === 'WANTS_TO_LEARN')
    .map((us: any) => us.skill.name.toLowerCase())
    
  const availableCourses = await prisma.course.findMany({
    where: { 
      status: 'ACTIVE',
      ...(wantToLearnSkillNames.length > 0 ? {
        OR: wantToLearnSkillNames.flatMap((skillName: string) => [
          { skills: { has: skillName } },
          { title: { contains: skillName, mode: 'insensitive' } }
        ])
      } : {})
    },
    select: { 
      title: true, 
      category: true, 
      level: true, 
      skills: true, 
      xpReward: true 
    },
    take: 5
  })
  
  // Менторские программы 
  const mentorPrograms = await prisma.mentorProgram.findMany({
    where: { 
      status: 'ACTIVE',
      ...(wantToLearnSkillNames.length > 0 ? {
        skills: {
          hasSome: wantToLearnSkillNames
        }
      } : {})
    },
    select: { 
      title: true, 
      description: true, 
      skills: true 
    },
    take: 3
  })
  
  console.log(`📊 Loaded: ${availableProjects.length} projects, ${openJobs.length} jobs, ${availableCourses.length} courses, ${mentorPrograms.length} mentor programs`)
  
  // ЛИЧНЫЕ ДАННЫЕ ПОЛЬЗОВАТЕЛЯ  
  const currentSkills = profile.userSkills
    .filter((us: any) => us.status === 'USING')
    .map((us: any) => `${us.skill.name} (уровень ${us.level}/5)`)
    .join(', ')

  const wantToLearnSkills = profile.userSkills
    .filter((us: any) => us.status === 'WANTS_TO_LEARN')
    .map((us: any) => us.skill.name)
    .join(', ')

  const recentProjects = profile.userProjects
    .filter((up: any) => up.achievements)
    .slice(0, 3)
    .map((up: any) => `${up.project.name} (роль: ${up.roleInProject}, достижения: ${up.achievements})`)
    .join('; ')

  const careerGoals = profile.careerGoals
    .map((cg: any) => `${cg.goalType}: ${cg.target}`)
    .join('; ')

  const recentBadges = profile.badges
    .slice(0, 3)
    .map((ub: any) => ub.badge.name)
    .join(', ')

  const contextualIntro = getContextualIntro(context?.triggerSource)

  return `Ты - Навигатор, внутренний карьерный ИИ-консультант в компании T1. Твоя задача - помогать сотрудникам развиваться внутри компании.

${contextualIntro}

ВАЖНЫЕ ПРИНЦИПЫ:
- Ты дружелюбен, мотивирующий, но профессионален
- Всегда основывай советы на реальных данных профиля сотрудника
- Рекомендуй ТОЛЬКО конкретные возможности из списков ниже
- НЕ выдумывай несуществующие проекты, курсы или вакансии
- Мотивируй заполнять профиль для получения XP и бейджей
- Давай конкретные, практичные советы

ДАННЫЕ О СОТРУДНИКЕ:
- Должность: ${profile.jobTitle || 'не указана'}
- Отдел: ${profile.department || 'не указан'}
- Текущий уровень: ${profile.level} (${profile.xp} XP)
- Сила профиля: ${profile.profileStrength}%

НАВЫКИ:
- Использует: ${currentSkills || 'не указаны'}
- Хочет изучить: ${wantToLearnSkills || 'не указаны'}

ОПЫТ:
- Недавние проекты: ${recentProjects || 'не описаны'}

КАРЬЕРНЫЕ ЦЕЛИ:
- ${careerGoals || 'не указаны'}

НЕДАВНИЕ ДОСТИЖЕНИЯ:
- Бейджи: ${recentBadges || 'нет'}

🏢 ДОСТУПНЫЕ ВОЗМОЖНОСТИ В КОМПАНИИ:

📋 АКТИВНЫЕ ПРОЕКТЫ (рекомендуй эти конкретные проекты):
${availableProjects.map((p: any) => `- "${p.name}": ${p.description || 'проект для развития навыков'}`).join('\n')}

💼 ОТКРЫТЫЕ ВАКАНСИИ (рекомендуй для карьерного роста):
${openJobs.map((j: any) => `- "${j.title}" (${j.department}, ${j.level}) - требует: ${j.requirements.join(', ')}`).join('\n')}

📚 ДОСТУПНЫЕ КУРСЫ (рекомендуй для изучения навыков):
${availableCourses.map((c: any) => `- "${c.title}" (${c.category}, ${c.level}) - развивает: ${c.skills.join(', ')} [+${c.xpReward} XP]`).join('\n')}

👥 МЕНТОРСКИЕ ПРОГРАММЫ:
${mentorPrograms.map((m: any) => `- "${m.title}": ${m.description} (навыки: ${m.skills.join(', ')})`).join('\n')}

СПОСОБЫ ПОЛУЧЕНИЯ XP:
- Заполнение достижений в проектах: +100-200 XP
- Завершение курса: +${availableCourses[0]?.xpReward || 50} XP
- Получение подтверждения навыка: +50 XP
- Добавление нового навыка: +25 XP
- Обновление карьерных целей: +30 XP

РЕКОМЕНДАЦИИ ДЛЯ ОТВЕТОВ:
1. Если профиль заполнен слабо (< 60%) - мотивируй его дополнить
2. Если есть проекты без описания достижений - предлагай их заполнить
3. Рекомендуй КОНКРЕТНЫЕ проекты и курсы из списков выше
4. Упоминай точные суммы XP за действия
5. Предлагай конкретные вакансии для роста

Отвечай на русском языке, используй имя пользователя из контекста диалога.`
}

export async function POST(request: NextRequest) {
  try {
    console.log('🤖 AI Chat API called')
    
    const session = await getServerSession(authOptions)
    console.log('📝 Session check:', { hasSession: !!session, userId: session?.user?.id })
    
    if (!session?.user?.id) {
      console.log('❌ No session or user ID')
      return NextResponse.json(
        { error: 'Необходима авторизация' }, 
        { status: 401 }
      )
    }

    const body = await request.json()
    console.log('📦 Request body:', JSON.stringify(body, null, 2))
    
    const validation = chatRequestSchema.safeParse(body)
    console.log('✅ Validation result:', { success: validation.success })
    
    if (!validation.success) {
      console.log('❌ Validation failed:', validation.error.errors)
      return NextResponse.json(
        { error: 'Некорректные данные', details: validation.error.errors },
        { status: 400 }
      )
    }

    // Проверяем SCIBOX_API_KEY
    console.log('🔑 SCIBOX_API_KEY exists:', !!process.env.SCIBOX_API_KEY)
    console.log('🔑 SCIBOX_API_KEY first 10 chars:', process.env.SCIBOX_API_KEY?.substring(0, 10) + '...')
    console.log('🌐 SCIBOX_API_BASE_URL:', process.env.SCIBOX_API_BASE_URL)

    const { message, sessionId, context } = validation.data
    console.log('📝 Extracted data:', { message: message.substring(0, 50) + '...', sessionId, context })

    // Получаем или создаем сессию чата
    let chatSession
    if (sessionId) {
      console.log('🔍 Searching for existing session:', sessionId)
      console.log('🔍 Current user ID:', session.user.id)
      
      chatSession = await prisma.chatSession.findUnique({
        where: { id: sessionId },
        include: { messages: { orderBy: { createdAt: 'asc' } } }
      })
      
      console.log('🔍 Found chatSession:', chatSession ? {
        id: chatSession.id,
        profileId: chatSession.profileId,
        messagesCount: chatSession.messages.length
      } : 'null')
      
      if (!chatSession) {
        console.log('❌ ChatSession not found in DB')
        return NextResponse.json(
          { error: 'Сессия чата не найдена' },
          { status: 404 }
        )
      }
      
      // Находим профиль пользователя для правильной проверки
      const userProfile = await prisma.profile.findUnique({
        where: { userId: session.user.id }
      })
      
      console.log('🔍 User profile:', userProfile ? {
        id: userProfile.id,
        userId: userProfile.userId
      } : 'null')
      
      if (!userProfile || chatSession.profileId !== userProfile.id) {
        console.log('❌ Session ownership check failed:', {
          chatSessionProfileId: chatSession.profileId,
          userProfileId: userProfile?.id,
          sessionUserId: session.user.id
        })
        return NextResponse.json(
          { error: 'Сессия чата не найдена' },
          { status: 404 }
        )
      }
      
      console.log('✅ Session ownership verified')
    } else {
      console.log('🆕 Creating new chat session for user:', session.user.id)
      
      // Находим профиль пользователя
      let profile = await prisma.profile.findUnique({
        where: { userId: session.user.id }
      })
      
      console.log('🔍 Existing profile:', profile ? {
        id: profile.id,
        userId: profile.userId
      } : 'null')

      if (!profile) {
        // Если профиля нет, создаем пользователя и профиль
        let user = await prisma.user.findUnique({
          where: { id: session.user.id }
        })

        if (!user) {
          user = await prisma.user.create({
            data: {
              id: session.user.id,
              email: session.user.email || '',
              name: session.user.name || 'Пользователь',
              role: (session.user as any).role || 'EMPLOYEE'
            }
          })
        }

        profile = await prisma.profile.create({
          data: {
            userId: user.id,
            xp: 50,
            level: 1,
            profileStrength: 20
          }
        })
      }

      console.log('🆕 Creating new chat session with profile ID:', profile.id)
      
      chatSession = await prisma.chatSession.create({
        data: {
          profileId: profile.id,
          title: message.substring(0, 50) + (message.length > 50 ? '...' : ''),
          messages: {
            create: {
              role: 'USER',
              content: message
            }
          }
        },
        include: { messages: { orderBy: { createdAt: 'asc' } } }
      })
      
      console.log('✅ Created new chat session:', {
        id: chatSession.id,
        profileId: chatSession.profileId,
        messagesCount: chatSession.messages.length
      })
    }

    // Если это существующая сессия, добавляем новое сообщение пользователя
    if (sessionId) {
      await prisma.chatMessage.create({
        data: {
          sessionId: chatSession.id,
          role: 'USER',
          content: message
        }
      })
    }

    // Строим системный промпт на основе профиля
    console.log('🧠 Building system prompt for user:', session.user.id)
    const systemPrompt = await buildSystemPrompt(session.user.id, context)
    console.log('🧠 System prompt length:', systemPrompt.length)

    // Подготавливаем историю сообщений для OpenAI
    const messages = [
      { role: 'system' as const, content: systemPrompt },
      ...chatSession.messages.map((msg: any) => ({
        role: msg.role.toLowerCase() as 'user' | 'assistant',
        content: msg.content
      })),
      // Если это новое сообщение в существующей сессии, добавляем его
      ...(sessionId ? [{ role: 'user' as const, content: message }] : [])
    ]

    console.log('💬 Messages prepared:', messages.length, 'messages')
    console.log('🚀 Calling SciBox API with model:', MODELS.CHAT)

    // Вызываем SciBox API
    const completion = await openai.chat.completions.create({
      model: MODELS.CHAT,
      messages: messages,
      stream: true,
      temperature: 0.7,
      max_tokens: 1000,
    })

    console.log('✅ SciBox API call successful, got completion object')

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

          // Сохраняем полное сообщение ассистента в БД
          await prisma.chatMessage.create({
            data: {
              sessionId: chatSession.id,
              role: 'ASSISTANT',
              content: assistantMessage
            }
          })

          // Отправляем финальное событие с sessionId
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ 
              done: true, 
              sessionId: chatSession.id 
            })}\n\n`)
          )
          
          controller.close()
        } catch (error) {
          console.error('Ошибка в streaming:', error)
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
    console.error('❌ Ошибка в AI chat API:', error)
    console.error('❌ Error type:', error?.constructor?.name)
    console.error('❌ Error message:', (error as any)?.message)
    console.error('❌ Stack trace:', (error as any)?.stack)
    
    // Если это ошибка валидации или клиентская ошибка, возвращаем 400
    if ((error as any)?.message?.includes('validation') || (error as any)?.message?.includes('invalid')) {
      return NextResponse.json(
        { error: 'Ошибка валидации данных', details: (error as any).message },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера', details: (error as any)?.message || 'Unknown error' },
      { status: 500 }
    )
  }
}
