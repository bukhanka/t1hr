import { Suspense } from 'react'
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Communities } from '@/components/communities'
import { Loader2 } from 'lucide-react'

export default async function CommunitiesPage() {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect("/auth/signin")
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
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
