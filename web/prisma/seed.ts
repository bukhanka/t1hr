import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const demoSkills = [
  // Programming Languages
  { name: 'JavaScript', category: 'Языки программирования', description: 'Современный язык для веб-разработки' },
  { name: 'TypeScript', category: 'Языки программирования', description: 'Типизированный JavaScript' },
  { name: 'Python', category: 'Языки программирования', description: 'Универсальный язык программирования' },
  { name: 'Java', category: 'Языки программирования', description: 'Корпоративный язык программирования' },
  { name: 'Go', category: 'Языки программирования', description: 'Современный системный язык' },
  { name: 'Rust', category: 'Языки программирования', description: 'Безопасный системный язык' },
  { name: 'Kotlin', category: 'Языки программирования', description: 'Современная альтернатива Java' },
  { name: 'C#', category: 'Языки программирования', description: 'Язык платформы .NET' },
  
  // Frontend Technologies
  { name: 'React', category: 'Frontend технологии', description: 'Популярная библиотека для UI' },
  { name: 'Vue.js', category: 'Frontend технологии', description: 'Прогрессивный фреймворк' },
  { name: 'Angular', category: 'Frontend технологии', description: 'Полноценный фреймворк от Google' },
  { name: 'Next.js', category: 'Frontend технологии', description: 'React фреймворк для продакшена' },
  { name: 'HTML/CSS', category: 'Frontend технологии', description: 'Основы веб-разработки' },
  { name: 'Tailwind CSS', category: 'Frontend технологии', description: 'Утилитарный CSS фреймворк' },
  
  // Backend Technologies  
  { name: 'Node.js', category: 'Backend технологии', description: 'JavaScript на сервере' },
  { name: 'Express.js', category: 'Backend технологии', description: 'Веб-фреймворк для Node.js' },
  { name: 'Spring Boot', category: 'Backend технологии', description: 'Java фреймворк для микросервисов' },
  { name: 'Django', category: 'Backend технологии', description: 'Python веб-фреймворк' },
  { name: 'FastAPI', category: 'Backend технологии', description: 'Быстрый API фреймворк на Python' },
  
  // Databases
  { name: 'PostgreSQL', category: 'Базы данных', description: 'Объектно-реляционная СУБД' },
  { name: 'MySQL', category: 'Базы данных', description: 'Популярная реляционная СУБД' },
  { name: 'MongoDB', category: 'Базы данных', description: 'NoSQL документная база' },
  { name: 'Redis', category: 'Базы данных', description: 'In-memory кеш и брокер сообщений' },
  
  // DevOps & Tools
  { name: 'Docker', category: 'DevOps и инструменты', description: 'Контейнеризация приложений' },
  { name: 'Kubernetes', category: 'DevOps и инструменты', description: 'Оркестрация контейнеров' },
  { name: 'Git', category: 'DevOps и инструменты', description: 'Система контроля версий' },
  { name: 'CI/CD', category: 'DevOps и инструменты', description: 'Непрерывная интеграция и доставка' },
  { name: 'AWS', category: 'DevOps и инструменты', description: 'Облачная платформа Amazon' },
  { name: 'Linux', category: 'DevOps и инструменты', description: 'Операционная система Unix-подобная' },
  
  // Data & Analytics
  { name: 'SQL', category: 'Аналитика и данные', description: 'Язык запросов к базам данных' },
  { name: 'Machine Learning', category: 'Аналитика и данные', description: 'Машинное обучение' },
  { name: 'Data Science', category: 'Аналитика и данные', description: 'Наука о данных' },
  { name: 'Analytics', category: 'Аналитика и данные', description: 'Анализ данных и метрик' },
  
  // Soft Skills
  { name: 'Менторство', category: 'Софт скиллы', description: 'Наставничество и развитие коллег' },
  { name: 'Управление командой', category: 'Софт скиллы', description: 'Лидерство и командная работа' },
  { name: 'Архитектура', category: 'Софт скиллы', description: 'Проектирование систем' },
  { name: 'Code Review', category: 'Софт скиллы', description: 'Ревью кода коллег' },
  { name: 'Презентации', category: 'Софт скиллы', description: 'Публичные выступления' },
  
  // Specialized
  { name: 'Kafka', category: 'Специализированные', description: 'Стриминг платформа для данных' },
  { name: 'GraphQL', category: 'Специализированные', description: 'Язык запросов для API' },
  { name: 'Microservices', category: 'Специализированные', description: 'Микросервисная архитектура' },
  { name: 'Blockchain', category: 'Специализированные', description: 'Технология распределенного реестра' },
  { name: 'WebRTC', category: 'Специализированные', description: 'Реал-тайм коммуникации в браузере' }
]

