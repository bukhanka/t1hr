import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Role } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RotationStatusToggle } from "@/components/rotation-status-toggle"
import { 
  ArrowLeft, 
  Search, 
  Filter,
  RotateCcw,
  UserCheck,
  Users
} from "lucide-react"
import Link from "next/link"

export default async function RotationManagementPage() {
  const session = await getServerSession(authOptions)
  
  if (!session || session.user.role !== Role.HR) {
    redirect("/dashboard")
  }

  // Получаем всех сотрудников с их профилями
  const employees = await prisma.user.findMany({
    where: {
      role: Role.EMPLOYEE,
      profile: {
        isNot: null
      }
    },
    include: {
      profile: {
        include: {
          user: true,
          userSkills: {
            include: { skill: true }
          }
        }
      }
    },
    orderBy: {
      name: 'asc'
    }
  })

  const employeesWithProfiles = employees.filter(employee => employee.profile !== null)

  // Статистика по статусам ротации
  const rotationStats = {
    total: employeesWithProfiles.length,
    inRotation: employeesWithProfiles.filter(emp => emp.profile?.rotationStatus === 'ROTATION').length,
    stable: employeesWithProfiles.filter(emp => emp.profile?.rotationStatus === 'STABLE').length
  }

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/dashboard/hr">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Назад
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Управление Ротацией
            </h1>
            <p className="text-muted-foreground">
              Управление статусами ротации сотрудников компании
            </p>
          </div>
        </div>
      </div>

      {/* Статистика */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Всего сотрудников</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rotationStats.total}</div>
            <p className="text-xs text-muted-foreground">
              Активных профилей
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">В ротации</CardTitle>
            <RotateCcw className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{rotationStats.inRotation}</div>
            <p className="text-xs text-muted-foreground">
              {Math.round((rotationStats.inRotation / rotationStats.total) * 100)}% от всех сотрудников
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Стабильные позиции</CardTitle>
            <UserCheck className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{rotationStats.stable}</div>
            <p className="text-xs text-muted-foreground">
              {Math.round((rotationStats.stable / rotationStats.total) * 100)}% от всех сотрудников
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Фильтры и поиск */}
      <Card>
        <CardHeader>
          <CardTitle>Фильтры</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <Label htmlFor="search">Поиск сотрудника</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Имя или email сотрудника..."
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label>Показать только</Label>
              <div className="flex gap-2 mt-2">
                <Button variant="outline" size="sm">Все</Button>
                <Button variant="outline" size="sm">В ротации</Button>
                <Button variant="outline" size="sm">Стабильные</Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Список сотрудников */}
      <Card>
        <CardHeader>
          <CardTitle>Сотрудники</CardTitle>
          <CardDescription>
            Управляйте статусами ротации для ваших сотрудников
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {employeesWithProfiles.map((employee) => {
              const profile = employee.profile!
              const skillsCount = profile.userSkills.length
              
              return (
                <div key={employee.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                      {employee.name?.charAt(0) || '?'}
                    </div>
                    <div>
                      <h3 className="font-medium">{employee.name}</h3>
                      <p className="text-sm text-muted-foreground">{employee.email}</p>
                      {profile.jobTitle && (
                        <p className="text-sm text-muted-foreground">{profile.jobTitle}</p>
                      )}
                      {profile.department && (
                        <Badge variant="secondary" className="mt-1">
                          {profile.department}
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="text-right text-sm">
                      <div>Навыков: {skillsCount}</div>
                      <div>Уровень: {profile.level}</div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium">
                        {profile.rotationStatus === 'ROTATION' ? 'В ротации' : 'Стабильная позиция'}
                      </span>
                      <Badge variant={profile.rotationStatus === 'ROTATION' ? 'default' : 'secondary'}>
                        {profile.rotationStatus === 'ROTATION' ? (
                          <RotateCcw className="h-3 w-3 mr-1" />
                        ) : (
                          <UserCheck className="h-3 w-3 mr-1" />
                        )}
                        {profile.rotationStatus === 'ROTATION' ? 'Ротация' : 'Стабильно'}
                      </Badge>
                    </div>
                    
                    <RotationStatusToggle 
                      profileId={profile.id}
                      currentStatus={profile.rotationStatus}
                      employeeName={employee.name || 'Сотрудник'}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
