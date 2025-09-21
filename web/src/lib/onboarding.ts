import { prisma } from '@/lib/prisma'

// Специальный системный промпт для онбординга  
export async function buildOnboardingSystemPrompt(userId: string): Promise<string> {
  const profile = await prisma.profile.findUnique({
    where: { userId },
    include: {
      user: {
        select: {
          name: true,
          email: true
        }
      },
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
    return getBasicOnboardingPrompt()
  }

  // Анализируем что уже знаем
  const knownData = analyzeKnownData(profile)
  const missingData = analyzeMissingData(profile)

  return `Ты - Навигатор, ИИ-консультант для УМНОГО ОНБОРДИНГА сотрудников T1.

🎯 ГЛАВНЫЙ ПРИНЦИП: "Покажи что знаешь, спроси чего не знаешь"

📋 ЧТО УЖЕ ИЗВЕСТНО О СОТРУДНИКЕ:
${knownData.length > 0 ? knownData.map(item => `✅ ${item}`).join('\n') : '❌ Минимальная информация'}

🔍 ЧТО НУЖНО УЗНАТЬ (приоритеты):
${missingData.map((item, index) => `${index + 1}. ${item}`).join('\n')}

📊 ТЕКУЩИЙ СТАТУС:
- Имя: ${profile.user.name || 'Не указано'}
- Должность: ${profile.jobTitle || '❓ Неизвестна'}
- Отдел: ${profile.department || '❓ Не указан'}
- Навыки: ${profile.userSkills.length} (цель: 5-8)
- Проекты: ${profile.userProjects.length} (цель: 1-2 с достижениями)
- Карьерные цели: ${profile.careerGoals.length} (цель: 1-2)
- Уровень: ${profile.level} (${profile.xp} XP)
- T-Coins: ${profile.tCoins}

🚀 СТРАТЕГИЯ ИНТЕРВЬЮ:
1. **ПРИЗНАНИЕ** - покажи что ты уже знаешь про него (создай wow-эффект)
2. **ДОЗАПОЛНЕНИЕ** - умно спроси только НЕДОСТАЮЩЕЕ
3. **ПЕРСОНАЛИЗАЦИЯ** - вопросы под его роль/отдел
4. **МОТИВАЦИЯ** - объясняй ценность каждого ответа

✅ ПРАВИЛА:
- НЕ спрашивай то, что уже знаешь
- НЕ дублируй информацию
- Задавай 1 конкретный вопрос за раз
- Хвали за каждый ответ + упоминай T-Coins
- В финале дай конкретный план развития

Веди интервью умно, персонализированно и с энтузиазмом!`
}

// Анализируем что уже известно о пользователе
function analyzeKnownData(profile: any): string[] {
  const known: string[] = []

  if (profile.jobTitle) {
    known.push(`Должность: ${profile.jobTitle}`)
  }
  
  if (profile.department) {
    known.push(`Отдел: ${profile.department}`)
  }

  if (profile.userSkills.length > 0) {
    const skillNames = profile.userSkills.map((us: any) => us.skill.name).slice(0, 3)
    known.push(`Навыки: ${skillNames.join(', ')}${profile.userSkills.length > 3 ? ` и еще ${profile.userSkills.length - 3}` : ''}`)
  }

  if (profile.userProjects.length > 0) {
    known.push(`Участвовал в ${profile.userProjects.length} проекте(ах)`)
  }

  if (profile.careerGoals.length > 0) {
    known.push(`Карьерные цели: ${profile.careerGoals.map((cg: any) => cg.target).join(', ')}`)
  }

  if (profile.xp > 100) {
    known.push(`Опытный пользователь (${profile.xp} XP)`)
  }

  return known
}

// Анализируем что нужно узнать
function analyzeMissingData(profile: any): string[] {
  const missing: string[] = []

  if (!profile.jobTitle) {
    missing.push("Текущая должность и роль в команде")
  }

  if (!profile.department) {
    missing.push("Отдел и направление работы")
  }

  if (profile.userSkills.length < 3) {
    missing.push("Основные технологии и навыки (цель: 5-8 навыков)")
  } else if (profile.userSkills.length < 5) {
    missing.push("Дополнительные навыки для полноты профиля")
  }

  if (profile.userProjects.length === 0) {
    missing.push("Самый интересный/крупный проект + роль + достижения")
  } else {
    const projectsWithoutAchievements = profile.userProjects.filter((up: any) => !up.achievements).length
    if (projectsWithoutAchievements > 0) {
      missing.push("Конкретные достижения в проектах (что сделал, какой результат)")
    }
  }

  if (profile.careerGoals.length === 0) {
    missing.push("Карьерные планы: куда развиваться, что изучать")
  }

  // Спрашиваем про стиль работы и предпочтения только если основное уже есть
  if (profile.userSkills.length >= 3 && profile.userProjects.length >= 1) {
    missing.push("Что больше нравится: техническая экспертиза или управление командой")
    missing.push("Какие направления T1 интересны для развития")
  }

  return missing.slice(0, 4) // Ограничиваем до 4 приоритетных пунктов
}

// Базовый промпт для случаев, когда профиль не найден
function getBasicOnboardingPrompt(): string {
  return `Ты - Навигатор, ИИ-консультант для онбординга новых сотрудников T1.

ЗАДАЧА: Создать профиль с нуля за 5-7 минут.

ЭТАПЫ:
1. Представься и узнай имя
2. Должность и роль  
3. Основные навыки (3-5)
4. Лучший проект + достижения
5. Карьерные цели
6. Финальный план развития

ПРАВИЛА:
- Задавай по 1 вопросу за раз
- Хвали каждый ответ
- Упоминай T-Coins за активность
- Веди дружелюбно и энергично

Начинай с приветствия и знакомства!`
}
