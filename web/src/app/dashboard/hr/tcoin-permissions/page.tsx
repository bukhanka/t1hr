import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Role } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Plus, Settings } from "lucide-react"
import { TCoinPermissionForm } from "@/components/tcoin-permission-form"
import { TCoinPermissionsList } from "@/components/tcoin-permissions-list"

async function getPermissionsData() {
  try {
    // Получаем всех проектных менеджеров
    const projectManagers = await prisma.profile.findMany({
      where: {
        user: { role: Role.PROJECT_MANAGER }
      },
      include: {
        user: { select: { name: true, email: true } },
        managedProjects: { select: { id: true, name: true } },
        tcoinPermissions: {
          include: {
            project: { select: { id: true, name: true } }
          }
        }
      }
    })

    // Получаем все проекты
    const projects = await prisma.project.findMany({
      select: { id: true, name: true },
      orderBy: { name: 'asc' }
    })

    // Получаем статистику использования разрешений
    const stats = await prisma.tCoinTransaction.aggregate({
      where: {
        awardedById: { not: null },
        createdAt: {
          gte: new Date(new Date().setDate(new Date().getDate() - 30))
        }
      },
      _sum: { amount: true },
      _count: true
    })

    return {
      projectManagers,
      projects,
      stats: {
        totalAwarded: stats._sum.amount || 0,
        transactionsCount: stats._count || 0
      }
    }
  } catch (error) {
    console.error('Error fetching permissions data:', error)
    return {
      projectManagers: [],
      projects: [],
      stats: { totalAwarded: 0, transactionsCount: 0 }
    }
  }
}

export default async function TCoinPermissionsPage() {
  const session = await getServerSession(authOptions)
  
  if (!session || session.user.role !== Role.HR) {
    redirect("/dashboard")
  }

  const { projectManagers, projects, stats } = await getPermissionsData()

  return (
    <div className="space-y-6">
      {/* Навигация */}
      <div className="flex items-center space-x-2">
        <Button variant="outline" size="sm" asChild>
          <a href="/dashboard/hr">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Назад к HR Dashboard
          </a>
        </Button>
      </div>

      {/* Заголовок */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Управление разрешениями T-коинов
          </h1>
          <p className="text-muted-foreground">
            Настройка прав проектных менеджеров на начисление T-коинов
          </p>
        </div>
      </div>

      {/* Статистика */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Активных менеджеров</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projectManagers.length}</div>
            <p className="text-xs text-muted-foreground">
              проектных менеджеров
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Начислено за месяц</CardTitle>
            <Plus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAwarded}</div>
            <p className="text-xs text-muted-foreground">
              T-коинов всего
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Транзакций</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.transactionsCount}</div>
            <p className="text-xs text-muted-foreground">
              начислений за месяц
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Форма добавления разрешения */}
        <Card>
          <CardHeader>
            <CardTitle>Добавить разрешение</CardTitle>
            <CardDescription>
              Выдайте менеджеру права на начисление T-коинов
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TCoinPermissionForm 
              projectManagers={projectManagers}
              projects={projects}
            />
          </CardContent>
        </Card>

        {/* Список существующих разрешений */}
        <Card>
          <CardHeader>
            <CardTitle>Активные разрешения</CardTitle>
            <CardDescription>
              Текущие настройки доступа менеджеров
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TCoinPermissionsList projectManagers={projectManagers} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
