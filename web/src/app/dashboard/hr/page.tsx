import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Role } from "@prisma/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
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
  PieChart
} from "lucide-react"

export default async function HRDashboard() {
  const session = await getServerSession(authOptions)
  
  if (!session || session.user.role !== Role.HR) {
    redirect("/dashboard")
  }

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
            <div className="text-2xl font-bold">78%</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+5%</span> за месяц
            </p>
            <Progress value={78} className="mt-2 h-2" />
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
            <div className="text-2xl font-bold">85%</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+2%</span> за месяц
            </p>
            <Progress value={85} className="mt-2 h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Индекс Кадрового Риска
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12%</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-red-600">+1%</span> за месяц
            </p>
            <Progress value={12} className="mt-2 h-2" />
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
            <div className="text-2xl font-bold">342</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+8</span> за месяц
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
                <Badge className="bg-green-100 text-green-800">JavaScript (95 чел.)</Badge>
                <Badge className="bg-green-100 text-green-800">React (78 чел.)</Badge>
                <Badge className="bg-blue-100 text-blue-800">Java (65 чел.)</Badge>
                <Badge className="bg-blue-100 text-blue-800">Python (52 чел.)</Badge>
                <Badge className="bg-purple-100 text-purple-800">SQL (89 чел.)</Badge>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">Редкие/ценные навыки:</h4>
              <div className="flex flex-wrap gap-2">
                <Badge className="bg-red-100 text-red-800">Rust (3 чел.)</Badge>
                <Badge className="bg-red-100 text-red-800">Blockchain (5 чел.)</Badge>
                <Badge className="bg-orange-100 text-orange-800">Machine Learning (12 чел.)</Badge>
                <Badge className="bg-orange-100 text-orange-800">DevOps (18 чел.)</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Анализ разрывов в компетенциях */}
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
              <div>
                <h4 className="font-medium mb-2">Middle → Senior Frontend:</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">TypeScript (продвинутый)</span>
                    <Badge variant="outline">Нужно 23 чел.</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Архитектура приложений</span>
                    <Badge variant="outline">Нужно 31 чел.</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Менторство</span>
                    <Badge variant="outline">Нужно 18 чел.</Badge>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Middle → Senior Backend:</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Системный дизайн</span>
                    <Badge variant="outline">Нужно 28 чел.</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Микросервисы</span>
                    <Badge variant="outline">Нужно 35 чел.</Badge>
                  </div>
                </div>
              </div>
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
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Senior Developer</span>
                    <Badge>47 чел.</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Team Lead</span>
                    <Badge>32 чел.</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Product Manager</span>
                    <Badge>18 чел.</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Architect</span>
                    <Badge>15 чел.</Badge>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Направления развития:</h4>
                <div className="flex flex-wrap gap-2">
                  <Badge className="bg-blue-100 text-blue-800">
                    Экспертный рост (68%)
                  </Badge>
                  <Badge className="bg-green-100 text-green-800">
                    Менеджерский (32%)
                  </Badge>
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
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold">IT Отдел</h4>
                  <TrendingUp className="h-4 w-4 text-green-600" />
                </div>
                <div className="text-2xl font-bold mb-1">92%</div>
                <p className="text-sm text-muted-foreground">
                  Активность: отличная
                </p>
                <Progress value={92} className="mt-2 h-2" />
              </div>

              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold">Маркетинг</h4>
                  <TrendingDown className="h-4 w-4 text-red-600" />
                </div>
                <div className="text-2xl font-bold mb-1">54%</div>
                <p className="text-sm text-muted-foreground">
                  Активность: упала
                </p>
                <Progress value={54} className="mt-2 h-2" />
              </div>

              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold">Продажи</h4>
                  <TrendingUp className="h-4 w-4 text-green-600" />
                </div>
                <div className="text-2xl font-bold mb-1">78%</div>
                <p className="text-sm text-muted-foreground">
                  Активность: растет
                </p>
                <Progress value={78} className="mt-2 h-2" />
              </div>
            </div>

            <div className="bg-orange-50 p-4 rounded-lg">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
                <div>
                  <p className="font-medium text-orange-800">Внимание</p>
                  <p className="text-sm text-orange-700">
                    В отделе маркетинга резко упала активность после смены руководителя. 
                    Рекомендуется провести интервью с командой.
                  </p>
                </div>
              </div>
            </div>
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
              Создать программу "Путь к Senior"
            </Button>
            <Button variant="outline" className="justify-start">
              <Award className="mr-2 h-4 w-4" />
              Запустить кампанию по заполнению профилей
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
