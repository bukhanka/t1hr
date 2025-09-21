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
        <Card className="bg-gradient-to-br from-emerald-50 to-teal-100/50 border-emerald-200/50 hover:shadow-lg transition-all duration-300">
          <CardHeader className="pb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-emerald-600 rounded-lg">
                <Target className="h-5 w-5 text-white" />
              </div>
              <CardTitle className="text-emerald-900 font-semibold">Мой Прогресс</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-gray-700">Сила Профиля</span>
                <span className="text-lg font-bold text-emerald-700">{profile.profileStrength}%</span>
              </div>
              <div className="relative">
                <Progress 
                  value={profile.profileStrength} 
                  className="h-3 bg-emerald-100 rounded-full"
                />
                <div 
                  className="absolute top-0 left-0 h-3 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${profile.profileStrength}%` }}
                />
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-gray-700">
                  Уровень: {levelInfo.current?.title || 'Newcomer'}
                </span>
                <span className="text-sm font-medium text-emerald-600">
                  {profile.xp}{levelInfo.next ? `/${levelInfo.next.minXp}` : ''} XP
                </span>
              </div>
              {levelInfo.next && (
                <div className="relative">
                  <Progress 
                    value={((profile.xp - levelInfo.current!.minXp) / (levelInfo.next.minXp - levelInfo.current!.minXp)) * 100} 
                    className="h-2 bg-teal-100"
                  />
                  <div 
                    className="absolute top-0 left-0 h-2 bg-gradient-to-r from-teal-400 to-cyan-400 rounded-full transition-all duration-500"
                    style={{ width: `${((profile.xp - levelInfo.current!.minXp) / (levelInfo.next.minXp - levelInfo.current!.minXp)) * 100}%` }}
                  />
                </div>
              )}
            </div>

            {nextBestAction && (
              <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 rounded-lg p-4 shadow-sm">
                <div className="flex items-start space-x-3">
                  <div className="p-1 bg-yellow-500 rounded-md">
                    <Zap className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-yellow-800 mb-1">
                      Следующее лучшее действие:
                    </p>
                    <p className="text-sm text-yellow-700 leading-relaxed">
                      {nextBestAction}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Статистика профиля */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200/50 hover:shadow-md transition-all duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="p-2 bg-blue-600 rounded-lg">
                <Book className="h-5 w-5 text-white" />
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-blue-900">{skillsCount}</p>
                <p className="text-sm text-blue-700 font-medium">Навыков</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-green-50 to-green-100/50 border-green-200/50 hover:shadow-md transition-all duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="p-2 bg-green-600 rounded-lg">
                <Award className="h-5 w-5 text-white" />
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-green-900">{verifiedSkillsCount}</p>
                <p className="text-sm text-green-700 font-medium">Подтвержденных</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100/50 border-purple-200/50 hover:shadow-md transition-all duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="p-2 bg-purple-600 rounded-lg">
                <Calendar className="h-5 w-5 text-white" />
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-purple-900">{profile.userProjects.length}</p>
                <p className="text-sm text-purple-700 font-medium">Проектов</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-amber-50 to-amber-100/50 border-amber-200/50 hover:shadow-md transition-all duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="p-2 bg-amber-600 rounded-lg">
                <Trophy className="h-5 w-5 text-white" />
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-amber-900">{profile.badges.length}</p>
                <p className="text-sm text-amber-700 font-medium">Бейджей</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100/50 border-yellow-200/50 hover:shadow-md transition-all duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="p-2 bg-gradient-to-r from-yellow-600 to-orange-500 rounded-lg">
                <Coins className="h-5 w-5 text-white" />
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold bg-gradient-to-r from-yellow-700 to-orange-600 bg-clip-text text-transparent">{profile.tCoins}</p>
                <p className="text-sm text-yellow-700 font-medium">T-Coins</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Рекомендованные возможности - краткий превью */}
      <Card className="bg-gradient-to-br from-indigo-50 to-blue-50 border-indigo-200/50 hover:shadow-lg transition-all duration-300">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-indigo-600 to-blue-600 rounded-lg">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-indigo-900">Рекомендованные Возможности</CardTitle>
                <CardDescription className="text-indigo-700/70 mt-1">
                  Персонализированные предложения для вашего карьерного развития
                </CardDescription>
              </div>
            </div>
            <Link href="/dashboard/employee/opportunities">
              <Button 
                variant="outline" 
                size="sm" 
                className="border-indigo-300 text-indigo-700 hover:bg-indigo-100 hover:border-indigo-400"
              >
                Смотреть все
              </Button>
            </Link>
          </div>
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
        <Card className="bg-gradient-to-br from-orange-50 to-yellow-50 border-orange-200/50 hover:shadow-lg transition-all duration-300">
          <CardHeader className="pb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-lg">
                <Trophy className="h-5 w-5 text-white" />
              </div>
              <CardTitle className="text-orange-900">Недавние Достижения</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {profile.badges.slice(0, 3).map((userBadge: any) => (
                <div key={userBadge.id} className="flex items-center space-x-4 p-3 bg-white/50 rounded-lg border border-orange-100 hover:bg-white/80 transition-colors">
                  <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-md">
                    <Trophy className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">Получен бейдж "{userBadge.badge.name}"</p>
                    <p className="text-sm text-gray-600 mt-1">
                      {userBadge.badge.description}
                    </p>
                  </div>
                </div>
              ))}
              
              {projectsWithAchievements > 0 && (
                <div className="flex items-center space-x-4 p-3 bg-white/50 rounded-lg border border-blue-100 hover:bg-white/80 transition-colors">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center shadow-md">
                    <Star className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">+{profile.xp} XP набрано</p>
                    <p className="text-sm text-gray-600 mt-1">
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