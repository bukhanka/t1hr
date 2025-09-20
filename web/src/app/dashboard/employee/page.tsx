import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Role } from "@prisma/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { 
  MessageCircle,
  Target,
  Trophy,
  TrendingUp,
  Star,
  Award,
  Book
} from "lucide-react"

export default async function EmployeeDashboard() {
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
            Мой Карьерный Путь
          </h1>
          <p className="text-muted-foreground">
            Добро пожаловать, {session.user.name}! Управляйте своим профессиональным развитием.
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* ИИ-консультант Навигатор */}
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <MessageCircle className="h-5 w-5 text-blue-600" />
              <CardTitle>Навигатор - Ваш ИИ-консультант</CardTitle>
            </div>
            <CardDescription>
              Персональный помощник по карьерному развитию
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-600">
              <p className="text-blue-900 mb-3">
                Привет, {session.user.name?.split(' ')[0]}! Я заметил, что ваш профиль заполнен только на 40%. 
                Давайте потратим 5 минут, чтобы добавить описание ваших последних проектов. 
                Это принесет вам +150 XP и сделает ваши достижения видимыми для менеджеров проектов.
              </p>
              <div className="flex space-x-2">
                <Button size="sm">
                  Добавить проекты
                </Button>
                <Button variant="outline" size="sm">
                  Задать вопрос
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

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
                  <span className="text-sm text-muted-foreground">40%</span>
                </div>
                <Progress value={40} className="h-2" />
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Уровень: Middle</span>
                  <span className="text-sm text-muted-foreground">450/1200 XP</span>
                </div>
                <Progress value={37.5} className="h-2" />
              </div>

              <div className="bg-yellow-50 p-3 rounded-lg">
                <p className="text-xs text-yellow-800 font-medium">
                  Следующее лучшее действие:
                </p>
                <p className="text-xs text-yellow-700 mt-1">
                  Заполните поле "Ключевые результаты" для проекта "Омега" (+100 XP)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Рекомендованные возможности */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Рекомендованные Возможности</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Book className="h-4 w-4 text-blue-600" />
                <Badge variant="secondary">Проект</Badge>
              </div>
              <CardTitle className="text-lg">Проект "Феникс"</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                Почему подходит вам: Используется Kotlin, который вы указали в целях развития.
              </p>
              <div className="flex space-x-2">
                <Button size="sm" variant="outline">
                  Узнать больше
                </Button>
                <Button size="sm">
                  В избранное
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Award className="h-4 w-4 text-purple-600" />
                <Badge variant="secondary">Роль</Badge>
              </div>
              <CardTitle className="text-lg">Team Lead</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                Почему подходит вам: Ваши подтвержденные навыки "Менторство" и "Управление командой" 
                делают вас сильным кандидатом.
              </p>
              <div className="flex space-x-2">
                <Button size="sm" variant="outline">
                  Узнать больше
                </Button>
                <Button size="sm">
                  Интересует
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <Badge variant="secondary">Курс</Badge>
              </div>
              <CardTitle className="text-lg">Advanced Kotlin</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                Углубленное изучение Kotlin для Android и Backend разработки. 
                Соответствует вашим карьерным целям.
              </p>
              <div className="flex space-x-2">
                <Button size="sm" variant="outline">
                  Программа
                </Button>
                <Button size="sm">
                  Записаться
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Недавние достижения */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Trophy className="h-5 w-5 text-yellow-600" />
            <CardTitle>Недавние Достижения</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <Star className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <p className="font-medium">Получен бейдж "Активный участник"</p>
                <p className="text-sm text-muted-foreground">За регулярное обновление профиля</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <Award className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="font-medium">+100 XP за завершение проекта</p>
                <p className="text-sm text-muted-foreground">Проект "Альфа" успешно завершен</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
