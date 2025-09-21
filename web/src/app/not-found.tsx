"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function NotFound() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    // Автоматически перенаправляем через 3 секунды
    const timer = setTimeout(() => {
      if (session) {
        router.push('/dashboard')
      } else {
        router.push('/auth/signin')
      }
    }, 3000)

    return () => clearTimeout(timer)
  }, [session, router])

  const handleRedirect = () => {
    if (session) {
      router.push('/dashboard')
    } else {
      router.push('/auth/signin')
    }
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Загрузка...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
            <svg
              className="h-6 w-6 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <CardTitle className="text-2xl font-bold">404</CardTitle>
          <CardDescription>
            Страница не найдена
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-gray-600">
            К сожалению, запрашиваемая страница не существует.
          </p>
          
          <div className="space-y-2">
            <p className="text-sm text-gray-500">
              Автоматическое перенаправление через 3 секунды...
            </p>
            <Button onClick={handleRedirect} className="w-full">
              {session ? 'Перейти в дашборд' : 'Войти в систему'}
            </Button>
          </div>

          {session && (
            <div className="pt-4 border-t">
              <p className="text-sm text-gray-600">
                Добро пожаловать, {session.user?.name || session.user?.email}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
