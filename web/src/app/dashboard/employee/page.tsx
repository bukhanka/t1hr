import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Role } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { NavigatorCard } from "@/components/navigator-card"
import { OpportunityPreviewCard } from "@/components/opportunity-preview-card"
import { GamificationService } from "@/lib/gamification"
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
  
  if (!session || session.user.role !== Role.EMPLOYEE) {
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
    let user = await prisma.user.findUnique({
      where: { id: session.user.id }
    })

    if (!user) {
      // Создаем пользователя если его нет
      user = await prisma.user.create({
        data: {
          id: session.user.id,
          email: session.user.email || '',
          name: session.user.name || 'Пользователь',
          role: (session.user as any).role || 'EMPLOYEE'
        }
      })
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

  // Рекомендуемые проекты
  const recommendedProjects = await prisma.project.findMany({
    where: {
      status: 'ACTIVE',
      NOT: {
        userProjects: {
          some: {
            profileId: profile.id
          }
        }
      }
    },
    take: 3
  })

  // Рекомендуемые курсы для превью
  const enrolledCourseIds = profile.userCourses?.map(uc => uc.courseId) || []
  const recommendedCourses = await prisma.course.findMany({
    where: {
      status: 'ACTIVE',
      NOT: {
        id: { in: enrolledCourseIds }
      }
    },
    take: 2
  })

  // Менторские программы для превью
  const participatingProgramIds = profile.mentorPrograms?.map(ump => ump.programId) || []
  const recommendedMentorPrograms = await prisma.mentorProgram.findMany({
    where: {
      status: 'ACTIVE',
      NOT: {
        id: { in: participatingProgramIds }
      }
    },
    take: 2
  })

  // Вакансии для превью
  const jobOpenings = await prisma.jobOpening.findMany({
    where: {
      status: 'OPEN'
    },
    take: 2
  })

  // Статистика для прогресса
  const skillsCount = profile.userSkills.length
  const verifiedSkillsCount = profile.userSkills.filter(us => us.isVerified).length
  const projectsWithAchievements = profile.userProjects.filter(up => up.achievements).length

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

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* ИИ-консультант Навигатор */}
        <NavigatorCard 
          className="md:col-span-2" 
          profileStrength={profile.profileStrength}
          recentAchievements={profile.badges.slice(0, 3).map(ub => ub.badge.name)}
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

            {/* Курсы */}
            {recommendedCourses.slice(0, 1).map((course) => (
              <OpportunityPreviewCard
                key={course.id}
                opportunity={{
                  id: course.id,
                  title: course.title,
                  description: course.description,
                  type: 'course',
                  level: course.level,
                  xpReward: course.xpReward,
                  duration: course.duration || undefined,
                  format: course.format,
                  skills: course.skills
                }}
              />
            ))}

            {/* Вакансии (если подходящий уровень) */}
            {profile.level >= 2 && jobOpenings.slice(0, 1).map((job) => (
              <OpportunityPreviewCard
                key={job.id}
                opportunity={{
                  id: job.id,
                  title: job.title,
                  description: job.description,
                  type: 'job',
                  level: job.level,
                  requirements: job.requirements,
                  department: job.department
                }}
              />
            ))}

            {/* Менторские программы */}
            {recommendedMentorPrograms.slice(0, 1).map((program) => (
              <OpportunityPreviewCard
                key={program.id}
                opportunity={{
                  id: program.id,
                  title: program.title,
                  description: program.description,
                  type: 'mentor',
                  skills: program.skills,
                  maxSlots: program.maxSlots,
                  mentorId: program.mentorId
                }}
              />
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
              {profile.badges.slice(0, 3).map((userBadge) => (
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