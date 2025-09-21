import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { openai, MODELS } from '@/lib/openai'
import { buildOnboardingSystemPrompt } from '@/lib/onboarding'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Необходима авторизация' }, 
        { status: 401 }
      )
    }

    // Находим или создаем профиль пользователя
    let profile = await prisma.profile.findUnique({
      where: { userId: session.user.id }
    })

    if (!profile) {
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
          profileStrength: 10
        }
      })
    }

    // Создаем специальную сессию онбординга
    const welcomeMessage = await getSmartOnboardingWelcomeMessage(profile.id, session.user.name || 'Коллега')
    
    const onboardingSession = await prisma.chatSession.create({
      data: {
        profileId: profile.id,
        title: "🚀 Онбординг-интервью",
        messages: {
          create: {
            role: 'ASSISTANT',
            content: welcomeMessage
          }
        }
      },
      include: { messages: { orderBy: { createdAt: 'asc' } } }
    })

    return NextResponse.json({
      sessionId: onboardingSession.id,
      welcomeMessage: onboardingSession.messages[0].content,
      profile: {
        level: profile.level,
        xp: profile.xp,
        tCoins: profile.tCoins
      }
    })

  } catch (error) {
    console.error('Ошибка при запуске онбординга:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

async function getSmartOnboardingWelcomeMessage(profileId: string, userName: string): Promise<string> {
  const profile = await prisma.profile.findUnique({
    where: { id: profileId },
    include: {
      userSkills: {
        include: { skill: true }
      },
      userProjects: {
        include: { project: true }
      },
      careerGoals: true
    }
  })

  if (!profile) {
    return getBasicWelcomeMessage(userName)
  }

  // Анализируем что уже знаем
  const hasJobTitle = !!profile.jobTitle
  const hasDepartment = !!profile.department  
  const hasSkills = profile.userSkills.length > 0
  const hasProjects = profile.userProjects.length > 0
  const hasGoals = profile.careerGoals.length > 0

  let message = `Привет, ${userName}! 👋

Добро пожаловать в T1! Я Навигатор — твой ИИ-консультант по карьере.

Давай за 5-7 минут создадим твой идеальный профиль! 🚀

**За прохождение ты получишь:**
- 🏆 **200 T-Coins** за завершение
- ⭐ **Бонус 50 T-Coins** за скорость
- 🎯 **Персональный план развития**
- 📈 **Мгновенный буст профиля до 60%**

---

`

  // Показываем что уже знаем (создаем wow-эффект)
  if (hasJobTitle || hasDepartment || hasSkills) {
    message += `**🧠 Я уже знаю о тебе:**\n`
    
    if (hasJobTitle) {
      message += `✅ Должность: **${profile.jobTitle}**\n`
    }
    
    if (hasDepartment) {
      message += `✅ Отдел: **${profile.department}**\n`
    }
    
    if (hasSkills) {
      const skillNames = profile.userSkills.slice(0, 3).map(us => us.skill.name)
      message += `✅ Навыки: **${skillNames.join(', ')}**${profile.userSkills.length > 3 ? ` и еще ${profile.userSkills.length - 3}` : ''}\n`
    }
    
    message += `\n`
  }

  // Определяем следующий шаг в зависимости от данных
  if (!hasJobTitle) {
    message += `Расскажи про твою **текущую роль** — что именно делаешь в команде?`
  } else if (!hasSkills || profile.userSkills.length < 3) {
    message += `Отлично! Теперь расскажи про **основные технологии**, с которыми работаешь. Какие 3-5 главных навыков используешь ежедневно?`
  } else if (!hasProjects) {
    message += `Круто! А теперь расскажи про свой **самый интересный проект** — что делал, какую роль играл, чего добился?`
  } else if (!hasGoals) {
    message += `Супер! Последний важный вопрос — **куда планируешь развиваться?** Senior, тимлид, архитектор, или может в другую область?`
  } else {
    message += `Отличный профиль! Давай **дополним детали** — расскажи больше о том, что тебе особенно нравится в работе?`
  }

  return message
}

function getBasicWelcomeMessage(userName: string): string {
  return `Привет, ${userName}! 👋

Добро пожаловать в T1! Я Навигатор — твой ИИ-консультант по карьере. 

Давай за 5-7 минут создадим твой идеальный профиль и сразу найдем лучшие возможности в компании! 

**За прохождение онбординга ты получишь:**
- 🏆 **200 T-Coins** за завершение
- ⭐ **Бонус 50 T-Coins** если пройдешь быстро  
- 🎯 **Персональный план развития** 
- 📈 **Мгновенный буст профиля до 60%**

Готов начать? Расскажи мне — **как тебя зовут и чем занимаешься в IT?**`
}