const demoProjects = [
  {
    name: 'Проект "Альфа"',
    description: 'Модернизация основной CRM системы компании с переходом на микросервисную архитектуру',
    status: 'COMPLETED' as const
  },
  {
    name: 'Проект "Бета"', 
    description: 'Разработка мобильного приложения для клиентов банка',
    status: 'ACTIVE' as const
  },
  {
    name: 'Проект "Гамма"',
    description: 'Система аналитики и отчетности в реальном времени',
    status: 'ACTIVE' as const
  },
  {
    name: 'Проект "Дельта"',
    description: 'Внедрение системы мониторинга и логирования',
    status: 'COMPLETED' as const
  },
  {
    name: 'Проект "Эпсилон"',
    description: 'Разработка платформы для интернет-эквайринга',
    status: 'ACTIVE' as const
  },
  {
    name: 'Проект "Омега"',
    description: 'Создание системы управления документооборотом',
    status: 'ACTIVE' as const
  },
  {
    name: 'Проект "Феникс"',
    description: 'Новая система онлайн-платежей с использованием Kotlin',
    status: 'ACTIVE' as const
  },
  {
    name: 'Проект "Зевс"',
    description: 'AI-платформа для анализа клиентских данных',
    status: 'ACTIVE' as const
  },
  {
    name: 'Проект "Атлас"',
    description: 'Геолокационные сервисы для мобильного банкинга',
    status: 'COMPLETED' as const
  },
  {
    name: 'Проект "Нептун"',
    description: 'Система управления рисками и фрод-мониторинг',
    status: 'ACTIVE' as const
  }
]

const demoBadges = [
  {
    name: 'Новичок',
    description: 'Добро пожаловать в команду!',
    iconUrl: '/badges/newcomer.svg',
    xpReward: 50
  },
  {
    name: 'Активный участник',
    description: 'Регулярно обновляет профиль',
    iconUrl: '/badges/active.svg',
    xpReward: 100
  },
  {
    name: 'Мастер профиля',
    description: 'Профиль заполнен на 90%+',
    iconUrl: '/badges/profile-master.svg',
    xpReward: 200
  },
  {
    name: 'Архивариус',
    description: 'Описал достижения в 5+ проектах',
    iconUrl: '/badges/archivist.svg',
    xpReward: 150
  },
  {
    name: 'Ментор',
    description: 'Подтвержденные навыки менторства',
    iconUrl: '/badges/mentor.svg',
    xpReward: 250
  },
  {
    name: 'Полиглот',
    description: 'Владеет 5+ языками программирования',
    iconUrl: '/badges/polyglot.svg',
    xpReward: 200
  },
  {
    name: 'Командный игрок',
    description: 'Участвовал в 3+ проектах',
    iconUrl: '/badges/team-player.svg',
    xpReward: 150
  },
  {
    name: 'Эксперт',
    description: 'Глубокие знания в специализации',
    iconUrl: '/badges/expert.svg',
    xpReward: 300
  },
  {
    name: 'Пионер',
    description: 'Изучает новые технологии',
    iconUrl: '/badges/pioneer.svg',
    xpReward: 100
  },
  {
    name: 'Лидер',
    description: 'Навыки руководства командой',
    iconUrl: '/badges/leader.svg',
    xpReward: 250
  }
]

