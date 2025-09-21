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
  // === FRONTEND РАЗРАБОТЧИКИ ===
  { email: 'ivan.petrov@company.com', name: 'Иван Петров', role: 'EMPLOYEE' as const, jobTitle: 'Senior Frontend Developer', department: 'Разработка' },
  { email: 'anna.morozova@company.com', name: 'Анна Морозова', role: 'EMPLOYEE' as const, jobTitle: 'Junior Frontend Developer', department: 'Разработка' },
  { email: 'roman.orlov@company.com', name: 'Роман Орлов', role: 'EMPLOYEE' as const, jobTitle: 'Team Lead Frontend', department: 'Разработка' },
  { email: 'arina.belova@company.com', name: 'Арина Белова', role: 'EMPLOYEE' as const, jobTitle: 'Middle React Developer', department: 'Разработка' },
  { email: 'dmitriy.ivanov@company.com', name: 'Дмитрий Иванов', role: 'EMPLOYEE' as const, jobTitle: 'Senior Vue.js Developer', department: 'Разработка' },
  { email: 'elena.kuzmina@company.com', name: 'Елена Кузьмина', role: 'EMPLOYEE' as const, jobTitle: 'Middle Angular Developer', department: 'Разработка' },
  { email: 'alexey.smirnov@company.com', name: 'Алексей Смирнов', role: 'EMPLOYEE' as const, jobTitle: 'Junior Frontend Developer', department: 'Разработка' },
  { email: 'marina.volkova@company.com', name: 'Марина Волкова', role: 'EMPLOYEE' as const, jobTitle: 'Senior UI/UX Developer', department: 'Разработка' },

  // === BACKEND РАЗРАБОТЧИКИ ===
  { email: 'elena.sidorova@company.com', name: 'Елена Сидорова', role: 'EMPLOYEE' as const, jobTitle: 'Middle Backend Developer', department: 'Разработка' },
  { email: 'dmitriy.kozlov@company.com', name: 'Дмитрий Козлов', role: 'EMPLOYEE' as const, jobTitle: 'Senior Full-Stack Developer', department: 'Разработка' },
  { email: 'sergey.volkov@company.com', name: 'Сергей Волков', role: 'EMPLOYEE' as const, jobTitle: 'Middle Java Developer', department: 'Разработка' },
  { email: 'pavel.lebedev@company.com', name: 'Павел Лебедев', role: 'EMPLOYEE' as const, jobTitle: 'Senior Python Developer', department: 'Разработка' },
  { email: 'andrey.novikov@company.com', name: 'Андрей Новиков', role: 'EMPLOYEE' as const, jobTitle: 'Senior Node.js Developer', department: 'Разработка' },
  { email: 'olga.vasilieva@company.com', name: 'Ольга Васильева', role: 'EMPLOYEE' as const, jobTitle: 'Middle .NET Developer', department: 'Разработка' },
  { email: 'mikhail.petrov@company.com', name: 'Михаил Петров', role: 'EMPLOYEE' as const, jobTitle: 'Senior Go Developer', department: 'Разработка' },
  { email: 'natalia.sokolova@company.com', name: 'Наталья Соколова', role: 'EMPLOYEE' as const, jobTitle: 'Middle PHP Developer', department: 'Разработка' },
  { email: 'vladimir.kozlov@company.com', name: 'Владимир Козлов', role: 'EMPLOYEE' as const, jobTitle: 'Senior Rust Developer', department: 'Разработка' },
  { email: 'tatyana.morozova@company.com', name: 'Татьяна Морозова', role: 'EMPLOYEE' as const, jobTitle: 'Middle Kotlin Developer', department: 'Разработка' },

  // === FULL-STACK РАЗРАБОТЧИКИ ===
  { email: 'alex.sokolov@company.com', name: 'Александр Соколов', role: 'EMPLOYEE' as const, jobTitle: 'System Architect', department: 'Архитектура' },
  { email: 'maria.kuznetsova@company.com', name: 'Мария Кузнецова', role: 'EMPLOYEE' as const, jobTitle: 'Product Manager', department: 'Продукт' },
  { email: 'igor.fedorov@company.com', name: 'Игорь Федоров', role: 'EMPLOYEE' as const, jobTitle: 'Senior Full-Stack Developer', department: 'Разработка' },
  { email: 'svetlana.romanova@company.com', name: 'Светлана Романова', role: 'EMPLOYEE' as const, jobTitle: 'Middle Full-Stack Developer', department: 'Разработка' },
  { email: 'nikolay.volkov@company.com', name: 'Николай Волков', role: 'EMPLOYEE' as const, jobTitle: 'Lead Full-Stack Developer', department: 'Разработка' },

  // === DATA SCIENCE & ML ===
  { email: 'olga.nikolaeva@company.com', name: 'Ольга Николаева', role: 'EMPLOYEE' as const, jobTitle: 'Senior Data Scientist', department: 'Аналитика' },
  { email: 'dmitriy.data@company.com', name: 'Дмитрий Аналитиков', role: 'EMPLOYEE' as const, jobTitle: 'Middle Data Analyst', department: 'Аналитика' },
  { email: 'elena.ml@company.com', name: 'Елена МЛ-инженер', role: 'EMPLOYEE' as const, jobTitle: 'Senior ML Engineer', department: 'Аналитика' },
  { email: 'alexey.bigdata@company.com', name: 'Алексей Большихданных', role: 'EMPLOYEE' as const, jobTitle: 'Big Data Engineer', department: 'Аналитика' },
  { email: 'marina.analytics@company.com', name: 'Марина Аналитикова', role: 'EMPLOYEE' as const, jobTitle: 'Business Intelligence Analyst', department: 'Аналитика' },

  // === DEVOPS & INFRASTRUCTURE ===
  { email: 'mikhail.fedorov@company.com', name: 'Михаил Федоров', role: 'EMPLOYEE' as const, jobTitle: 'DevOps Engineer', department: 'Инфраструктура' },
  { email: 'viktor.petrov@company.com', name: 'Виктор Петров', role: 'EMPLOYEE' as const, jobTitle: 'Senior DevOps Engineer', department: 'Инфраструктура' },
  { email: 'andrey.cloud@company.com', name: 'Андрей Облаков', role: 'EMPLOYEE' as const, jobTitle: 'Cloud Engineer', department: 'Инфраструктура' },
  { email: 'sergey.k8s@company.com', name: 'Сергей Кубернетов', role: 'EMPLOYEE' as const, jobTitle: 'Kubernetes Specialist', department: 'Инфраструктура' },
  { email: 'dmitriy.security@company.com', name: 'Дмитрий Безопасников', role: 'EMPLOYEE' as const, jobTitle: 'Security Engineer', department: 'Инфраструктура' },
  { email: 'olga.sre@company.com', name: 'Ольга SRE-инженер', role: 'EMPLOYEE' as const, jobTitle: 'Site Reliability Engineer', department: 'Инфраструктура' },

  // === QA & TESTING ===
  { email: 'julia.romanova@company.com', name: 'Юлия Романова', role: 'EMPLOYEE' as const, jobTitle: 'QA Engineer', department: 'Тестирование' },
  { email: 'alexey.test@company.com', name: 'Алексей Тестов', role: 'EMPLOYEE' as const, jobTitle: 'Senior QA Engineer', department: 'Тестирование' },
  { email: 'marina.automation@company.com', name: 'Марина Автоматизаторова', role: 'EMPLOYEE' as const, jobTitle: 'Test Automation Engineer', department: 'Тестирование' },
  { email: 'dmitriy.performance@company.com', name: 'Дмитрий Производителев', role: 'EMPLOYEE' as const, jobTitle: 'Performance Testing Engineer', department: 'Тестирование' },

  // === DESIGN & UX ===
  { email: 'natasha.popova@company.com', name: 'Наталья Попова', role: 'EMPLOYEE' as const, jobTitle: 'UI/UX Designer', department: 'Дизайн' },
  { email: 'elena.design@company.com', name: 'Елена Дизайнерова', role: 'EMPLOYEE' as const, jobTitle: 'Senior UX Designer', department: 'Дизайн' },
  { email: 'alexey.visual@company.com', name: 'Алексей Визуалов', role: 'EMPLOYEE' as const, jobTitle: 'Visual Designer', department: 'Дизайн' },
  { email: 'marina.research@company.com', name: 'Марина Исследователева', role: 'EMPLOYEE' as const, jobTitle: 'UX Researcher', department: 'Дизайн' },

  // === MOBILE DEVELOPMENT ===
  { email: 'andrey.ios@company.com', name: 'Андрей iOS-ов', role: 'EMPLOYEE' as const, jobTitle: 'Senior iOS Developer', department: 'Разработка' },
  { email: 'olga.android@company.com', name: 'Ольга Андроидова', role: 'EMPLOYEE' as const, jobTitle: 'Middle Android Developer', department: 'Разработка' },
  { email: 'dmitriy.flutter@company.com', name: 'Дмитрий Флаттеров', role: 'EMPLOYEE' as const, jobTitle: 'Flutter Developer', department: 'Разработка' },
  { email: 'marina.cross@company.com', name: 'Марина Кросс-платформенова', role: 'EMPLOYEE' as const, jobTitle: 'Cross-platform Developer', department: 'Разработка' },

  // === BLOCKCHAIN & CRYPTO ===
  { email: 'alexey.blockchain@company.com', name: 'Алексей Блокчейнов', role: 'EMPLOYEE' as const, jobTitle: 'Blockchain Developer', department: 'Инновации' },
  { email: 'elena.smart@company.com', name: 'Елена Смарт-контрактова', role: 'EMPLOYEE' as const, jobTitle: 'Smart Contract Developer', department: 'Инновации' },
  { email: 'dmitriy.defi@company.com', name: 'Дмитрий DeFi-ов', role: 'EMPLOYEE' as const, jobTitle: 'DeFi Protocol Developer', department: 'Инновации' },

  // === GAME DEVELOPMENT ===
  { email: 'andrey.game@company.com', name: 'Андрей Игров', role: 'EMPLOYEE' as const, jobTitle: 'Game Developer', department: 'Разработка' },
  { email: 'olga.unity@company.com', name: 'Ольга Unity-ова', role: 'EMPLOYEE' as const, jobTitle: 'Unity Developer', department: 'Разработка' },
  { email: 'dmitriy.unreal@company.com', name: 'Дмитрий Unreal-ов', role: 'EMPLOYEE' as const, jobTitle: 'Unreal Engine Developer', department: 'Разработка' },

  // === SPECIALIZED ROLES ===
  { email: 'marina.architect@company.com', name: 'Марина Архитекторова', role: 'EMPLOYEE' as const, jobTitle: 'Solution Architect', department: 'Архитектура' },
  { email: 'alexey.tech@company.com', name: 'Алексей Техлидов', role: 'EMPLOYEE' as const, jobTitle: 'Technical Lead', department: 'Разработка' },
  { email: 'elena.scrum@company.com', name: 'Елена Скрам-мастерова', role: 'EMPLOYEE' as const, jobTitle: 'Scrum Master', department: 'Управление' },
  { email: 'dmitriy.agile@company.com', name: 'Дмитрий Аджайлов', role: 'EMPLOYEE' as const, jobTitle: 'Agile Coach', department: 'Управление' },

  // === JUNIOR DEVELOPERS ===
  { email: 'anna.junior@company.com', name: 'Анна Джуниорова', role: 'EMPLOYEE' as const, jobTitle: 'Junior Developer', department: 'Разработка' },
  { email: 'pavel.trainee@company.com', name: 'Павел Стажеров', role: 'EMPLOYEE' as const, jobTitle: 'Trainee Developer', department: 'Разработка' },
  { email: 'marina.intern@company.com', name: 'Марина Интернова', role: 'EMPLOYEE' as const, jobTitle: 'Intern Developer', department: 'Разработка' },

  // === SENIOR & EXPERT LEVEL ===
  { email: 'vladimir.senior@company.com', name: 'Владимир Сеньоров', role: 'EMPLOYEE' as const, jobTitle: 'Principal Engineer', department: 'Архитектура' },
  { email: 'tatyana.expert@company.com', name: 'Татьяна Экспертова', role: 'EMPLOYEE' as const, jobTitle: 'Staff Engineer', department: 'Архитектура' },
  { email: 'igor.lead@company.com', name: 'Игорь Лидов', role: 'EMPLOYEE' as const, jobTitle: 'Engineering Lead', department: 'Разработка' },

  // === MANAGERS ===
  { email: 'svetlana.manager@company.com', name: 'Светлана Менеджерова', role: 'MANAGER' as const, jobTitle: 'Engineering Manager', department: 'Разработка' },
  { email: 'andrey.teamlead@company.com', name: 'Андрей Тимлидов', role: 'MANAGER' as const, jobTitle: 'Technical Manager', department: 'Разработка' },
  { email: 'irina.director@company.com', name: 'Ирина Директорова', role: 'MANAGER' as const, jobTitle: 'Product Director', department: 'Продукт' },
  { email: 'dmitriy.cto@company.com', name: 'Дмитрий CTO-ов', role: 'MANAGER' as const, jobTitle: 'CTO', department: 'Технологии' },
  { email: 'elena.vp@company.com', name: 'Елена VP-ова', role: 'MANAGER' as const, jobTitle: 'VP of Engineering', department: 'Разработка' },

  // === HR ===
  { email: 'ekaterina.hr@company.com', name: 'Екатерина HR-специалист', role: 'HR' as const, jobTitle: 'Senior HR Business Partner', department: 'HR' },
  { email: 'alexandra.talent@company.com', name: 'Александра Талантова', role: 'HR' as const, jobTitle: 'Talent Acquisition Manager', department: 'HR' },
  { email: 'marina.recruiter@company.com', name: 'Марина Рекрутерова', role: 'HR' as const, jobTitle: 'Technical Recruiter', department: 'HR' },

  // === ДЕМО-АККАУНТЫ ДЛЯ ПРЕЗЕНТАЦИИ ===
  { email: 'demo.employee@company.com', name: 'Демо Сотрудник', role: 'EMPLOYEE' as const, jobTitle: 'Senior Full-Stack Developer', department: 'Разработка' },
  { email: 'demo.manager@company.com', name: 'Демо Менеджер', role: 'MANAGER' as const, jobTitle: 'Engineering Manager', department: 'Разработка' },
  { email: 'demo.hr@company.com', name: 'Демо HR', role: 'HR' as const, jobTitle: 'HR Business Partner', department: 'HR' }
]

