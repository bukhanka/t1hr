import { Suspense } from 'react'
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Communities } from '@/components/communities'
import { Button } from "@/components/ui/button"
import { Loader2, ArrowLeft, Users } from 'lucide-react'
import Link from 'next/link'

export default async function CommunitiesPage() {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect("/auth/signin")
  }

  return (
    <div className="space-y-6">
      {/* Заголовок с навигацией */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Дашборд
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              <Users className="h-8 w-8 text-blue-600" />
              Сообщества
            </h1>
            <p className="text-muted-foreground">
              Объединяйтесь с коллегами по интересам, навыкам и проектам
            </p>
          </div>
        </div>
      </div>

      {/* Основной контент */}
      <Suspense fallback={
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Загружаем сообщества...</span>
        </div>
      }>
        <Communities />
      </Suspense>
    </div>
  )
}
