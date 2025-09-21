import { Suspense } from 'react'
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Navigation } from "@/components/navigation"
import { Leaderboard } from '@/components/leaderboard'
import { Loader2 } from 'lucide-react'

export default async function LeaderboardsPage() {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect("/auth/signin")
  }

  return (
    <>
      <Navigation 
        user={{
          name: session.user.name,
          email: session.user.email,
          image: session.user.image,
          role: (session.user as any).role
        }} 
      />
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        <Suspense fallback={
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Загружаем лидерборды...</span>
          </div>
        }>
          <Leaderboard />
        </Suspense>
      </div>
    </>
  )
}