const demoCommunities = [
  {
    name: 'React Разработчики T1',
    description: 'Сообщество для обмена опытом по React разработке, обсуждения лучших практик и новых возможностей библиотеки',
    type: 'skill',
    tags: ['react', 'javascript', 'frontend', 'hooks', 'next.js'],
    privacy: 'PUBLIC'
  },
  {
    name: 'Python & ML Engineers',
    description: 'Место встречи специалистов по Python разработке и машинному обучению. Делимся кодом, решениями и знаниями',
    type: 'skill',
    tags: ['python', 'machine-learning', 'data-science', 'tensorflow', 'pytorch'],
    privacy: 'PUBLIC'
  },
  {
    name: 'DevOps & Infrastructure',
    description: 'Сообщество DevOps инженеров для обсуждения автоматизации, CI/CD, контейнеризации и облачных технологий',
    type: 'skill',
    tags: ['devops', 'kubernetes', 'docker', 'aws', 'ci-cd'],
    privacy: 'PUBLIC'
  },
  {
    name: 'Команда проекта Альфа',
    description: 'Внутреннее сообщество команды проекта модернизации CRM системы для координации и обмена информацией',
    type: 'project',
    tags: ['crm', 'microservices', 'spring-boot', 'postgresql'],
    privacy: 'PUBLIC'
  },
  {
    name: 'Mobile Development Hub',
    description: 'Сообщество мобильных разработчиков: iOS, Android, React Native, Flutter и кроссплатформенные решения',
    type: 'skill',
    tags: ['mobile', 'ios', 'android', 'react-native', 'flutter'],
    privacy: 'PUBLIC'
  },
  {
    name: 'Любители Кофе ☕',
    description: 'Неформальное сообщество для обсуждения сортов кофе, способов приготовления и поиска кофейных мест',
    type: 'interest',
    tags: ['coffee', 'lifestyle', 'отдых', 'general'],
    privacy: 'PUBLIC'
  },
  {
    name: 'UI/UX Design Community',
    description: 'Сообщество дизайнеров для обмена опытом, критики работ, обсуждения трендов и инструментов дизайна',
    type: 'skill',
    tags: ['design', 'ui', 'ux', 'figma', 'user-experience'],
    privacy: 'PUBLIC'
  },
  {
    name: 'Отдел Разработки',
    description: 'Официальное сообщество разработчиков для координации между командами, анонсов и общих вопросов',
    type: 'department',
    tags: ['разработка', 'coordination', 'announcements', 'general'],
    privacy: 'PUBLIC'
  },
  {
    name: 'Архитектурные решения',
    description: 'Сообщество архитекторов и тех лидов для обсуждения архитектурных паттернов, принятия решений и code review',
    type: 'skill',
    tags: ['architecture', 'patterns', 'code-review', 'tech-lead'],
    privacy: 'PUBLIC'
  },
  {
    name: 'Проект Бета - Мобильное приложение',
    description: 'Рабочее сообщество команды разработки мобильного приложения для банковских клиентов',
    type: 'project',
    tags: ['mobile-app', 'fintech', 'banking', 'security'],
    privacy: 'PUBLIC'
  },
  {
    name: 'QA & Testing',
    description: 'Сообщество тестировщиков для обмена методологиями, инструментами автоматизации и best practices',
    type: 'skill',
    tags: ['testing', 'qa', 'automation', 'selenium', 'cypress'],
    privacy: 'PUBLIC'
  },
  {
    name: 'Книжный клуб IT',
    description: 'Читаем и обсуждаем книги по программированию, архитектуре, менеджменту и личностному развитию',
    type: 'interest',
    tags: ['books', 'learning', 'development', 'programming'],
    privacy: 'PUBLIC'
  }
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
  
  // Функция для определения характеристик профиля на основе роли
  function getProfileCharacteristics(userData: any) {
    const isDemo = userData.email.startsWith('demo.')
    const isManager = userData.role === 'MANAGER'
    const isHR = userData.role === 'HR'
    const isSenior = userData.jobTitle?.includes('Senior') || userData.jobTitle?.includes('Lead') || userData.jobTitle?.includes('Principal')
    const isJunior = userData.jobTitle?.includes('Junior') || userData.jobTitle?.includes('Trainee') || userData.jobTitle?.includes('Intern')
    const isExpert = userData.jobTitle?.includes('Principal') || userData.jobTitle?.includes('Staff') || userData.jobTitle?.includes('CTO')
    
    let xp, level, profileStrength, tCoins, totalEarned
    
    if (isDemo) {
      // Демо-аккаунты с предсказуемыми характеристиками
      if (userData.role === 'EMPLOYEE') {
        xp = 1200
        level = 3
        profileStrength = 75
        tCoins = 350
        totalEarned = 600
      } else if (userData.role === 'MANAGER') {
        xp = 2000
        level = 4
        profileStrength = 85
        tCoins = 500
        totalEarned = 800
      } else { // HR
        xp = 1800
        level = 4
        profileStrength = 90
        tCoins = 450
        totalEarned = 750
      }
    } else if (isExpert) {
      xp = Math.floor(Math.random() * 1000) + 3000 // 3000-4000 XP
      level = 6
      profileStrength = Math.floor(Math.random() * 20) + 80 // 80-100%
      tCoins = Math.floor(Math.random() * 300) + 700 // 700-1000 T-Coins
      totalEarned = Math.floor(Math.random() * 500) + 1000 // 1000-1500
    } else if (isSenior) {
      xp = Math.floor(Math.random() * 1000) + 2000 // 2000-3000 XP
      level = Math.floor(Math.random() * 2) + 4 // 4-5 уровень
      profileStrength = Math.floor(Math.random() * 30) + 70 // 70-100%
      tCoins = Math.floor(Math.random() * 400) + 500 // 500-900 T-Coins
      totalEarned = Math.floor(Math.random() * 400) + 600 // 600-1000
    } else if (isJunior) {
      xp = Math.floor(Math.random() * 800) + 200 // 200-1000 XP
      level = Math.floor(Math.random() * 2) + 1 // 1-2 уровень
      profileStrength = Math.floor(Math.random() * 40) + 30 // 30-70%
      tCoins = Math.floor(Math.random() * 200) + 50 // 50-250 T-Coins
      totalEarned = Math.floor(Math.random() * 200) + 100 // 100-300
    } else if (isManager || isHR) {
      xp = Math.floor(Math.random() * 1000) + 1500 // 1500-2500 XP
      level = Math.floor(Math.random() * 2) + 4 // 4-5 уровень
      profileStrength = Math.floor(Math.random() * 25) + 75 // 75-100%
      tCoins = Math.floor(Math.random() * 300) + 400 // 400-700 T-Coins
      totalEarned = Math.floor(Math.random() * 300) + 500 // 500-800
    } else {
      // Middle level
      xp = Math.floor(Math.random() * 1000) + 1000 // 1000-2000 XP
      level = Math.floor(Math.random() * 2) + 3 // 3-4 уровень
      profileStrength = Math.floor(Math.random() * 35) + 50 // 50-85%
      tCoins = Math.floor(Math.random() * 300) + 200 // 200-500 T-Coins
      totalEarned = Math.floor(Math.random() * 300) + 300 // 300-600
    }
    
    return { xp, level, profileStrength, tCoins, totalEarned }
  }
  
  for (const userData of demoUsers) {
    // Создаем или обновляем пользователя
    let user = await prisma.user.upsert({
      where: { email: userData.email },
      update: {
        name: userData.name,
        role: userData.role,
      },
      create: {
        email: userData.email,
        name: userData.name,
        role: userData.role,
      },
      include: {
        profile: true
      }
    })
    
    // Создаем профиль если его нет
    if (!user.profile) {
      const characteristics = getProfileCharacteristics(userData)
      
      const profile = await prisma.profile.create({
        data: {
          userId: user.id,
          jobTitle: userData.jobTitle,
          department: userData.department,
          xp: characteristics.xp,
          level: characteristics.level,
          profileStrength: characteristics.profileStrength,
          tCoins: characteristics.tCoins,
          totalEarned: characteristics.totalEarned,
        }
      })
      user = { ...user, profile }
    }
    
    createdUsers.push(user)
  }
  console.log(`✅ Создано ${createdUsers.length} пользователей`)

  // Создаем сообщества
  console.log('👥 Создаем сообщества...')
  const createdCommunities: any[] = []
  
  for (const communityData of demoCommunities) {
    // Выбираем случайного создателя из пользователей
    const randomCreator = createdUsers[Math.floor(Math.random() * createdUsers.length)]
    
    // Проверяем, существует ли уже сообщество с таким названием
    const existingCommunity = await prisma.community.findFirst({
      where: { name: communityData.name }
    })
    
    let community
    if (existingCommunity) {
      // Обновляем существующее сообщество
      community = await prisma.community.update({
        where: { id: existingCommunity.id },
        data: {
          description: communityData.description,
          type: communityData.type,
          tags: communityData.tags,
          privacy: communityData.privacy,
        }
      })
    } else {
      // Создаем новое сообщество
      community = await prisma.community.create({
        data: {
          ...communityData,
          creatorId: randomCreator.profile?.id || randomCreator.id,
          memberCount: 1 // Создатель автоматически становится участником
        }
      })
    }
    
    // Создатель автоматически становится участником (если еще не участник)
    await prisma.communityMember.upsert({
      where: {
        communityId_profileId: {
          communityId: community.id,
          profileId: randomCreator.profile?.id || randomCreator.id
        }
      },
      update: {},
      create: {
        communityId: community.id,
        profileId: randomCreator.profile?.id || randomCreator.id,
        role: 'ADMIN'
      }
    })
    
    createdCommunities.push(community)
  }
  console.log(`✅ Создано ${createdCommunities.length} сообществ`)

  // Добавляем участников в сообщества
  console.log('🤝 Добавляем участников в сообщества...')
  let communityMemberships = 0
  
  for (const community of createdCommunities) {
    // Каждое сообщество получает 3-8 участников (кроме создателя)
    const numMembers = Math.floor(Math.random() * 6) + 3
    const memberSet = new Set<string>()
    
    // Исключаем создателя из списка потенциальных участников
    const potentialMembers = createdUsers.filter(user => 
      user.profile?.id !== community.creatorId
    )
    
    // Выбираем случайных участников
    while (memberSet.size < Math.min(numMembers, potentialMembers.length)) {
      const randomMember = potentialMembers[Math.floor(Math.random() * potentialMembers.length)]
      if (randomMember.profile?.id) {
        memberSet.add(randomMember.profile.id)
      }
    }
    
    // Создаем записи участников
    for (const memberId of memberSet) {
      await prisma.communityMember.upsert({
        where: {
          communityId_profileId: {
            communityId: community.id,
            profileId: memberId
          }
        },
        update: {},
        create: {
          communityId: community.id,
          profileId: memberId,
          role: 'MEMBER'
        }
      })
      communityMemberships++
    }
    
    // Обновляем количество участников в сообществе
    await prisma.community.update({
      where: { id: community.id },
      data: { memberCount: memberSet.size + 1 } // +1 для создателя
    })
  }
  console.log(`✅ Добавлено ${communityMemberships} участников в сообщества`)

  // Создаем несколько постов в сообществах
  console.log('📝 Создаем посты в сообществах...')
  let communityPosts = 0
  
  const samplePosts = [
    'Поделитесь вашим опытом использования этой технологии в production',
    'Какие инструменты используете для решения подобных задач?',
    'Интересная статья по теме: ссылка...',
    'У кого есть опыт внедрения в нашей компании?',
    'Планируется ли обучение по данной теме?',
    'Отличное решение проблемы, с которой сталкивались многие',
    'Вопрос к экспертам: как лучше подойти к этой задаче?',
    'Делюсь полезным ресурсом для изучения',
    'Кто участвует в конференции на следующей неделе?',
    'Результаты нашего эксперимента с новым подходом'
  ]
  
  for (const community of createdCommunities.slice(0, 8)) { // В первых 8 сообществах
    // Каждое сообщество получает 2-5 постов
    const numPosts = Math.floor(Math.random() * 4) + 2
    
    // Получаем участников сообщества
    const members = await prisma.communityMember.findMany({
      where: { communityId: community.id },
      include: { profile: true }
    })
    
    for (let i = 0; i < numPosts; i++) {
      const randomMember = members[Math.floor(Math.random() * members.length)]
      const randomPost = samplePosts[Math.floor(Math.random() * samplePosts.length)]
      
      await prisma.communityPost.create({
        data: {
          communityId: community.id,
          authorId: randomMember.profileId,
          content: randomPost,
          type: 'TEXT'
        }
      })
      communityPosts++
    }
  }
  console.log(`✅ Создано ${communityPosts} постов в сообществах`)

  // Заполняем навыки пользователей
  console.log('🎯 Назначаем навыки пользователям...')
  let skillAssignments = 0
  
  // Функция для определения релевантных навыков на основе роли
  function getRelevantSkills(userData: any, allSkills: any[]) {
    const jobTitle = userData.jobTitle?.toLowerCase() || ''
    const department = userData.department?.toLowerCase() || ''
    const isDemo = userData.email.startsWith('demo.')
    
    let relevantSkills: string[] = []
    
    // Определяем релевантные навыки на основе должности
    if (jobTitle.includes('frontend') || jobTitle.includes('ui') || jobTitle.includes('ux')) {
      relevantSkills = allSkills.filter(s => 
        s.name.toLowerCase().includes('react') ||
        s.name.toLowerCase().includes('vue') ||
        s.name.toLowerCase().includes('angular') ||
        s.name.toLowerCase().includes('javascript') ||
        s.name.toLowerCase().includes('typescript') ||
        s.name.toLowerCase().includes('html') ||
        s.name.toLowerCase().includes('css') ||
        s.name.toLowerCase().includes('tailwind')
      ).map(s => s.id)
    } else if (jobTitle.includes('backend') || jobTitle.includes('api') || jobTitle.includes('server')) {
      relevantSkills = allSkills.filter(s => 
        s.name.toLowerCase().includes('java') ||
        s.name.toLowerCase().includes('python') ||
        s.name.toLowerCase().includes('node') ||
        s.name.toLowerCase().includes('spring') ||
        s.name.toLowerCase().includes('django') ||
        s.name.toLowerCase().includes('express') ||
        s.name.toLowerCase().includes('postgresql') ||
        s.name.toLowerCase().includes('mysql') ||
        s.name.toLowerCase().includes('mongodb')
      ).map(s => s.id)
    } else if (jobTitle.includes('devops') || jobTitle.includes('cloud') || jobTitle.includes('infrastructure')) {
      relevantSkills = allSkills.filter(s => 
        s.name.toLowerCase().includes('docker') ||
        s.name.toLowerCase().includes('kubernetes') ||
        s.name.toLowerCase().includes('aws') ||
        s.name.toLowerCase().includes('linux') ||
        s.name.toLowerCase().includes('ci/cd') ||
        s.name.toLowerCase().includes('git')
      ).map(s => s.id)
    } else if (jobTitle.includes('data') || jobTitle.includes('analytics') || jobTitle.includes('ml')) {
      relevantSkills = allSkills.filter(s => 
        s.name.toLowerCase().includes('python') ||
        s.name.toLowerCase().includes('machine learning') ||
        s.name.toLowerCase().includes('data science') ||
        s.name.toLowerCase().includes('analytics') ||
        s.name.toLowerCase().includes('sql') ||
        s.name.toLowerCase().includes('tensorflow')
      ).map(s => s.id)
    } else if (jobTitle.includes('qa') || jobTitle.includes('test')) {
      relevantSkills = allSkills.filter(s => 
        s.name.toLowerCase().includes('selenium') ||
        s.name.toLowerCase().includes('cypress') ||
        s.name.toLowerCase().includes('testing') ||
        s.name.toLowerCase().includes('automation')
      ).map(s => s.id)
    } else if (jobTitle.includes('design') || jobTitle.includes('ux')) {
      relevantSkills = allSkills.filter(s => 
        s.name.toLowerCase().includes('figma') ||
        s.name.toLowerCase().includes('design') ||
        s.name.toLowerCase().includes('ui') ||
        s.name.toLowerCase().includes('ux')
      ).map(s => s.id)
    }
    
    // Добавляем общие навыки
    const commonSkills = allSkills.filter(s => 
      s.name.toLowerCase().includes('git') ||
      s.name.toLowerCase().includes('agile') ||
      s.name.toLowerCase().includes('менторство') ||
      s.name.toLowerCase().includes('управление командой')
    ).map(s => s.id)
    
    relevantSkills = [...new Set([...relevantSkills, ...commonSkills])]
    
    // Для демо-аккаунтов добавляем больше навыков
    if (isDemo) {
      const additionalSkills = allSkills.filter(s => 
        s.name.toLowerCase().includes('react') ||
        s.name.toLowerCase().includes('node') ||
        s.name.toLowerCase().includes('typescript') ||
        s.name.toLowerCase().includes('docker') ||
        s.name.toLowerCase().includes('postgresql')
      ).map(s => s.id)
      relevantSkills = [...new Set([...relevantSkills, ...additionalSkills])]
    }
    
    return relevantSkills
  }
  
  for (const user of createdUsers) {
    if (!user.profile) continue
    
    const userData = demoUsers.find(u => u.email === user.email)
    if (!userData) continue
    
    // Получаем релевантные навыки
    const relevantSkills = getRelevantSkills(userData, skills)
    
    // Определяем количество навыков на основе уровня
    const isSenior = userData.jobTitle?.includes('Senior') || userData.jobTitle?.includes('Lead')
    const isJunior = userData.jobTitle?.includes('Junior') || userData.jobTitle?.includes('Trainee')
    const isDemo = userData.email.startsWith('demo.')
    
    let numSkills: number
    if (isDemo) {
      numSkills = 8 // Демо-аккаунты получают много навыков
    } else if (isSenior) {
      numSkills = Math.floor(Math.random() * 4) + 8 // 8-12 навыков
    } else if (isJunior) {
      numSkills = Math.floor(Math.random() * 3) + 3 // 3-6 навыков
    } else {
      numSkills = Math.floor(Math.random() * 4) + 5 // 5-9 навыков
    }
    
    // Выбираем навыки из релевантных + случайные
    const userSkillsSet = new Set<string>()
    
    // Сначала добавляем релевантные навыки
    const relevantToAdd = Math.min(relevantSkills.length, Math.floor(numSkills * 0.7))
    const shuffledRelevant = relevantSkills.sort(() => 0.5 - Math.random())
    for (let i = 0; i < relevantToAdd && userSkillsSet.size < numSkills; i++) {
      userSkillsSet.add(shuffledRelevant[i])
    }
    
    // Дополняем случайными навыками
    while (userSkillsSet.size < numSkills) {
      const randomSkill = skills[Math.floor(Math.random() * skills.length)]
      userSkillsSet.add(randomSkill.id)
    }
    
    // Создаем записи навыков
    for (const skillId of userSkillsSet) {
      const skill = skills.find(s => s.id === skillId)
      const isRelevant = relevantSkills.includes(skillId)
      
      // Определяем уровень навыка
      let level: number
      if (isDemo) {
        level = Math.floor(Math.random() * 2) + 4 // 4-5 для демо
      } else if (isRelevant) {
        level = Math.floor(Math.random() * 2) + 3 // 3-4 для релевантных
      } else {
        level = Math.floor(Math.random() * 3) + 1 // 1-3 для случайных
      }
      
      // Вероятность верификации выше для релевантных навыков
      const isVerified = isRelevant ? Math.random() > 0.5 : Math.random() > 0.8
      
      await prisma.userSkill.upsert({
        where: {
          profileId_skillId: {
            profileId: user.profile.id,
            skillId: skillId
          }
        },
        update: {
          level,
          isVerified,
          status: Math.random() > 0.9 ? 'WANTS_TO_LEARN' : 'USING'
        },
        create: {
          profileId: user.profile.id,
          skillId: skillId,
          level,
          isVerified,
          status: Math.random() > 0.9 ? 'WANTS_TO_LEARN' : 'USING'
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
      
      await prisma.userProject.upsert({
        where: {
          profileId_projectId: {
            profileId: user.profile.id,
            projectId: projectId
          }
        },
        update: {},
        create: {
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
      await prisma.userBadge.upsert({
        where: {
          profileId_badgeId: {
            profileId: user.profile.id,
            badgeId: badgeId
          }
        },
        update: {},
        create: {
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
      
      await prisma.userCourse.upsert({
        where: {
          profileId_courseId: {
            profileId: user.profile.id,
            courseId: course.id
          }
        },
        update: {},
        create: {
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

  // Создаем товары магазина T-Coins
  console.log('🛒 Создаем товары магазина T-Coins...')
  const rewardItems = [
    {
      name: 'Фирменная кружка T1',
      description: 'Стильная керамическая кружка с логотипом T1. Объем 350мл, подходит для кофе и чая.',
      cost: 300,
      category: 'merch',
      imageUrl: '/rewards/mug-t1.png',
      inStock: true
    },
    {
      name: 'Толстовка T1',
      description: 'Комфортная толстовка с капюшоном и логотипом T1. Размеры S-XXL.',
      cost: 800,
      category: 'merch',
      imageUrl: '/rewards/hoodie-t1.png',
      inStock: true
    },
    {
      name: 'Стикерпак T1',
      description: 'Набор из 10 стикеров с логотипами и мотивирующими надписями.',
      cost: 150,
      category: 'merch',
      imageUrl: '/rewards/stickers.png',
      inStock: true
    },
    {
      name: 'Доступ к премиум курсу',
      description: 'Месячный доступ к любому курсу из премиум каталога компании.',
      cost: 500,
      category: 'development',
      imageUrl: '/rewards/premium-course.png',
      inStock: true
    },
    {
      name: '1-на-1 сессия с ментором',
      description: 'Персональная часовая сессия с экспертом по выбранной теме.',
      cost: 400,
      category: 'development',
      imageUrl: '/rewards/mentor-session.png',
      inStock: true
    },
    {
      name: 'Приоритетное участие в хакатоне',
      description: 'Гарантированное место в следующем внутреннем хакатоне компании.',
      cost: 600,
      category: 'development',
      imageUrl: '/rewards/hackathon.png',
      inStock: true
    },
    {
      name: 'Именная парковка на месяц',
      description: 'Персональное парковочное место с вашим именем на месяц.',
      cost: 250,
      category: 'privileges',
      imageUrl: '/rewards/parking.png',
      inStock: true
    },
    {
      name: 'Приоритет в очереди на курсы',
      description: 'Возможность записаться на популярные курсы без очереди на 3 месяца.',
      cost: 200,
      category: 'privileges',
      imageUrl: '/rewards/priority.png',
      inStock: true
    },
    {
      name: 'Кастомный статус в профиле',
      description: 'Возможность установить персональный статус в профиле на месяц.',
      cost: 100,
      category: 'privileges',
      imageUrl: '/rewards/status.png',
      inStock: true
    },
    {
      name: 'Поздний старт (1 день)',
      description: 'Возможность один раз начать рабочий день на час позже без согласований.',
      cost: 180,
      category: 'privileges',
      imageUrl: '/rewards/late-start.png',
      inStock: true
    }
  ]
  
  // Создаем товары магазина, если их еще нет
  let createdRewardItemsCount = 0
  for (const item of rewardItems) {
    const existingItem = await prisma.rewardItem.findFirst({
      where: { name: item.name }
    })
    
    if (!existingItem) {
      await prisma.rewardItem.create({
        data: item
      })
      createdRewardItemsCount++
    }
  }
  console.log(`✅ Создано ${createdRewardItemsCount} товаров в магазине`)

  // Создаем несколько шорт-листов для менеджеров
  console.log('📋 Создаем шорт-листы для менеджеров...')
  
  const managers = createdUsers.filter(user => user.role === 'MANAGER')
  let shortlistsCount = 0
  
  for (const manager of managers) {
    // Создаем 2-3 шорт-листа для каждого менеджера
    const shortlistsData = [
      {
        title: 'Frontend команда для проекта Феникс',
        description: 'Поиск опытных React разработчиков для нового мобильного приложения'
      },
      {
        title: 'Backend архитекторы',
        description: 'Senior разработчики для проектирования микросервисной архитектуры'
      },
      {
        title: 'DevOps специалисты',
        description: 'Инженеры для автоматизации CI/CD и облачной инфраструктуры'
      }
    ]
    
    const numShortlists = Math.floor(Math.random() * 2) + 2 // 2-3 шорт-листа
    
    for (let i = 0; i < numShortlists; i++) {
      const shortlistData = shortlistsData[i % shortlistsData.length]
      
      const shortlist = await prisma.shortList.create({
        data: {
          managerId: manager.id,
          title: shortlistData.title,
          description: shortlistData.description
        }
      })
      
      // Добавляем 2-5 случайных кандидатов в каждый шорт-лист
      const numCandidates = Math.floor(Math.random() * 4) + 2
      const employees = createdUsers.filter(user => user.role === 'EMPLOYEE' && user.profile)
      
      const selectedCandidates = employees
        .sort(() => 0.5 - Math.random())
        .slice(0, numCandidates)
      
      for (const candidate of selectedCandidates) {
        const notes = [
          'Отличные технические навыки, подходит для лидерской роли',
          'Хороший кандидат, но нужно больше опыта в команде',
          'Идеальный матч по навыкам, готов к интервью',
          'Нужно обсудить возможность перехода с текущего проекта',
          'Высокий потенциал, рекомендую для развития'
        ]
        
        await prisma.shortListCandidate.create({
          data: {
            shortListId: shortlist.id,
            profileId: candidate.profile!.id,
            notes: Math.random() > 0.5 ? notes[Math.floor(Math.random() * notes.length)] : null
          }
        })
      }
      
      shortlistsCount++
    }
  }
  
  console.log(`✅ Создано ${shortlistsCount} шорт-листов для менеджеров`)

  // Создаем лидерборды
  console.log('🏆 Создаем лидерборды...')
  
  const leaderboardTypes = [
    {
      type: 'tcoins_weekly',
      period: 'weekly',
      title: 'T-Coins за неделю',
      description: 'Лидеры по заработку T-Coins за последнюю неделю',
      validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Действителен неделю
    },
    {
      type: 'tcoins_monthly',
      period: 'monthly',
      title: 'T-Coins за месяц',
      description: 'Лидеры по заработку T-Coins за последний месяц',
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // Действителен месяц
    },
    {
      type: 'tcoins_alltime',
      period: 'alltime',
      title: 'T-Coins за всё время',
      description: 'Лидеры по общему количеству заработанных T-Coins',
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    },
    {
      type: 'xp_weekly',
      period: 'weekly',
      title: 'Опыт за неделю',
      description: 'Лидеры по набранному опыту за последнюю неделю',
      validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    },
    {
      type: 'xp_monthly',
      period: 'monthly',
      title: 'Опыт за месяц',
      description: 'Лидеры по набранному опыту за последний месяц',
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    },
    {
      type: 'profile_strength',
      period: 'current',
      title: 'Сила профиля',
      description: 'Пользователи с самыми полными профилями',
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    },
    {
      type: 'activity_weekly',
      period: 'weekly',
      title: 'Активность за неделю',
      description: 'Самые активные пользователи на платформе за неделю',
      validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    }
  ]

  // Генерируем данные лидербордов
  for (const boardType of leaderboardTypes) {
    let leaderboardData: Array<{
      position: number
      profileId: string
      userId: string
      name: string
      score: number
      avatar?: string
      department?: string
      level?: number
      badge?: string
    }> = []
    
    // Получаем всех сотрудников с профилями для генерации данных
    const employeeUsers = createdUsers.filter(user => user.role === 'EMPLOYEE' && user.profile)
    
    switch (boardType.type) {
      case 'tcoins_weekly':
        // Генерируем данные по заработанным T-Coins за неделю
        leaderboardData = employeeUsers.map((user, index) => ({
          position: index + 1,
          profileId: user.profile!.id,
          userId: user.id,
          name: user.name || 'Пользователь',
          score: Math.floor(Math.random() * 150) + 50, // 50-200 T-Coins за неделю
          avatar: user.image || undefined,
          department: user.profile!.department || undefined,
          level: user.profile!.level,
          badge: Math.random() > 0.7 ? '🔥' : undefined
        })).sort((a, b) => b.score - a.score).map((entry, index) => ({ ...entry, position: index + 1 }))
        break
        
      case 'tcoins_monthly':
        // T-Coins за месяц
        leaderboardData = employeeUsers.map((user, index) => ({
          position: index + 1,
          profileId: user.profile!.id,
          userId: user.id,
          name: user.name || 'Пользователь',
          score: Math.floor(Math.random() * 600) + 200, // 200-800 T-Coins за месяц
          avatar: user.image || undefined,
          department: user.profile!.department || undefined,
          level: user.profile!.level,
          badge: Math.random() > 0.8 ? '👑' : undefined
        })).sort((a, b) => b.score - a.score).map((entry, index) => ({ ...entry, position: index + 1 }))
        break
        
      case 'tcoins_alltime':
        // Всего заработано T-Coins
        leaderboardData = employeeUsers.map((user, index) => ({
          position: index + 1,
          profileId: user.profile!.id,
          userId: user.id,
          name: user.name || 'Пользователь',
          score: user.profile!.totalEarned,
          avatar: user.image || undefined,
          department: user.profile!.department || undefined,
          level: user.profile!.level,
          badge: Math.random() > 0.6 ? '⭐' : undefined
        })).sort((a, b) => b.score - a.score).map((entry, index) => ({ ...entry, position: index + 1 }))
        break
        
      case 'xp_weekly':
        // XP за неделю (случайные данные)
        leaderboardData = employeeUsers.map((user, index) => ({
          position: index + 1,
          profileId: user.profile!.id,
          userId: user.id,
          name: user.name || 'Пользователь',
          score: Math.floor(Math.random() * 200) + 50, // 50-250 XP за неделю
          avatar: user.image || undefined,
          department: user.profile!.department || undefined,
          level: user.profile!.level,
          badge: Math.random() > 0.7 ? '💪' : undefined
        })).sort((a, b) => b.score - a.score).map((entry, index) => ({ ...entry, position: index + 1 }))
        break
        
      case 'xp_monthly':
        // XP за месяц
        leaderboardData = employeeUsers.map((user, index) => ({
          position: index + 1,
          profileId: user.profile!.id,
          userId: user.id,
          name: user.name || 'Пользователь',
          score: Math.floor(Math.random() * 800) + 200, // 200-1000 XP за месяц
          avatar: user.image || undefined,
          department: user.profile!.department || undefined,
          level: user.profile!.level,
          badge: Math.random() > 0.8 ? '🚀' : undefined
        })).sort((a, b) => b.score - a.score).map((entry, index) => ({ ...entry, position: index + 1 }))
        break
        
      case 'profile_strength':
        // Сила профиля (реальные данные)
        leaderboardData = employeeUsers.map((user, index) => ({
          position: index + 1,
          profileId: user.profile!.id,
          userId: user.id,
          name: user.name || 'Пользователь',
          score: user.profile!.profileStrength,
          avatar: user.image || undefined,
          department: user.profile!.department || undefined,
          level: user.profile!.level,
          badge: user.profile!.profileStrength >= 90 ? '🏆' : user.profile!.profileStrength >= 70 ? '🥇' : undefined
        })).sort((a, b) => b.score - a.score).map((entry, index) => ({ ...entry, position: index + 1 }))
        break
        
      case 'activity_weekly':
        // Активность за неделю (случайные данные)
        leaderboardData = employeeUsers.map((user, index) => ({
          position: index + 1,
          profileId: user.profile!.id,
          userId: user.id,
          name: user.name || 'Пользователь',
          score: Math.floor(Math.random() * 20) + 5, // 5-25 активных действий за неделю
          avatar: user.image || undefined,
          department: user.profile!.department || undefined,
          level: user.profile!.level,
          badge: Math.random() > 0.6 ? '⚡' : undefined
        })).sort((a, b) => b.score - a.score).map((entry, index) => ({ ...entry, position: index + 1 }))
        break
    }
    
    // Создаем запись лидерборда
    await prisma.leaderboard.create({
      data: {
        type: boardType.type,
        period: boardType.period,
        data: {
          entries: leaderboardData.slice(0, 50), // Топ-50
          totalParticipants: leaderboardData.length,
          generatedAt: new Date(),
          config: {
            title: boardType.title,
            description: boardType.description,
            icon: boardType.type.includes('tcoins') ? '💰' : 
                  boardType.type.includes('xp') ? '⚡' :
                  boardType.type === 'profile_strength' ? '📈' : '🎯',
            updateFrequency: boardType.period === 'weekly' ? 'Обновляется еженедельно' :
                            boardType.period === 'monthly' ? 'Обновляется ежемесячно' :
                            'Обновляется в реальном времени'
          }
        },
        validUntil: boardType.validUntil
      }
    })
  }
  
  console.log(`✅ Создано ${leaderboardTypes.length} лидербордов`)

  console.log('\n🎉 База данных успешно заполнена демо-данными!')
  console.log('📊 Статистика:')
  console.log(`   👥 Пользователи: ${createdUsers.length} (${createdUsers.filter(u => u.role === 'EMPLOYEE').length} сотрудников, ${createdUsers.filter(u => u.role === 'MANAGER').length} менеджеров, ${createdUsers.filter(u => u.role === 'HR').length} HR)`)
  console.log(`   📚 Навыки: ${skills.length}`)
  console.log(`   🚀 Проекты: ${projects.length}`)
  console.log(`   🏆 Бейджи: ${badges.length}`)
  console.log(`   💼 Вакансии: ${createdJobOpenings.length}`)
  console.log(`   📖 Курсы: ${createdCourses?.length || 0}`)
  console.log(`   👨‍🏫 Менторские программы: ${createdMentorPrograms?.length || 0}`)
  console.log(`   🛒 Товары в магазине: ${createdRewardItemsCount || 0}`)
  console.log(`   🏆 Лидерборды: ${leaderboardTypes?.length || 0}`)
  console.log(`   🌐 Сообщества: ${createdCommunities?.length || 0}`)
  console.log(`   🎯 Связи навыков: ${skillAssignments}`)
  console.log(`   📋 Назначения на проекты: ${projectAssignments}`)
  console.log(`   🎯 Карьерные цели: ${careerGoals}`)
  console.log(`   🏅 Назначения бейджей: ${badgeAssignments}`)
  console.log(`   🎓 Записи на курсы: ${courseEnrollments || 0}`)
  console.log(`   🤝 Участники сообществ: ${communityMemberships || 0}`)
  console.log(`   📝 Посты в сообществах: ${communityPosts || 0}`)
  console.log(`   💰 T-Coin транзакции: ${tcoinTransactions}`)
  console.log(`   📋 Шорт-листы: ${shortlistsCount || 0}`)
  
  console.log('\n🚀 Демо-аккаунты для быстрого входа:')
  console.log(`   👨‍💻 demo.employee@company.com - Демо Сотрудник (Senior Full-Stack)`)
  console.log(`   👨‍💼 demo.manager@company.com - Демо Менеджер (Engineering Manager)`)
  console.log(`   👩‍💼 demo.hr@company.com - Демо HR (HR Business Partner)`)
  console.log(`   🎨 ivan.petrov@company.com - Иван Петров (Senior Frontend)`)
  console.log(`   📊 olga.nikolaeva@company.com - Ольга Николаева (Data Scientist)`)
  console.log(`   ⚙️ mikhail.fedorov@company.com - Михаил Федоров (DevOps)`)
  console.log(`   🌱 anna.morozova@company.com - Анна Морозова (Junior Frontend)`)
  console.log(`   🏆 vladimir.senior@company.com - Владимир Сеньоров (Principal Engineer)`)

  // 🚀 Запускаем автоматическую генерацию эмбеддингов в фоне
  console.log('\n🔄 Запускаем автоматическую генерацию эмбеддингов...')
  console.log('   (Эмбеддинги будут созданы в фоновом режиме после завершения seed)')
  
  // Импортируем и запускаем в фоне после небольшой задержки
  setTimeout(async () => {
    try {
      // Сначала проверяем и настраиваем pgvector
      console.log('🔧 Проверяем pgvector...')
      
      // Включаем расширение и добавляем колонку если нужно
      await prisma.$executeRaw`CREATE EXTENSION IF NOT EXISTS vector`
      await prisma.$executeRaw`ALTER TABLE "Profile" ADD COLUMN IF NOT EXISTS embedding vector(1024)`
      await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS profile_embedding_cosine_idx ON "Profile" USING hnsw (embedding vector_cosine_ops) WITH (m = 16, ef_construction = 64)`
      
      console.log('✅ pgvector настроен, запускаем генерацию эмбеддингов...')
      
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
