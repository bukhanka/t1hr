"use client"

import { signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"

export function ClearAuthButton() {
  const handleClearAuth = async () => {
    if (confirm('Это действие очистит все данные аутентификации и перенаправит на страницу входа. Продолжить?')) {
      try {
        // Сначала очищаем токены через API
        await fetch('/api/auth/clear-tokens', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        })
        
        // Затем используем стандартный signOut
        await signOut({ 
          callbackUrl: '/auth/signin',
          redirect: false 
        })
        
        // Дополнительная очистка localStorage и cookies на клиенте
        if (typeof window !== 'undefined') {
          localStorage.clear()
          sessionStorage.clear()
          
          // Очищаем все cookies связанные с NextAuth
          document.cookie.split(";").forEach((c) => {
            const eqPos = c.indexOf("=")
            const name = eqPos > -1 ? c.substr(0, eqPos).trim() : c.trim()
            if (name.includes('next-auth') || name.includes('__Secure-next-auth')) {
              document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname}`
              document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`
            }
          })
          
          // Перенаправляем на страницу входа
          window.location.href = '/auth/signin'
        }
      } catch (error) {
        console.error('Ошибка при очистке токенов:', error)
        // Если API не работает, используем стандартный signOut
        await signOut({ 
          callbackUrl: '/auth/signin',
          redirect: true 
        })
      }
    }
  }

  return (
    <Button 
      onClick={handleClearAuth}
      variant="outline"
      size="sm"
      className="text-orange-600 border-orange-200 hover:bg-orange-50"
    >
      <AlertTriangle className="h-4 w-4 mr-2" />
      Очистить токены
    </Button>
  )
}
