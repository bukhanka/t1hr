import { Suspense } from 'react'
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { OnboardingWrapper } from '@/components/onboarding-wrapper'
import { OnboardingChat } from '@/components/onboarding-chat'
import { Loader2, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default async function OnboardingPage() {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect("/auth/signin")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Простой хедер для онбординга */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200/60 sticky top-0 z-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">ST</span>
              </div>
              <div>
                <span className="font-semibold text-lg text-gray-900">SciBox Talent</span>
                <div className="text-xs text-gray-500 -mt-1">Добро пожаловать!</div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  К дашборду
                </Button>
              </Link>
              <div className="text-sm text-gray-600">
                Онбординг • {session.user.name}
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto">
          {/* Основной онбординг квиз */}
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Добро пожаловать в SciBox Talent!</h2>
              <p className="text-gray-600">Пройдите короткий опрос, чтобы мы могли персонализировать ваш опыт</p>
            </div>
            
            <Suspense fallback={
              <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span className="ml-2">Подготавливаем онбординг...</span>
              </div>
            }>
              <OnboardingWrapper />
            </Suspense>
          </div>

          {/* Чат помощник */}
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Есть вопросы?</h2>
              <p className="text-gray-600">Навигатор поможет вам разобраться с процессом онбординга</p>
            </div>
            
            <OnboardingChat className="sticky top-24" />
          </div>
        </div>
      </div>
    </div>
  )
}
