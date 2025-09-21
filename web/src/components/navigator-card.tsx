"use client"

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MessageCircle, Bot, Rocket, ArrowRight } from 'lucide-react'
import { useNavigator } from '@/providers/navigator-provider'
import Link from 'next/link'

interface NavigatorCardProps {
  className?: string
  profileStrength?: number
  recentAchievements?: string[]
  onboardingCompleted?: boolean
}

export function NavigatorCard({ 
  className, 
  profileStrength = 0, 
  recentAchievements = [],
  onboardingCompleted = false 
}: NavigatorCardProps) {
  const { openNavigator } = useNavigator()

  const getPersonalizedMessage = () => {
    // Если онбординг не пройден - это приоритет №1
    if (!onboardingCompleted) {
      return {
        title: "Пройдите онбординг за 5 минут!",
        message: "Создадим идеальный профиль и найдем лучшие возможности в T1",
        action: "Начать онбординг",
        actionType: "onboarding",
        actionQuery: "/onboarding",
        urgency: "critical"
      }
    } else if (profileStrength < 30) {
      return {
        title: "Давайте улучшим ваш профиль!",
        message: "Заполнение профиля поможет найти лучшие возможности",
        action: "Получить советы по профилю",
        actionType: "chat",
        actionQuery: "Как улучшить мой профиль, чтобы получить больше XP и привлечь внимание к своим навыкам?",
        urgency: "high"
      }
    } else if (profileStrength < 70) {
      return {
        title: "Время развиваться дальше!",
        message: "Ваш профиль неплохо заполнен, но есть возможности для роста",
        action: "Найти новые проекты",
        actionType: "chat",
        actionQuery: "Какие проекты сейчас подходят для моих навыков и целей развития?",
        urgency: "medium"
      }
    } else {
      return {
        title: "Отлично! Профиль выглядит сильным",
        message: "Пора искать новые карьерные возможности",
        action: "Построить план карьеры",
        actionType: "chat",
        actionQuery: "Составь персональный план развития на полгода с учетом моих целей",
        urgency: "low"
      }
    }
  }

  const handleQuickAction = (query: string, actionType: string = 'chat') => {
    if (actionType === 'onboarding') {
      // Редирект на страницу онбординга
      window.location.href = query
    } else {
      // Обычный чат с ИИ
      openNavigator('dashboard')
      // Здесь можно добавить логику для предзаполнения сообщения
    }
  }

  const personalizedContent = getPersonalizedMessage()

  return (
    <Card className={`${className}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Bot className="h-5 w-5 text-blue-600" />
            <div>
              <CardTitle className="text-base">
                Навигатор
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                ИИ-консультант по карьере
              </p>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Персонализированное сообщение */}
        <div className="bg-blue-50 rounded p-3">
          <h4 className="font-medium text-sm mb-1">
            {personalizedContent.title}
          </h4>
          <p className="text-sm text-muted-foreground mb-3">
            {personalizedContent.message}
          </p>
          
          {personalizedContent.actionType === 'onboarding' ? (
            <Link href={personalizedContent.actionQuery}>
              <Button 
                size="sm" 
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
              >
                <Rocket className="h-4 w-4 mr-2" />
                {personalizedContent.action}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          ) : (
            <Button 
              size="sm" 
              onClick={() => handleQuickAction(personalizedContent.actionQuery, personalizedContent.actionType)}
            >
              {personalizedContent.action}
            </Button>
          )}
        </div>

        {/* Кнопки чата */}
        <div className="flex space-x-2">
          <Button 
            onClick={() => openNavigator('dashboard')} 
            className="flex-1"
            variant="outline"
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            Быстрый чат
          </Button>
          <Button 
            onClick={() => window.open('/chat', '_blank')} 
            variant="default"
            className="flex-1"
          >
            Полный экран
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
