import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Role } from "@prisma/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { EmbeddingManager } from "@/components/embedding-manager"
import { TalentSearchComponent } from "@/components/talent-search-component"
import { 
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  Target,
  Award,
  AlertTriangle,
  CheckCircle,
  FileText,
  PieChart,
  Search
} from "lucide-react"

async function fetchHRAnalytics() {
  try {
    const [analyticsResponse, skillGapsResponse] = await Promise.all([
      fetch(`${process.env.NEXTAUTH_URL}/api/hr/analytics`, {
        headers: {
          'Content-Type': 'application/json'
        }
      }),
      fetch(`${process.env.NEXTAUTH_URL}/api/hr/skill-gaps`, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
    ])

    const analytics = analyticsResponse.ok ? await analyticsResponse.json() : null
    const skillGaps = skillGapsResponse.ok ? await skillGapsResponse.json() : null

    return { analytics, skillGaps }
  } catch (error) {
    console.error('Ошибка при получении HR аналитики:', error)
    return { analytics: null, skillGaps: null }
  }
}

export default async function HRDashboard() {
  const session = await getServerSession(authOptions)
  
  if (!session || session.user.role !== Role.HR) {
    redirect("/dashboard")
  }

  // Получаем реальные данные из API
  const { analytics, skillGaps } = await fetchHRAnalytics()

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            HR-Аналитика
          </h1>
          <p className="text-muted-foreground">
            Стратегическая карта талантов и кадровая аналитика компании
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" asChild>
            <a href="/dashboard/hr/rotation">
              <Users className="mr-2 h-4 w-4" />
              Управление Ротацией
            </a>
          </Button>
          <Button variant="outline" asChild>
            <a href="/dashboard/hr/tcoin-permissions">
              <Award className="mr-2 h-4 w-4" />
              T-коины
            </a>
          </Button>
          <Button variant="outline">
            <FileText className="mr-2 h-4 w-4" />
            Экспорт отчета
          </Button>
          <Button>
            <PieChart className="mr-2 h-4 w-4" />
            Конструктор отчетов
          </Button>
        </div>
      </div>

      {/* Ключевые метрики */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Здоровье Профилей
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.profileHealth?.healthyProfilesPercentage || 0}%</div>
            <p className="text-xs text-muted-foreground">
              Средняя сила: {analytics?.profileHealth?.averageStrength || 0}%
            </p>
            <Progress value={analytics?.profileHealth?.healthyProfilesPercentage || 0} className="mt-2 h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Уровень Вовлеченности
            </CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            {analytics?.engagement && analytics.engagement.length > 0 ? (
              <>
                <div className="text-2xl font-bold">
                  {Math.round(analytics.engagement.reduce((acc: number, dept: any) => acc + dept.engagementRate, 0) / analytics.engagement.length)}%
                </div>
                <p className="text-xs text-muted-foreground">
                  Активных: {analytics.engagement.reduce((acc: number, dept: any) => acc + dept.activeEmployees, 0)} сотрудников
                </p>
                <Progress value={Math.round(analytics.engagement.reduce((acc: number, dept: any) => acc + dept.engagementRate, 0) / analytics.engagement.length)} className="mt-2 h-2" />
              </>
            ) : (
              <>
                <div className="text-2xl font-bold">--</div>
                <p className="text-xs text-muted-foreground">Нет данных</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Завершение Онбординга
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.onboarding?.completionRate || 0}%</div>
            <p className="text-xs text-muted-foreground">
              {analytics?.onboarding?.pendingCount || 0} в процессе
            </p>
            <Progress value={analytics?.onboarding?.completionRate || 0} className="mt-2 h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Всего Сотрудников
            </CardTitle>
            <BarChart3 className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.overview?.totalEmployees || 0}</div>
            <p className="text-xs text-muted-foreground">
              Средний уровень: {analytics?.overview?.averageLevel || 0}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Тепловая карта компетенций */}
      <Card>
        <CardHeader>
          <CardTitle>Тепловая Карта Компетенций</CardTitle>
          <CardDescription>
            Самые популярные и редкие навыки в компании
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Топ популярных навыков:</h4>
              <div className="flex flex-wrap gap-2">
                {analytics?.skills?.topPopular?.slice(0, 8).map((skill: any) => (
                  <Badge key={skill.name} className="bg-green-100 text-green-800">
                    {skill.name} ({skill.userCount} чел.)
                    {skill.verifiedCount > 0 && <span className="ml-1 text-xs">✓{skill.verifiedCount}</span>}
                  </Badge>
                )) || [
                  <Badge key="loading" className="bg-gray-100 text-gray-800">Загрузка...</Badge>
                ]}
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">Редкие/ценные навыки:</h4>
              <div className="flex flex-wrap gap-2">
                {analytics?.skills?.rareSkills?.slice(0, 8).map((skill: any) => (
                  <Badge key={skill.name} className="bg-red-100 text-red-800">
                    {skill.name} ({skill.userCount} чел.)
                  </Badge>
                )) || [
                  <Badge key="loading" className="bg-gray-100 text-gray-800">Загрузка...</Badge>
                ]}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Умный поиск талантов */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5 text-blue-600" />
            Поиск и Подбор Талантов
          </CardTitle>
          <CardDescription>
            Найдите подходящих кандидатов для проектов и позиций с помощью ИИ
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TalentSearchComponent />
        </CardContent>
      </Card>

      {/* Анализ разрывов в компетенциях */}
      {/* Управление эмбеддингами */}
      <EmbeddingManager />

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Анализ Разрывов в Компетенциях</CardTitle>
            <CardDescription>
              Что нужно для роста до следующего уровня
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
            {skillGaps?.levelProgressionGaps && Object.keys(skillGaps.levelProgressionGaps).length > 0 ? (
              Object.entries(skillGaps.levelProgressionGaps).slice(0, 3).map(([transition, gaps]: [string, any]) => (
                <div key={transition}>
                  <h4 className="font-medium mb-2">{transition}:</h4>
                  <div className="space-y-2">
                    {gaps.slice(0, 3).map((gap: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between">
                        <span className="text-sm">{gap.skill}</span>
                        <Badge variant="outline">Нужно {gap.gapSize} чел.</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div>
                <h4 className="font-medium mb-2">Анализ разрывов:</h4>
                <p className="text-sm text-muted-foreground">Данные загружаются...</p>
              </div>
            )}
          </div>
            <Button className="mt-4" variant="outline">
              Подробный анализ
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Карьерные Ожидания</CardTitle>
            <CardDescription>
              Куда хотят расти сотрудники (анонимно)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Топ желанных должностей:</h4>
                <div className="space-y-2">
                  {analytics?.careerGoals?.popular?.slice(0, 5).map((goal: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between">
                      <span className="text-sm">{goal.target}</span>
                      <Badge>{goal.count} чел.</Badge>
                    </div>
                  )) || (
                    <p className="text-sm text-muted-foreground">Данные загружаются...</p>
                  )}
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Направления развития:</h4>
                <div className="flex flex-wrap gap-2">
                  {skillGaps?.careerAmbitionsVsSkills?.slice(0, 3).map((career: any, idx: number) => (
                    <Badge key={idx} className="bg-blue-100 text-blue-800">
                      {career.goalType}: {career.interestedEmployees} чел.
                    </Badge>
                  )) || (
                    <Badge className="bg-gray-100 text-gray-800">Данные загружаются...</Badge>
                  )}
                </div>
              </div>
            </div>
            <Button className="mt-4" variant="outline">
              Детальный отчет
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Аналитика вовлеченности */}
      <Card>
        <CardHeader>
          <CardTitle>Аналитика Вовлеченности по Отделам</CardTitle>
          <CardDescription>
            Как разные команды взаимодействуют с платформой
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid md:grid-cols-3 gap-4">
              {analytics?.engagement?.slice(0, 3).map((dept: any, idx: number) => {
                const trendIcon = dept.engagementRate >= 75 
                  ? <TrendingUp className="h-4 w-4 text-green-600" />
                  : dept.engagementRate >= 50
                  ? <div className="h-4 w-4 text-yellow-600">→</div>
                  : <TrendingDown className="h-4 w-4 text-red-600" />
                
                return (
                  <div key={idx} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold">{dept.department}</h4>
                      {trendIcon}
                    </div>
                    <div className="text-2xl font-bold mb-1">{dept.engagementRate}%</div>
                    <p className="text-sm text-muted-foreground">
                      Активных: {dept.activeEmployees}/{dept.totalEmployees}
                    </p>
                    <Progress value={dept.engagementRate} className="mt-2 h-2" />
                  </div>
                )
              }) || (
                <div className="col-span-3 text-center text-muted-foreground">
                  Данные по вовлеченности загружаются...
                </div>
              )}
            </div>

            {/* Рекомендации на основе реальных данных */}
            {skillGaps?.recommendations && skillGaps.recommendations.length > 0 && (
              <div className="bg-orange-50 p-4 rounded-lg">
                <div className="flex items-start space-x-2">
                  <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-orange-800">Рекомендации</p>
                    <div className="space-y-2 mt-2">
                      {skillGaps.recommendations.slice(0, 2).map((rec: any, idx: number) => (
                        <p key={idx} className="text-sm text-orange-700">
                          • {rec.message}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Быстрые действия */}
      <Card>
        <CardHeader>
          <CardTitle>Рекомендуемые Действия</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <Button variant="outline" className="justify-start">
              <Target className="mr-2 h-4 w-4" />
              Создать программу развития навыков
            </Button>
            <Button variant="outline" className="justify-start">
              <Award className="mr-2 h-4 w-4" />
              Кампания: завершение онбординга ({analytics?.onboarding?.pendingCount || 0} чел.)
            </Button>
            <Button variant="outline" className="justify-start">
              <Users className="mr-2 h-4 w-4" />
              Сформировать кадровый резерв
            </Button>
            <Button variant="outline" className="justify-start">
              <BarChart3 className="mr-2 h-4 w-4" />
              Анализ потребностей в обучении
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
