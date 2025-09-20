import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Role } from "@prisma/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  Search,
  Filter,
  Users,
  Star,
  CheckCircle,
  MessageCircle,
  Bookmark,
  MoreHorizontal
} from "lucide-react"

export default async function ManagerDashboard() {
  const session = await getServerSession(authOptions)
  
  if (!session || session.user.role !== Role.MANAGER) {
    redirect("/dashboard")
  }

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Центр Поиска Талантов
          </h1>
          <p className="text-muted-foreground">
            Находите идеальных кандидатов для ваших проектов за минуты, а не дни
          </p>
        </div>
        <Button>
          <Users className="mr-2 h-4 w-4" />
          Мои шорт-листы
        </Button>
      </div>

      {/* Умная поисковая строка */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Умный поиск талантов</CardTitle>
          <CardDescription>
            Опишите свои потребности на естественном языке или используйте фильтры
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex space-x-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Например: Ищу Senior Java разработчика с опытом в финтехе, который работал с Kafka и знает микросервисы"
                  className="pl-10"
                />
              </div>
              <Button>
                <Search className="mr-2 h-4 w-4" />
                Найти
              </Button>
              <Button variant="outline">
                <Filter className="mr-2 h-4 w-4" />
                Фильтры
              </Button>
            </div>

            {/* Быстрые фильтры */}
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="cursor-pointer hover:bg-gray-100">
                Frontend
              </Badge>
              <Badge variant="outline" className="cursor-pointer hover:bg-gray-100">
                Backend
              </Badge>
              <Badge variant="outline" className="cursor-pointer hover:bg-gray-100">
                Senior
              </Badge>
              <Badge variant="outline" className="cursor-pointer hover:bg-gray-100">
                Middle
              </Badge>
              <Badge variant="outline" className="cursor-pointer hover:bg-gray-100">
                Доступен
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Панель результатов */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">
            Найденные кандидаты <span className="text-muted-foreground">(12)</span>
          </h2>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm">
              Сортировка: По релевантности
            </Button>
          </div>
        </div>

        <div className="grid gap-4">
          {/* Карточка кандидата 1 - высокое соответствие */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex space-x-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src="/placeholder-avatar.jpg" />
                    <AvatarFallback>АИ</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="font-semibold">Иванов Алексей</h3>
                      <Badge className="bg-green-100 text-green-800">95% соответствие</Badge>
                    </div>
                    <p className="text-muted-foreground text-sm mb-2">
                      Senior Java Developer • Backend отдел • 5 лет в компании
                    </p>
                    <div className="flex flex-wrap gap-1 mb-3">
                      <Badge variant="secondary" className="text-xs">Java</Badge>
                      <Badge variant="secondary" className="text-xs">Kafka</Badge>
                      <Badge variant="secondary" className="text-xs">Микросервисы</Badge>
                      <Badge variant="secondary" className="text-xs">Spring Boot</Badge>
                    </div>
                    <p className="text-sm text-gray-700 mb-2">
                      <strong>Ключевые совпадения:</strong> Участвовал в проекте "Банковские переводы", 
                      имеет подтвержденный опыт с Kafka и архитектурой микросервисов.
                    </p>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <div className="flex items-center space-x-1">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span>Доступен для новых задач</span>
                      </div>
                      <span>Последнее обновление: вчера</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col space-y-2">
                  <Button size="sm">
                    <Bookmark className="mr-2 h-4 w-4" />
                    В шорт-лист
                  </Button>
                  <Button size="sm" variant="outline">
                    Профиль
                  </Button>
                  <Button size="sm" variant="outline">
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Связаться
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Карточка кандидата 2 - среднее соответствие */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex space-x-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src="/placeholder-avatar.jpg" />
                    <AvatarFallback>МП</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="font-semibold">Петрова Мария</h3>
                      <Badge className="bg-yellow-100 text-yellow-800">78% соответствие</Badge>
                    </div>
                    <p className="text-muted-foreground text-sm mb-2">
                      Middle+ Java Developer • Backend отдел • 3 года в компании
                    </p>
                    <div className="flex flex-wrap gap-1 mb-3">
                      <Badge variant="secondary" className="text-xs">Java</Badge>
                      <Badge variant="secondary" className="text-xs">PostgreSQL</Badge>
                      <Badge variant="secondary" className="text-xs">REST API</Badge>
                      <Badge variant="outline" className="text-xs">Kafka</Badge>
                    </div>
                    <p className="text-sm text-gray-700 mb-2">
                      <strong>Ключевые совпадения:</strong> Сильные навыки Java, активно изучает Kafka. 
                      Участвовала в проекте "CRM система".
                    </p>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <div className="flex items-center space-x-1">
                        <Star className="h-4 w-4 text-orange-500" />
                        <span>На критическом проекте до 15.12</span>
                      </div>
                      <span>Последнее обновление: 3 дня назад</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col space-y-2">
                  <Button size="sm">
                    <Bookmark className="mr-2 h-4 w-4" />
                    В шорт-лист
                  </Button>
                  <Button size="sm" variant="outline">
                    Профиль
                  </Button>
                  <Button size="sm" variant="outline">
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Связаться
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Карточка кандидата 3 */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex space-x-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src="/placeholder-avatar.jpg" />
                    <AvatarFallback>СД</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="font-semibold">Смирнов Дмитрий</h3>
                      <Badge className="bg-blue-100 text-blue-800">68% соответствие</Badge>
                    </div>
                    <p className="text-muted-foreground text-sm mb-2">
                      Senior Developer • Fullstack отдел • 4 года в компании
                    </p>
                    <div className="flex flex-wrap gap-1 mb-3">
                      <Badge variant="outline" className="text-xs">Java</Badge>
                      <Badge variant="secondary" className="text-xs">Node.js</Badge>
                      <Badge variant="secondary" className="text-xs">React</Badge>
                      <Badge variant="secondary" className="text-xs">Docker</Badge>
                    </div>
                    <p className="text-sm text-gray-700 mb-2">
                      <strong>Альтернативное решение:</strong> Fullstack разработчик с опытом бэкенда. 
                      Может быстро переключиться на Java проекты.
                    </p>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <div className="flex items-center space-x-1">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span>Доступен с января</span>
                      </div>
                      <span>Последнее обновление: неделю назад</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col space-y-2">
                  <Button size="sm">
                    <Bookmark className="mr-2 h-4 w-4" />
                    В шорт-лист
                  </Button>
                  <Button size="sm" variant="outline">
                    Профиль
                  </Button>
                  <Button size="sm" variant="outline">
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Связаться
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Показать больше результатов */}
        <div className="text-center mt-6">
          <Button variant="outline">
            Показать еще 9 кандидатов
          </Button>
        </div>
      </div>
    </div>
  )
}
