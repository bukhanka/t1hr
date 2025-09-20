"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { MessageCircle, X } from 'lucide-react'
import { useNavigator } from '@/providers/navigator-provider'
import { usePathname } from 'next/navigation'

interface NavigatorFABProps {
  className?: string
}

export function NavigatorFAB({ className }: NavigatorFABProps) {
  const { openNavigator } = useNavigator()
  const [showTip, setShowTip] = useState(false)
  const [hasInteracted, setHasInteracted] = useState(false)
  const pathname = usePathname()

  // Определяем контекст текущей страницы
  const getPageContext = () => {
    if (pathname.includes('/profile')) return 'profile'
    if (pathname.includes('/manager')) return 'manager'
    if (pathname.includes('/hr')) return 'hr'
    if (pathname.includes('/employee')) return 'dashboard'
    if (pathname.includes('/projects')) return 'projects'
    return 'general'
  }

  // Показываем подсказку для новых пользователей
  useEffect(() => {
    const hasSeenTip = localStorage.getItem('navigator_tip_seen')
    if (!hasSeenTip) {
      const timer = setTimeout(() => {
        setShowTip(true)
      }, 3000) // Показываем через 3 секунды

      return () => clearTimeout(timer)
    }
  }, [])

  const handleClick = () => {
    const context = getPageContext()
    openNavigator(context)
    
    if (!hasInteracted) {
      setHasInteracted(true)
      localStorage.setItem('navigator_tip_seen', 'true')
      setShowTip(false)
    }
  }

  const handleFullscreenClick = () => {
    window.open('/chat', '_blank')
    
    if (!hasInteracted) {
      setHasInteracted(true)
      localStorage.setItem('navigator_tip_seen', 'true')
      setShowTip(false)
    }
  }

  const dismissTip = () => {
    setShowTip(false)
    localStorage.setItem('navigator_tip_seen', 'true')
  }

  return (
    <div className={`fixed bottom-6 right-6 z-50 ${className}`}>
      {/* Подсказка для новых пользователей */}
      {showTip && (
        <div className="absolute bottom-full right-0 mb-3 w-64 bg-white rounded-lg shadow-lg border p-3">
          <div className="flex justify-between items-start mb-2">
            <span className="font-medium text-sm">Навигатор</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={dismissTip}
              className="h-5 w-5 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mb-3">
            ИИ-консультант по карьерному развитию
          </p>
          <div className="flex space-x-2">
            <Button onClick={handleClick} size="sm" variant="outline" className="flex-1">
              Быстрый чат
            </Button>
            <Button onClick={handleFullscreenClick} size="sm" className="flex-1">
              Полный экран
            </Button>
          </div>
        </div>
      )}

      {/* Главная кнопка */}
      <Button
        onClick={handleFullscreenClick}
        size="lg"
        className="h-12 w-12 rounded-full bg-blue-600 hover:bg-blue-700 shadow-lg transition-colors relative group"
        title="Открыть Навигатор в полном экране"
      >
        <MessageCircle className="h-5 w-5 text-white" />

        {/* Tooltip */}
        <div className="absolute bottom-full right-0 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
          Навигатор (полный экран)
        </div>
      </Button>
    </div>
  )
}
