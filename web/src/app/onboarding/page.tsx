import { Suspense } from 'react'
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { OnboardingWrapper } from '@/components/onboarding-wrapper'
import { Loader2, ArrowLeft, MessageCircle } from 'lucide-react'
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
              <Link href="/chat">
                <Button variant="ghost" size="sm">
                  <MessageCircle className="w-4 h-4 mr-1" />
                  Навигатор
                </Button>
              </Link>
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
        <div className="max-w-4xl mx-auto">
          {/* Основной онбординг квиз */}
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-3">Добро пожаловать в SciBox Talent!</h2>
              <p className="text-lg text-gray-600 mb-6">Пройдите короткий опрос, чтобы мы могли персонализировать ваш опыт</p>
              
              {/* Информационная карточка о навигаторе */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-center space-x-2 text-blue-800">
                  <MessageCircle className="h-5 w-5" />
                  <span className="font-medium">Есть вопросы?</span>
                </div>
                <p className="text-blue-700 text-sm mt-1">
                  Навигатор поможет вам разобраться с процессом онбординга. 
                  <Link href="/chat" className="text-blue-600 hover:text-blue-800 underline ml-1">
                    Перейти к чату
                  </Link>
                </p>
              </div>
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
        </div>
      </div>
    </div>
  )
}