const demoUsers = [
  // Employees
  { email: 'ivan.petrov@company.com', name: 'Иван Петров', role: 'EMPLOYEE' as const, jobTitle: 'Senior Frontend Developer', department: 'Разработка' },
  { email: 'elena.sidorova@company.com', name: 'Елена Сидорова', role: 'EMPLOYEE' as const, jobTitle: 'Middle Backend Developer', department: 'Разработка' },
  { email: 'dmitriy.kozlov@company.com', name: 'Дмитрий Козлов', role: 'EMPLOYEE' as const, jobTitle: 'Senior Full-Stack Developer', department: 'Разработка' },
  { email: 'anna.morozova@company.com', name: 'Анна Морозова', role: 'EMPLOYEE' as const, jobTitle: 'Junior Frontend Developer', department: 'Разработка' },
  { email: 'sergey.volkov@company.com', name: 'Сергей Волков', role: 'EMPLOYEE' as const, jobTitle: 'Middle Java Developer', department: 'Разработка' },
  { email: 'olga.nikolaeva@company.com', name: 'Ольга Николаева', role: 'EMPLOYEE' as const, jobTitle: 'Senior Data Scientist', department: 'Аналитика' },
  { email: 'mikhail.fedorov@company.com', name: 'Михаил Федоров', role: 'EMPLOYEE' as const, jobTitle: 'DevOps Engineer', department: 'Инфраструктура' },
  { email: 'julia.romanova@company.com', name: 'Юлия Романова', role: 'EMPLOYEE' as const, jobTitle: 'QA Engineer', department: 'Тестирование' },
  { email: 'alex.sokolov@company.com', name: 'Александр Соколов', role: 'EMPLOYEE' as const, jobTitle: 'System Architect', department: 'Архитектура' },
  { email: 'maria.kuznetsova@company.com', name: 'Мария Кузнецова', role: 'EMPLOYEE' as const, jobTitle: 'Product Manager', department: 'Продукт' },
  { email: 'pavel.lebedev@company.com', name: 'Павел Лебедев', role: 'EMPLOYEE' as const, jobTitle: 'Senior Python Developer', department: 'Разработка' },
  { email: 'natasha.popova@company.com', name: 'Наталья Попова', role: 'EMPLOYEE' as const, jobTitle: 'UI/UX Designer', department: 'Дизайн' },
  { email: 'roman.orlov@company.com', name: 'Роман Орлов', role: 'EMPLOYEE' as const, jobTitle: 'Team Lead Frontend', department: 'Разработка' },
  { email: 'arina.belova@company.com', name: 'Арина Белова', role: 'EMPLOYEE' as const, jobTitle: 'Middle React Developer', department: 'Разработка' },
  { email: 'viktor.petrov@company.com', name: 'Виктор Петров', role: 'EMPLOYEE' as const, jobTitle: 'Senior DevOps Engineer', department: 'Инфраструктура' },
  
  // Managers
  { email: 'svetlana.manager@company.com', name: 'Светлана Менеджерова', role: 'MANAGER' as const, jobTitle: 'Engineering Manager', department: 'Разработка' },
  { email: 'andrey.teamlead@company.com', name: 'Андрей Тимлидов', role: 'MANAGER' as const, jobTitle: 'Technical Manager', department: 'Разработка' },
  { email: 'irina.director@company.com', name: 'Ирина Директорова', role: 'MANAGER' as const, jobTitle: 'Product Director', department: 'Продукт' },
  
  // HR
  { email: 'ekaterina.hr@company.com', name: 'Екатерина HR-специалист', role: 'HR' as const, jobTitle: 'Senior HR Business Partner', department: 'HR' },
  { email: 'alexandra.talent@company.com', name: 'Александра Талантова', role: 'HR' as const, jobTitle: 'Talent Acquisition Manager', department: 'HR' }
]

