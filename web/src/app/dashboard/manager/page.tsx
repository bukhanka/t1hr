import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Role } from "@prisma/client"
import { Button } from "@/components/ui/button"
import { TalentSearch } from "@/components/talent-search"
import { Users } from "lucide-react"

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

      {/* Интерактивный поиск талантов */}
      <TalentSearch />
    </div>
  )
}
