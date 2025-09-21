import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Role } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { ShortListManager } from "@/components/shortlist-manager"

export default async function ManagerShortListsPage() {
  const session = await getServerSession(authOptions)
  
  if (!session || session.user.role !== Role.MANAGER) {
    redirect("/dashboard")
  }

  // Получаем шорт-листы менеджера
  const shortlists = await prisma.shortList.findMany({
    where: {
      managerId: session.user.id
    },
    include: {
      candidates: {
        include: {
          profile: {
            include: {
              user: {
                select: { name: true, email: true }
              },
              userSkills: {
                include: { skill: true },
                where: { status: 'USING' },
                take: 5
              }
            }
          }
        }
      }
    },
    orderBy: {
      updatedAt: 'desc'
    }
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Мои Шорт-листы
          </h1>
          <p className="text-muted-foreground">
            Управляйте кандидатами для ваших проектов и ролей
          </p>
        </div>
      </div>

      <ShortListManager shortlists={shortlists} managerId={session.user.id} />
    </div>
  )
}
