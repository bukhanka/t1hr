const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function seedCorporateData() {
  console.log('🌱 Seeding corporate data...')

  try {
    // Добавляем активные проекты
    await prisma.project.createMany({
      data: [
        {
          name: 'Феникс',
          description: 'Модернизация платежной системы с использованием микросервисов',
          status: 'ACTIVE'
        },
        {
          name: 'Альфа-Аналитика',
          description: 'Внедрение машинного обучения для анализа клиентских данных',
          status: 'ACTIVE'
        },
        {
          name: 'Мобильный Банк v2.0',
          description: 'Переписывание мобильного приложения на React Native',
          status: 'ACTIVE'
        },
        {
          name: 'Облачная Миграция',
          description: 'Перенос инфраструктуры в AWS с использованием Kubernetes',
          status: 'ACTIVE'
        },
        {
          name: 'Система Уведомлений',
          description: 'Создание единой системы push-уведомлений для всех продуктов',
          status: 'ACTIVE'
        }
      ],
      skipDuplicates: true
    })

    // Добавляем открытые вакансии
    await prisma.jobOpening.createMany({
      data: [
        {
          title: 'Senior Backend Developer',
          description: 'Разработка высоконагруженных сервисов',
          department: 'IT',
          level: 'Senior',
          requirements: ['Java', 'Spring', 'Kafka', 'Docker'],
          status: 'OPEN'
        },
        {
          title: 'ML Engineer',
          description: 'Разработка и внедрение ML-моделей',
          department: 'Data Science',
          level: 'Middle',
          requirements: ['Python', 'TensorFlow', 'Docker', 'Kubernetes'],
          status: 'OPEN'
        },
        {
          title: 'Frontend Team Lead',
          description: 'Руководство командой фронтенд разработки',
          department: 'IT',
          level: 'Senior',
          requirements: ['React', 'TypeScript', 'Leadership', 'Mentoring'],
          status: 'OPEN'
        },
        {
          title: 'DevOps Engineer',
          description: 'Автоматизация процессов разработки и деплоя',
          department: 'IT',
          level: 'Middle',
          requirements: ['AWS', 'Kubernetes', 'CI/CD', 'Terraform'],
          status: 'OPEN'
        }
      ],
      skipDuplicates: true
    })

    // Добавляем курсы
    await prisma.course.createMany({
      data: [
        {
          title: 'Микросервисы на Spring Boot',
          description: 'Изучение архитектуры микросервисов',
          category: 'Техническое',
          level: 'Middle',
          skills: ['java', 'spring', 'microservices'],
          xpReward: 150,
          status: 'ACTIVE'
        },
        {
          title: 'Machine Learning для начинающих',
          description: 'Основы машинного обучения и нейронных сетей',
          category: 'Техническое',
          level: 'Junior',
          skills: ['python', 'machine learning', 'tensorflow'],
          xpReward: 200,
          status: 'ACTIVE'
        },
        {
          title: 'React и TypeScript',
          description: 'Современная фронтенд разработка',
          category: 'Техническое',
          level: 'Middle',
          skills: ['react', 'typescript', 'javascript'],
          xpReward: 120,
          status: 'ACTIVE'
        },
        {
          title: 'Лидерство в IT',
          description: 'Навыки управления техническими командами',
          category: 'Менеджмент',
          level: 'Senior',
          skills: ['leadership', 'mentoring', 'management'],
          xpReward: 100,
          status: 'ACTIVE'
        },
        {
          title: 'Docker и Kubernetes',
          description: 'Контейнеризация и оркестрация приложений',
          category: 'Техническое',
          level: 'Middle',
          skills: ['docker', 'kubernetes', 'devops'],
          xpReward: 180,
          status: 'ACTIVE'
        }
      ],
      skipDuplicates: true
    })

    // Добавляем менторские программы
    await prisma.mentorProgram.createMany({
      data: [
        {
          title: 'Junior → Middle Developer',
          description: 'Программа развития для Junior разработчиков',
          skills: ['java', 'python', 'javascript'],
          mentorId: 'mentor-1', // ID ментора
          maxSlots: 5,
          status: 'ACTIVE'
        },
        {
          title: 'Путь в Data Science',
          description: 'Менторинг для перехода в Data Science',
          skills: ['python', 'machine learning', 'statistics'],
          mentorId: 'mentor-2',
          maxSlots: 3,
          status: 'ACTIVE'
        },
        {
          title: 'Tech Lead Bootcamp',
          description: 'Развитие лидерских навыков для технических специалистов',
          skills: ['leadership', 'architecture', 'mentoring'],
          mentorId: 'mentor-3',
          maxSlots: 4,
          status: 'ACTIVE'
        }
      ],
      skipDuplicates: true
    })

    console.log('✅ Corporate data seeded successfully!')

  } catch (error) {
    console.error('❌ Error seeding corporate data:', error)
  } finally {
    await prisma.$disconnect()
  }
}

seedCorporateData()