async function main() {
  console.log('🌱 Начинаем заполнение базы демо-данными...')

  // Создаем навыки
  console.log('📚 Создаем навыки...')
  const skills = await Promise.all(
    demoSkills.map(skill => 
      prisma.skill.upsert({
        where: { name: skill.name },
        update: skill,
        create: skill
      })
    )
  )
  console.log(`✅ Создано ${skills.length} навыков`)

  // Создаем проекты
  console.log('🚀 Создаем проекты...')
  const projects = await Promise.all(
    demoProjects.map(project =>
      prisma.project.upsert({
        where: { name: project.name },
        update: project,
        create: project
      })
    )
  )
  console.log(`✅ Создано ${projects.length} проектов`)

  // Создаем бейджи
  console.log('🏆 Создаем бейджи...')
  const badges = await Promise.all(
    demoBadges.map(badge =>
      prisma.badge.upsert({
        where: { name: badge.name },
        update: badge,
        create: badge
      })
    )
  )
  console.log(`✅ Создано ${badges.length} бейджей`)

  // Создаем пользователей и их профили
  console.log('👥 Создаем пользователей и профили...')
  const createdUsers = []
  
  for (const userData of demoUsers) {
    // Создаем пользователя
    const user = await prisma.user.create({
      data: {
        email: userData.email,
        name: userData.name,
        role: userData.role,
        profile: {
          create: {
            jobTitle: userData.jobTitle,
            department: userData.department,
            xp: Math.floor(Math.random() * 2000) + 500, // От 500 до 2500 XP
            level: Math.floor(Math.random() * 5) + 1, // От 1 до 5 уровня
            profileStrength: Math.floor(Math.random() * 60) + 40, // От 40% до 100%
            tCoins: Math.floor(Math.random() * 400) + 100, // От 100 до 500 T-Coins
            totalEarned: Math.floor(Math.random() * 800) + 200, // От 200 до 1000 всего заработано
          }
        }
      },
      include: {
        profile: true
      }
    })
    
    createdUsers.push(user)
  }
  console.log(`✅ Создано ${createdUsers.length} пользователей`)

  // Заполняем навыки пользователей
  console.log('🎯 Назначаем навыки пользователям...')
  let skillAssignments = 0
  
  for (const user of createdUsers) {
    if (!user.profile) continue
    
    // Каждому пользователю назначаем 5-12 случайных навыков
    const numSkills = Math.floor(Math.random() * 8) + 5
    const userSkillsSet = new Set<string>()
    
    // Выбираем случайные навыки
    while (userSkillsSet.size < numSkills) {
      const randomSkill = skills[Math.floor(Math.random() * skills.length)]
      userSkillsSet.add(randomSkill.id)
    }
    
    // Создаем записи навыков
    for (const skillId of userSkillsSet) {
      await prisma.userSkill.create({
        data: {
          profileId: user.profile.id,
          skillId: skillId,
          level: Math.floor(Math.random() * 5) + 1, // 1-5
          isVerified: Math.random() > 0.7, // 30% верифицированных
          status: Math.random() > 0.8 ? 'WANTS_TO_LEARN' : 'USING'
        }
      })
      skillAssignments++
    }
  }
  console.log(`✅ Создано ${skillAssignments} связей навыков`)

  // Назначаем проекты пользователям
  console.log('📋 Назначаем проекты пользователям...')
  let projectAssignments = 0
  
  for (const user of createdUsers) {
    if (!user.profile || user.role !== 'EMPLOYEE') continue
    
    // Каждому сотруднику назначаем 2-5 проектов
    const numProjects = Math.floor(Math.random() * 4) + 2
    const userProjectsSet = new Set<string>()
    
    while (userProjectsSet.size < numProjects) {
      const randomProject = projects[Math.floor(Math.random() * projects.length)]
      userProjectsSet.add(randomProject.id)
    }
    
    for (const projectId of userProjectsSet) {
      const roles = ['Frontend Developer', 'Backend Developer', 'Full-Stack Developer', 'Team Lead', 'Architect', 'DevOps Engineer', 'QA Engineer']
      const achievements = [
        'Увеличил производительность системы на 25% за счет оптимизации запросов к БД',
        'Разработал архитектуру микросервисов, что позволило масштабировать приложение',
        'Внедрил автоматизированное тестирование, сократив количество багов на 40%',
        'Оптимизировал CI/CD pipeline, ускорив деплой в 3 раза',
        'Провел рефакторинг legacy кода, улучшив читаемость и maintainability',
        'Настроил мониторинг и алертинг, обеспечив 99.9% uptime сервиса',
        'Разработал API, которое обрабатывает 10,000+ запросов в секунду',
        'Внедрил Kafka для стриминга данных, улучшив производительность в 2 раза'
      ]
      
      await prisma.userProject.create({
        data: {
          profileId: user.profile.id,
          projectId: projectId,
          roleInProject: roles[Math.floor(Math.random() * roles.length)],
          achievements: Math.random() > 0.3 ? achievements[Math.floor(Math.random() * achievements.length)] : null,
          startDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000), // Случайная дата в течение года
          endDate: Math.random() > 0.6 ? new Date() : null
        }
      })
      projectAssignments++
    }
  }
  console.log(`✅ Создано ${projectAssignments} назначений на проекты`)

  // Добавляем карьерные цели
  console.log('🎯 Добавляем карьерные цели...')
  let careerGoals = 0
  
  const goalTypes = ['Вертикальный рост', 'Горизонтальный переход', 'Экспертный рост', 'Менеджерский путь']
  const targets = [
    'Senior Developer', 'Team Lead', 'Architect', 'Principal Engineer', 
    'Product Manager', 'DevOps Engineer', 'Data Scientist', 'Engineering Manager',
    'Technical Director', 'CTO', 'Staff Engineer'
  ]
  
  for (const user of createdUsers) {
    if (!user.profile || user.role !== 'EMPLOYEE') continue
    
    // 1-2 карьерные цели на человека
    const numGoals = Math.floor(Math.random() * 2) + 1
    
    for (let i = 0; i < numGoals; i++) {
      await prisma.careerGoal.create({
        data: {
          profileId: user.profile.id,
          goalType: goalTypes[Math.floor(Math.random() * goalTypes.length)],
          target: targets[Math.floor(Math.random() * targets.length)],
          priority: Math.floor(Math.random() * 5) + 1
        }
      })
      careerGoals++
    }
  }
  console.log(`✅ Создано ${careerGoals} карьерных целей`)

  // Назначаем бейджи пользователям
  console.log('🏅 Назначаем бейджи пользователям...')
  let badgeAssignments = 0
  
  for (const user of createdUsers) {
    if (!user.profile || user.role !== 'EMPLOYEE') continue
    
    // Каждый получает 1-4 бейджа
    const numBadges = Math.floor(Math.random() * 4) + 1
    const userBadgesSet = new Set<string>()
    
    while (userBadgesSet.size < numBadges) {
      const randomBadge = badges[Math.floor(Math.random() * badges.length)]
      userBadgesSet.add(randomBadge.id)
    }
    
    for (const badgeId of userBadgesSet) {
      await prisma.userBadge.create({
        data: {
          profileId: user.profile.id,
          badgeId: badgeId,
          awardedAt: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000) // За последние 3 месяца
        }
      })
      badgeAssignments++
    }
  }
  console.log(`✅ Назначено ${badgeAssignments} бейджей`)

  // Создаем несколько вакансий
  console.log('💼 Создаем вакансии...')
  const jobOpenings = [
    {
      title: 'Senior Full-Stack Developer',
      description: 'Ищем опытного разработчика для работы над продуктовой командой. Технологии: React, Node.js, PostgreSQL, Docker.',
      department: 'Разработка',
      requirements: ['React', 'Node.js', 'PostgreSQL', 'Docker', 'TypeScript'],
      level: 'Senior',
      status: 'OPEN' as const
    },
    {
      title: 'DevOps Engineer',
      description: 'Специалист по автоматизации и инфраструктуре для поддержки высоконагруженных сервисов.',
      department: 'Инфраструктура', 
      requirements: ['Kubernetes', 'Docker', 'AWS', 'Linux', 'CI/CD'],
      level: 'Middle',
      status: 'OPEN' as const
    },
    {
      title: 'Team Lead Frontend',
      description: 'Руководитель команды фронтенд разработки с опытом менторства и управления проектами.',
      department: 'Разработка',
      requirements: ['React', 'TypeScript', 'Менторство', 'Управление командой', 'Архитектура'],
      level: 'Senior',
      status: 'OPEN' as const
    }
  ]
  
  const createdJobOpenings = await Promise.all(
    jobOpenings.map(job =>
      prisma.jobOpening.create({
        data: job
      })
    )
  )
  console.log(`✅ Создано ${createdJobOpenings.length} вакансий`)

  // Создаем курсы
  console.log('📚 Создаем курсы обучения...')
  const courses = [
    {
      title: 'Микросервисы на Spring Boot',
      description: 'Изучение архитектуры микросервисов и их реализации на Spring Boot',
      category: 'Техническое',
      level: 'Middle',
      duration: 40,
      format: 'Online',
      skills: ['java', 'spring', 'microservices'],
      xpReward: 150,
      status: 'ACTIVE' as const
    },
    {
      title: 'Machine Learning для начинающих',
      description: 'Основы машинного обучения и нейронных сетей',
      category: 'Техническое',
      level: 'Junior',
      duration: 60,
      format: 'Hybrid',
      skills: ['python', 'machine learning', 'tensorflow'],
      xpReward: 200,
      status: 'ACTIVE' as const
    },
    {
      title: 'React и TypeScript',
      description: 'Современная фронтенд разработка с использованием React и TypeScript',
      category: 'Техническое',
      level: 'Middle',
      duration: 32,
      format: 'Online',
      skills: ['react', 'typescript', 'javascript'],
      xpReward: 120,
      status: 'ACTIVE' as const
    },
    {
      title: 'Лидерство в IT',
      description: 'Навыки управления техническими командами и проектами',
      category: 'Менеджмент',
      level: 'Senior',
      duration: 24,
      format: 'Offline',
      skills: ['leadership', 'mentoring', 'management'],
      xpReward: 100,
      status: 'ACTIVE' as const
    },
    {
      title: 'Docker и Kubernetes',
      description: 'Контейнеризация и оркестрация приложений',
      category: 'Техническое',
      level: 'Middle',
      duration: 48,
      format: 'Online',
      skills: ['docker', 'kubernetes', 'devops'],
      xpReward: 180,
      status: 'ACTIVE' as const
    },
    {
      title: 'Python для Data Science',
      description: 'Анализ данных и машинное обучение на Python',
      category: 'Техническое',
      level: 'Junior',
      duration: 56,
      format: 'Hybrid',
      skills: ['python', 'data science', 'analytics'],
      xpReward: 160,
      status: 'ACTIVE' as const
    }
  ]
  
  const createdCourses = await Promise.all(
    courses.map(course =>
      prisma.course.create({
        data: course
      })
    )
  )
  console.log(`✅ Создано ${createdCourses.length} курсов`)

  // Создаем менторские программы
  console.log('👨‍🏫 Создаем менторские программы...')
  
  // Найдем опытных пользователей для роли менторов
  const seniorUsers = createdUsers.filter(user => 
    user.profile && 
    (user.profile.jobTitle?.includes('Senior') || user.profile.jobTitle?.includes('Lead'))
  )
  
  const mentorPrograms = [
    {
      title: 'Junior → Middle Developer',
      description: 'Программа развития для Junior разработчиков с целью перехода на Middle уровень',
      skills: ['java', 'python', 'javascript', 'react'],
      mentorId: seniorUsers[0]?.id || 'mentor-1',
      maxSlots: 5,
      status: 'ACTIVE'
    },
    {
      title: 'Путь в Data Science',
      description: 'Менторинг для перехода в Data Science из других областей разработки',
      skills: ['python', 'machine learning', 'statistics', 'analytics'],
      mentorId: seniorUsers[1]?.id || 'mentor-2',
      maxSlots: 3,
      status: 'ACTIVE'
    },
    {
      title: 'Tech Lead Bootcamp',
      description: 'Развитие лидерских навыков для технических специалистов',
      skills: ['leadership', 'architecture', 'mentoring', 'management'],
      mentorId: seniorUsers[2]?.id || 'mentor-3',
      maxSlots: 4,
      status: 'ACTIVE'
    },
    {
      title: 'DevOps для разработчиков',
      description: 'Изучение DevOps практик и инструментов',
      skills: ['docker', 'kubernetes', 'aws', 'ci/cd'],
      mentorId: seniorUsers[3]?.id || 'mentor-4',
      maxSlots: 6,
      status: 'ACTIVE'
    }
  ]
  
  const createdMentorPrograms = await Promise.all(
    mentorPrograms.map(program =>
      prisma.mentorProgram.create({
        data: program
      })
    )
  )
  console.log(`✅ Создано ${createdMentorPrograms.length} менторских программ`)

  // Записываем несколько пользователей на курсы
  console.log('🎓 Записываем пользователей на курсы...')
  let courseEnrollments = 0
  
  for (const user of createdUsers.slice(0, 10)) { // Первые 10 пользователей
    if (!user.profile) continue
    
    // Каждый записывается на 1-2 курса
    const numCourses = Math.floor(Math.random() * 2) + 1
    const selectedCourses = createdCourses
      .sort(() => 0.5 - Math.random())
      .slice(0, numCourses)
    
    for (const course of selectedCourses) {
      const statuses = ['PLANNED', 'IN_PROGRESS', 'COMPLETED'] as const
      const status = statuses[Math.floor(Math.random() * statuses.length)]
      
      await prisma.userCourse.create({
        data: {
          profileId: user.profile.id,
          courseId: course.id,
          status: status,
          startDate: status !== 'PLANNED' ? new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000) : null,
          completedAt: status === 'COMPLETED' ? new Date() : null,
          xpAwarded: status === 'COMPLETED' ? course.xpReward : 0,
          progress: status === 'COMPLETED' ? 100 : Math.floor(Math.random() * 80) + 10
        }
      })
      courseEnrollments++
    }
  }
  console.log(`✅ Создано ${courseEnrollments} записей на курсы`)

  // Создаем T-Coin транзакции для истории
  console.log('💰 Создаем T-Coin транзакции...')
  let tcoinTransactions = 0
  
  const transactionSources = [
    { source: 'skill_added', description: 'Добавление навыка (+25 T-Coins)', amount: 25 },
    { source: 'project_achievement_added', description: 'Описание достижений (+100 T-Coins)', amount: 100 },
    { source: 'career_goal_set', description: 'Постановка карьерной цели (+50 T-Coins)', amount: 50 },
    { source: 'profile_updated', description: 'Обновление профиля (+15 T-Coins)', amount: 15 },
    { source: 'chat_with_ai', description: 'Общение с ИИ-навигатором (+5 T-Coins)', amount: 5 },
    { source: 'merch_purchase', description: 'Покупка: Фирменная кружка T1', amount: -300 },
    { source: 'course_priority', description: 'Покупка: Приоритет в очереди на курсы', amount: -200 }
  ]

  for (const user of createdUsers.slice(0, 15)) { // Первые 15 пользователей
    if (!user.profile) continue
    
    // Создаем 3-7 транзакций для каждого
    const numTransactions = Math.floor(Math.random() * 5) + 3
    
    for (let i = 0; i < numTransactions; i++) {
      const transaction = transactionSources[Math.floor(Math.random() * transactionSources.length)]
      const createdAt = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) // Последние 30 дней
      
      await prisma.tCoinTransaction.create({
        data: {
          profileId: user.profile.id,
          amount: transaction.amount,
          type: transaction.amount > 0 ? 'earned' : 'spent',
          source: transaction.source,
          description: transaction.description,
          createdAt
        }
      })
      tcoinTransactions++
    }
  }
  console.log(`✅ Создано ${tcoinTransactions} T-Coin транзакций`)

  console.log('\n🎉 База данных успешно заполнена демо-данными!')
  console.log('📊 Статистика:')
  console.log(`   👥 Пользователи: ${createdUsers.length}`)
  console.log(`   📚 Навыки: ${skills.length}`)
  console.log(`   🚀 Проекты: ${projects.length}`)
  console.log(`   🏆 Бейджи: ${badges.length}`)
  console.log(`   💼 Вакансии: ${createdJobOpenings.length}`)
  console.log(`   📖 Курсы: ${createdCourses?.length || 0}`)
  console.log(`   👨‍🏫 Менторские программы: ${createdMentorPrograms?.length || 0}`)
  console.log(`   🎯 Связи навыков: ${skillAssignments}`)
  console.log(`   📋 Назначения на проекты: ${projectAssignments}`)
  console.log(`   🎯 Карьерные цели: ${careerGoals}`)
  console.log(`   🏅 Назначения бейджей: ${badgeAssignments}`)
  console.log(`   🎓 Записи на курсы: ${courseEnrollments || 0}`)
  console.log(`   💰 T-Coin транзакции: ${tcoinTransactions}`)

  // 🚀 Запускаем автоматическую генерацию эмбеддингов в фоне
  console.log('\n🔄 Запускаем автоматическую генерацию эмбеддингов...')
  console.log('   (Эмбеддинги будут созданы в фоновом режиме после завершения seed)')
  
  // Импортируем и запускаем в фоне после небольшой задержки
  setTimeout(async () => {
    try {
      const { AutoEmbeddingService } = await import('../src/lib/auto-embeddings')
      const result = await AutoEmbeddingService.initializeMissingEmbeddings()
      console.log('✅ Автоматическая генерация эмбеддингов завершена:', result)
    } catch (error) {
      console.error('⚠️ Ошибка автогенерации эмбеддингов (не критично):', error)
    }
  }, 5000) // Запускаем через 5 секунд после завершения seed
}

main()
  .catch((e) => {
    console.error('❌ Ошибка при заполнении базы:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
