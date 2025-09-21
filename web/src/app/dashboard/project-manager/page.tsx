import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Role } from "@prisma/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Coins, Users, TrendingUp, Award } from "lucide-react"
import { TCoinAwardForm } from "@/components/tcoin-award-form"
import { ProjectTeamList } from "@/components/project-team-list"

export default async function ProjectManagerDashboard() {
  const session = await getServerSession(authOptions)
  
  if (!session || session.user.role !== Role.PROJECT_MANAGER) {
    redirect("/dashboard")
  }

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Управление Проектом
          </h1>
          <p className="text-muted-foreground">
            Мотивируйте команду и управляйте проектными задачами
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" asChild>
            <a href="/dashboard/project-manager/analytics">
              <TrendingUp className="mr-2 h-4 w-4" />
              Аналитика
            </a>
          </Button>
        </div>
      </div>

      {/* Основные карточки */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Мои проекты</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">
              активных проекта
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Участники команды</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24</div>
            <p className="text-xs text-muted-foreground">
              человек в командах
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Начислено за месяц</CardTitle>
            <Coins className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,240</div>
            <p className="text-xs text-muted-foreground">
              T-коинов команде
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Лимит на сегодня</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">350</div>
            <p className="text-xs text-muted-foreground">
              T-коинов осталось
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Основной контент */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Форма начисления T-коинов */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Coins className="mr-2 h-5 w-5" />
              Начислить T-коины
            </CardTitle>
            <CardDescription>
              Поощрите сотрудника за хорошую работу
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TCoinAwardForm />
          </CardContent>
        </Card>

        {/* Команда проекта */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="mr-2 h-5 w-5" />
              Команда проекта
            </CardTitle>
            <CardDescription>
              Участники ваших активных проектов
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ProjectTeamList />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
