"use client"

import { useSession, signOut } from "next-auth/react"
import { useEffect } from "react"
import { useRouter } from "next/navigation"

export function AuthErrorHandler({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    // Обработка ошибок аутентификации
    const handleAuthError = () => {
      // Проверяем наличие ошибок в консоли
      const originalError = console.error
      console.error = (...args) => {
        const errorMessage = args.join(' ')
        
        // Если обнаружена ошибка с Prisma и уникальным ограничением
        if (errorMessage.includes('PrismaClientKnownRequestError') && 
            errorMessage.includes('Unique constraint failed')) {
          
          // Показываем уведомление пользователю
          if (confirm('Обнаружена проблема с аутентификацией. Необходимо войти в систему заново. Продолжить?')) {
            // Очищаем токены и перенаправляем на страницу входа
            signOut({ callbackUrl: '/auth/signin' })
          }
        }
        
        originalError.apply(console, args)
      }

      return () => {
        console.error = originalError
      }
    }

    if (status !== "loading") {
      const cleanup = handleAuthError()
      return cleanup
    }
  }, [status])

  return <>{children}</>
}
