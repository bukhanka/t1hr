"use client"

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Rocket, 
  Coins, 
  Trophy, 
  Sparkles, 
  Clock,
  ArrowRight,
  X
} from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

interface OnboardingBannerProps {
  profileStrength: number
  onDismiss?: () => void
}

export function OnboardingBanner({ profileStrength, onDismiss }: OnboardingBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false)

  const handleDismiss = () => {
    setIsDismissed(true)
    onDismiss?.()
    // Сохраняем в localStorage что баннер был скрыт (на 24 часа)
    localStorage.setItem('onboarding_banner_dismissed', JSON.stringify({
      timestamp: Date.now(),
      expiresIn: 24 * 60 * 60 * 1000 // 24 часа
    }))
  }

  // Проверяем, был ли баннер недавно скрыт
  const checkDismissed = () => {
    const dismissed = localStorage.getItem('onboarding_banner_dismissed')
    if (dismissed) {
      const data = JSON.parse(dismissed)
      if (Date.now() - data.timestamp < data.expiresIn) {
        return true
      }
    }
    return false
  }

  // Не показываем если:
  // 1. Пользователь скрыл баннер
  // 2. Профиль уже достаточно заполнен (>50%)
  // 3. Баннер был скрыт недавно
  if (isDismissed || profileStrength > 50 || checkDismissed()) {
    return null
  }

  return (
    <Card className="border-l-4 border-l-blue-500 bg-gradient-to-r from-blue-50 to-purple-50 shadow-lg">
      <CardContent className="p-6 relative">
        {/* Кнопка закрытия */}
        <Button
          variant="ghost"
          size="sm"
          className="absolute top-2 right-2 h-8 w-8 p-0"
          onClick={handleDismiss}
        >
          <X className="h-4 w-4" />
        </Button>

        <div className="flex items-start space-x-4">
          {/* Иконка */}
          <div className="relative flex-shrink-0">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <Rocket className="h-8 w-8 text-blue-600" />
            </div>
            <Sparkles className="h-5 w-5 text-yellow-500 absolute -top-1 -right-1" />
          </div>

          {/* Содержимое */}
          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              🚀 Пройдите онбординг за 5 минут!
            </h3>
            <p className="text-gray-600 mb-4">
              Создайте идеальный профиль и получите персональные рекомендации для карьеры в T1
            </p>

            {/* Награды */}
            <div className="flex flex-wrap gap-2 mb-4">
              <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                <Coins className="h-3 w-3 mr-1" />
                +200 T-Coins
              </Badge>
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                <Trophy className="h-3 w-3 mr-1" />
                60% профиля
              </Badge>
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                <Clock className="h-3 w-3 mr-1" />
                5-7 минут
              </Badge>
            </div>

            {/* Кнопки действий */}
            <div className="flex space-x-3">
              <Link href="/onboarding">
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Rocket className="h-4 w-4 mr-2" />
                  Начать онбординг
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
              <Button 
                variant="outline" 
                onClick={handleDismiss}
                className="text-gray-600"
              >
                Пропустить пока
              </Button>
            </div>
          </div>
        </div>

        {/* Прогресс полосы внизу */}
        <div className="mt-4 pt-4 border-t border-blue-200">
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600">Заполнено профиля: {profileStrength}%</span>
            <span className="text-blue-600 font-medium">
              До полного профиля: {100 - profileStrength}%
            </span>
          </div>
          <div className="w-full bg-blue-100 rounded-full h-2 mt-1">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${profileStrength}%` }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
