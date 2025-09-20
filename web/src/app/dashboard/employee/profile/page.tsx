import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Role } from "@prisma/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  User, 
  Briefcase, 
  Target, 
  Trophy,
  Plus,
  Settings,
  Star,
  CheckCircle
} from "lucide-react"

export default async function EmployeeProfile() {
  const session = await getServerSession(authOptions)
  
  if (!session || session.user.role !== Role.EMPLOYEE) {
    redirect("/dashboard")
  }

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Мастерская Карьеры
          </h1>
          <p className="text-muted-foreground">
            Постройте и "прокачайте" свой профессиональный аватар
          </p>
        </div>
        <Button>
          <Settings className="mr-2 h-4 w-4" />
          Настройки профиля
        </Button>
      </div>

      <Tabs defaultValue="skills" className="space-y-4">
        <TabsList>
          <TabsTrigger value="skills">Компетенции и Навыки</TabsTrigger>
          <TabsTrigger value="projects">Портфолио Проектов</TabsTrigger>
          <TabsTrigger value="goals">Карьерные Цели</TabsTrigger>
          <TabsTrigger value="achievements">Зал Славы</TabsTrigger>
        </TabsList>

        {/* Компетенции и Навыки */}
        <TabsContent value="skills" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Мои Навыки</CardTitle>
                  <CardDescription>
                    Управляйте своими профессиональными компетенциями
                  </CardDescription>
                </div>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Добавить навык
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {/* Пример существующих навыков */}
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold">JavaScript</h4>
                    <Badge variant="secondary">5/5</Badge>
                  </div>
                  <div className="flex items-center space-x-2 mb-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-green-600">Подтвержден</span>
                  </div>
                  <div className="flex space-x-2">
                    <Badge>Использую</Badge>
                    <Button size="sm" variant="outline">
                      Запросить подтверждение
                    </Button>
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold">React</h4>
                    <Badge variant="secondary">4/5</Badge>
                  </div>
                  <div className="text-sm text-muted-foreground mb-2">
                    Не подтвержден
                  </div>
                  <div className="flex space-x-2">
                    <Badge>Использую</Badge>
                    <Button size="sm" variant="outline">
                      Запросить подтверждение
                    </Button>
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold">Kotlin</h4>
                    <Badge variant="outline">Цель</Badge>
                  </div>
                  <div className="text-sm text-muted-foreground mb-2">
                    Планирую изучить
                  </div>
                  <div className="flex space-x-2">
                    <Badge variant="secondary">Хочу изучить</Badge>
                    <Button size="sm" variant="outline">
                      Найти курсы
                    </Button>
                  </div>
                </div>

                {/* Карточка добавления нового навыка */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 flex flex-col items-center justify-center text-center hover:border-gray-400 cursor-pointer">
                  <Plus className="h-8 w-8 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600">Добавить новый навык</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Портфолио Проектов */}
        <TabsContent value="projects" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Мои Проекты и Достижения</CardTitle>
                  <CardDescription>
                    Опишите ваш вклад в корпоративные проекты
                  </CardDescription>
                </div>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Добавить проект
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Проект из Jira - требует дополнения */}
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold">Проект "Омега"</h4>
                    <Badge variant="outline" className="text-orange-600">
                      Требует дополнения
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Импортировано из Jira • Статус: Завершен
                  </p>
                  <div className="bg-orange-50 p-3 rounded-lg mb-3">
                    <p className="text-sm text-orange-800">
                      Опишите вашу роль и ключевые результаты в этом проекте для получения +100 XP
                    </p>
                  </div>
                  <Button size="sm">
                    Дополнить информацию
                  </Button>
                </div>

                {/* Заполненный проект */}
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold">Проект "Альфа"</h4>
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="text-sm text-muted-foreground mb-2">
                    Frontend Developer • 2023-2024
                  </div>
                  <p className="text-sm mb-3">
                    Разработал пользовательский интерфейс для системы управления заказами. 
                    Увеличил конверсию на 15% благодаря оптимизации UX. Внедрил компонентную 
                    архитектуру, которая сократила время разработки новых фич на 30%.
                  </p>
                  <div className="flex flex-wrap gap-2 mb-3">
                    <Badge variant="secondary">React</Badge>
                    <Badge variant="secondary">TypeScript</Badge>
                    <Badge variant="secondary">Redux</Badge>
                  </div>
                  <Button size="sm" variant="outline">
                    Редактировать
                  </Button>
                </div>

                {/* Карточка добавления нового проекта */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 flex flex-col items-center justify-center text-center hover:border-gray-400 cursor-pointer">
                  <Briefcase className="h-8 w-8 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600">Добавить новый проект</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Карьерные Цели */}
        <TabsContent value="goals" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Мои Карьерные Цели</CardTitle>
              <CardDescription>
                Определите свои профессиональные амбиции и направления развития
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Целевая должность
                    </label>
                    <div className="border rounded-lg p-3 bg-gray-50">
                      <p className="font-medium">Senior Frontend Developer</p>
                      <p className="text-sm text-muted-foreground">
                        Стремлюсь к экспертному уровню
                      </p>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Интересующее направление
                    </label>
                    <div className="border rounded-lg p-3 bg-gray-50">
                      <p className="font-medium">Frontend Architecture</p>
                      <p className="text-sm text-muted-foreground">
                        Архитектура фронтенд приложений
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Желаемый вектор развития
                  </label>
                  <div className="border rounded-lg p-3 bg-gray-50">
                    <p className="font-medium">Экспертный</p>
                    <p className="text-sm text-muted-foreground">
                      Углубление в техническую экспертизу
                    </p>
                  </div>
                </div>

                <Button>
                  <Target className="mr-2 h-4 w-4" />
                  Изменить цели
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Зал Славы */}
        <TabsContent value="achievements" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Зал Славы</CardTitle>
              <CardDescription>
                Ваши достижения и прогресс в системе
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-4">Мои Бейджи</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col items-center p-4 border rounded-lg">
                      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-2">
                        <Star className="w-6 h-6 text-green-600" />
                      </div>
                      <span className="text-sm font-medium">Активный участник</span>
                      <span className="text-xs text-muted-foreground text-center">
                        За регулярное обновление профиля
                      </span>
                    </div>
                    
                    <div className="flex flex-col items-center p-4 border rounded-lg">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-2">
                        <Trophy className="w-6 h-6 text-blue-600" />
                      </div>
                      <span className="text-sm font-medium">Завершитель</span>
                      <span className="text-xs text-muted-foreground text-center">
                        За успешное завершение 3 проектов
                      </span>
                    </div>

                    <div className="flex flex-col items-center p-4 border-2 border-dashed border-gray-300 rounded-lg opacity-50">
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-2">
                        <User className="w-6 h-6 text-gray-400" />
                      </div>
                      <span className="text-sm font-medium">Ментор</span>
                      <span className="text-xs text-muted-foreground text-center">
                        Помогите 3 коллегам
                      </span>
                    </div>

                    <div className="flex flex-col items-center p-4 border-2 border-dashed border-gray-300 rounded-lg opacity-50">
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-2">
                        <CheckCircle className="w-6 h-6 text-gray-400" />
                      </div>
                      <span className="text-sm font-medium">Мастер профиля</span>
                      <span className="text-xs text-muted-foreground text-center">
                        100% заполнение профиля
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-4">Статистика</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 border rounded-lg">
                      <span className="text-sm">Текущий уровень</span>
                      <Badge>Middle</Badge>
                    </div>
                    <div className="flex justify-between items-center p-3 border rounded-lg">
                      <span className="text-sm">Общий XP</span>
                      <span className="font-semibold">450</span>
                    </div>
                    <div className="flex justify-between items-center p-3 border rounded-lg">
                      <span className="text-sm">Завершенных проектов</span>
                      <span className="font-semibold">3</span>
                    </div>
                    <div className="flex justify-between items-center p-3 border rounded-lg">
                      <span className="text-sm">Подтвержденных навыков</span>
                      <span className="font-semibold">8</span>
                    </div>
                    <div className="flex justify-between items-center p-3 border rounded-lg">
                      <span className="text-sm">В системе с</span>
                      <span className="font-semibold">Января 2024</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
