// @ts-nocheck
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { NavigatorCard } from "@/components/navigator-card"
import { OpportunityPreviewCard } from "@/components/opportunity-preview-card"
import { OnboardingBanner } from "@/components/onboarding-banner"
import { GamificationService } from "@/lib/gamification"
import { SmartRankingService } from "@/lib/smart-ranking"
import Link from "next/link"
import { 
  Target,
  Trophy,
  TrendingUp,
  Star,
  Award,
  Book,
  Zap,
  Users,
  Calendar,
  Coins
} from "lucide-react"

export default async function EmployeeDashboard() {
  const session = await getServerSession(authOptions)
  
  if (!session || session.user.role !== 'EMPLOYEE') {
    redirect("/dashboard")
  }

  // Получаем полный профиль пользователя
  const profile = await prisma.profile.findUnique({
    where: { userId: session.user.id },
    include: {
      userSkills: {
        include: { skill: true },
        orderBy: { skill: { name: 'asc' } }
      },
      userProjects: {
        include: { project: true },
        orderBy: { updatedAt: 'desc' }
      },
      careerGoals: {
        orderBy: { priority: 'desc' }
      },
      badges: {
        include: { badge: true },
        orderBy: { awardedAt: 'desc' },
        take: 5
      },
      userCourses: {
        include: { course: true }
      },
      mentorPrograms: {
        include: { program: true }
      }
    }
  })

  // Если профиль не существует, создаем пользователя и профиль
  if (!profile) {
    // Сначала убедимся что пользователь существует в базе
    // Используем upsert для безопасного создания/обновления пользователя
    let user
    try {
      user = await prisma.user.upsert({
        where: { email: session.user.email || '' },
        update: {
          id: session.user.id,
          name: session.user.name || 'Пользователь',
          role: (session.user as any).role || 'EMPLOYEE'
        },
        create: {
          id: session.user.id,
          email: session.user.email || '',
          name: session.user.name || 'Пользователь',
          role: (session.user as any).role || 'EMPLOYEE'
        }
      })
    } catch (error: any) {
      // Если есть конфликт ID, попробуем найти пользователя по email
      if (error.code === 'P2002') {
        user = await prisma.user.findUnique({
          where: { email: session.user.email || '' }
        })
        if (!user) {
          throw error
        }
      } else {
        throw error
      }
    }

    // Теперь создаем профиль
    const newProfile = await prisma.profile.create({
      data: {
        userId: user.id,
        xp: 50, // Стартовый XP
        level: 1,
        profileStrength: 20
      },
      include: {
        userSkills: { include: { skill: true } },
        userProjects: { include: { project: true } },
        careerGoals: true,
        badges: { include: { badge: true } }
      }
    })

    // Начисляем XP за создание профиля
    await GamificationService.awardXP(user.id, 'PROFILE_CREATED')
    
    redirect("/dashboard/employee") // Перезагружаем страницу
  }

  // Получаем информацию об уровне
  const levelInfo = GamificationService.getLevelInfo(profile.level)
  const nextBestAction = await GamificationService.getNextBestAction(session.user.id)

  // Используем умные рекомендации вместо простой фильтрации
  console.log('🧠 Генерируем умные рекомендации для сотрудника...')
  
  const smartRecommendations = await SmartRankingService.getPersonalizedRecommendations(session.user.id)
  
  // Преобразуем для совместимости с существующими компонентами
  const recommendedCourses = smartRecommendations.courses.slice(0, 2).map(rec => ({
    ...rec.data,
    relevanceScore: rec.relevanceScore,
    reasoning: rec.reasoning
  }))
  
  const recommendedProjects = smartRecommendations.projects.slice(0, 3).map(rec => ({
    ...rec.data,
    relevanceScore: rec.relevanceScore,
    reasoning: rec.reasoning
  }))
  
  const recommendedMentorPrograms = smartRecommendations.mentors.slice(0, 2).map(rec => ({
    ...rec.data,
    relevanceScore: rec.relevanceScore,
    reasoning: rec.reasoning
  }))

  // Топ вакансии для превью (если профиль достаточно заполнен)
  const jobRecommendations = profile.profileStrength >= 50 ? 
    smartRecommendations.jobs.slice(0, 2).map(rec => ({
      ...rec.data,
      relevanceScore: rec.relevanceScore,
      reasoning: rec.reasoning
    })) : []

  // Статистика для прогресса
  const skillsCount = profile.userSkills.length
  const verifiedSkillsCount = profile.userSkills.filter((us: any) => us.isVerified).length
  const projectsWithAchievements = profile.userProjects.filter((up: any) => up.achievements).length

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Мой Карьерный Путь
          </h1>
          <p className="text-muted-foreground">
            Добро пожаловать, {session.user.name}! Управляйте своим профессиональным развитием.
          </p>
        </div>
        <div className="flex space-x-3">
          <Link href="/dashboard/employee/opportunities">
            <Button variant="outline">
              <TrendingUp className="mr-2 h-4 w-4" />
              Возможности
            </Button>
          </Link>
          <Link href="/dashboard/employee/profile">
            <Button>
              <Users className="mr-2 h-4 w-4" />
              Мастерская Карьеры
            </Button>
          </Link>
        </div>
      </div>

      {/* Баннер онбординга для новых пользователей */}
      {!profile.onboardingCompleted && (
        <OnboardingBanner 
          profileStrength={profile.profileStrength}
        />
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* ИИ-консультант Навигатор */}
        <NavigatorCard 
          className="md:col-span-2" 
          profileStrength={profile.profileStrength}
          recentAchievements={profile.badges.slice(0, 3).map((ub: any) => ub.badge.name)}
          onboardingCompleted={profile.onboardingCompleted}
        />

        {/* Прогресс профиля */}
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Target className="h-5 w-5 text-green-600" />
              <CardTitle>Мой Прогресс</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Сила Профиля</span>
                  <span className="text-sm text-muted-foreground">{profile.profileStrength}%</span>
                </div>
                <Progress value={profile.profileStrength} className="h-2" />
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">
                    Уровень: {levelInfo.current?.title || 'Newcomer'}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {profile.xp}{levelInfo.next ? `/${levelInfo.next.minXp}` : ''} XP
                  </span>
                </div>
                {levelInfo.next && (
                  <Progress 
                    value={((profile.xp - levelInfo.current!.minXp) / (levelInfo.next.minXp - levelInfo.current!.minXp)) * 100} 
                    className="h-2" 
                  />
                )}
              </div>

              {nextBestAction && (
                <div className="bg-yellow-50 p-3 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <Zap className="h-4 w-4 text-yellow-600 mt-0.5" />
                    <div>
                      <p className="text-xs text-yellow-800 font-medium">
                        Следующее лучшее действие:
                      </p>
                      <p className="text-xs text-yellow-700 mt-1">
                        {nextBestAction}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Статистика профиля */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Book className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{skillsCount}</p>
                <p className="text-xs text-muted-foreground">Навыков</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Award className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{verifiedSkillsCount}</p>
                <p className="text-xs text-muted-foreground">Подтвержденных</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">{profile.userProjects.length}</p>
                <p className="text-xs text-muted-foreground">Проектов</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Trophy className="h-4 w-4 text-yellow-600" />
              <div>
                <p className="text-2xl font-bold">{profile.badges.length}</p>
                <p className="text-xs text-muted-foreground">Бейджей</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Coins className="h-4 w-4 text-yellow-600" />
              <div>
                <p className="text-2xl font-bold text-yellow-700">{profile.tCoins}</p>
                <p className="text-xs text-muted-foreground">T-Coins</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Рекомендованные возможности - краткий превью */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              <CardTitle>Рекомендованные Возможности</CardTitle>
            </div>
            <Link href="/dashboard/employee/opportunities">
              <Button variant="outline" size="sm">
                Смотреть все
              </Button>
            </Link>
          </div>
          <CardDescription>
            Персонализированные предложения для вашего карьерного развития
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2">
            {/* Проекты */}
            {recommendedProjects.slice(0, 1).map((project) => (
              <OpportunityPreviewCard
                key={project.id}
                opportunity={{
                  id: project.id,
                  title: project.name,
                  description: project.description || 'Интересный проект для применения навыков',
                  type: 'project'
                }}
              />
            ))}

            {/* Умные рекомендации курсов */}
            {recommendedCourses.slice(0, 1).map((course) => (
              <Card key={course.id} className="border-l-4 border-l-blue-500">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold">{course.title}</h4>
                    <Badge variant="outline" className="text-xs">
                      {Math.round((course.relevanceScore || 0) * 100)}% релевантность
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{course.description}</p>
                  <p className="text-xs text-blue-700 font-medium mb-3">
                    💡 {course.reasoning || 'Рекомендовано для развития'}
                  </p>
                  <div className="flex gap-2">
                    <Badge variant="secondary">{course.level}</Badge>
                    <Badge variant="secondary">+{course.xpReward} XP</Badge>
                    <Badge variant="secondary">{course.duration}ч</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Умные рекомендации вакансий */}
            {jobRecommendations.slice(0, 1).map((job) => (
              <Card key={job.id} className="border-l-4 border-l-green-500">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold">{job.title}</h4>
                    <Badge variant="outline" className="text-xs">
                      {Math.round((job.relevanceScore || 0) * 100)}% соответствие
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{job.department} • {job.level}</p>
                  <p className="text-xs text-green-700 font-medium mb-3">
                    🎯 {job.reasoning || 'Подходит для карьерного роста'}
                  </p>
                  <div className="flex gap-1 flex-wrap">
                    {job.requirements?.slice(0, 3).map((req: string, idx: number) => (
                      <Badge key={idx} variant="outline" className="text-xs">{req}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Умные рекомендации менторства */}
            {recommendedMentorPrograms.slice(0, 1).map((program) => (
              <Card key={program.id} className="border-l-4 border-l-purple-500">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold">{program.title}</h4>
                    <Badge variant="outline" className="text-xs">
                      {Math.round((program.relevanceScore || 0) * 100)}% релевантность
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{program.description}</p>
                  <p className="text-xs text-purple-700 font-medium mb-3">
                    👥 {program.reasoning || 'Поможет развить нужные навыки'}
                  </p>
                  <div className="flex gap-1 flex-wrap">
                    {program.skills?.slice(0, 3).map((skill: string, idx: number) => (
                      <Badge key={idx} variant="secondary" className="text-xs">{skill}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {/* <div className="mt-4 pt-4 border-t">
            <Link href="/dashboard/employee/opportunities">
              <Button className="w-full" variant="outline">
                <TrendingUp className="mr-2 h-4 w-4" />
                Открыть все возможности
              </Button>
            </Link>
          </div> */}
        </CardContent>
      </Card>

      {/* Недавние достижения */}
      {profile.badges.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Trophy className="h-5 w-5 text-yellow-600" />
              <CardTitle>Недавние Достижения</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {profile.badges.slice(0, 3).map((userBadge: any) => (
                <div key={userBadge.id} className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                    <Trophy className="w-4 h-4 text-yellow-600" />
                  </div>
                  <div>
                    <p className="font-medium">Получен бейдж "{userBadge.badge.name}"</p>
                    <p className="text-sm text-muted-foreground">
                      {userBadge.badge.description}
                    </p>
                  </div>
                </div>
              ))}
              
              {projectsWithAchievements > 0 && (
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <Star className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">+{profile.xp} XP набрано</p>
                    <p className="text-sm text-muted-foreground">
                      За активное развитие и заполнение профиля
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}