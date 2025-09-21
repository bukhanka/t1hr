import { Suspense } from 'react'
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { OnboardingWrapper } from '@/components/onboarding-wrapper'
import { Loader2 } from 'lucide-react'

export default async function OnboardingPage() {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect("/auth/signin")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        <Suspense fallback={
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Подготавливаем онбординг...</span>
          </div>
        }>
          <OnboardingWrapper />
        </Suspense>
      </div>
    </div>
  )
}
