"use client"

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MessageCircle, Bot } from 'lucide-react'
import { useNavigator } from '@/providers/navigator-provider'

interface NavigatorCardProps {
  className?: string
  profileStrength?: number
  recentAchievements?: string[]
}

export function NavigatorCard({ 
  className, 
  profileStrength = 0, 
  recentAchievements = [] 
}: NavigatorCardProps) {
  const { openNavigator } = useNavigator()

  const getPersonalizedMessage = () => {
    if (profileStrength < 30) {
      return {
        title: "Давайте улучшим ваш профиль!",
        message: "Заполнение профиля поможет найти лучшие возможности",
        action: "Получить советы по профилю",
        actionQuery: "Как улучшить мой профиль, чтобы получить больше XP и привлечь внимание к своим навыкам?",
        urgency: "high"
      }
    } else if (profileStrength < 70) {
      return {
        title: "Время развиваться дальше!",
        message: "Ваш профиль неплохо заполнен, но есть возможности для роста",
        action: "Найти новые проекты",
        actionQuery: "Какие проекты сейчас подходят для моих навыков и целей развития?",
        urgency: "medium"
      }
    } else {
      return {
        title: "Отлично! Профиль выглядит сильным",
        message: "Пора искать новые карьерные возможности",
        action: "Построить план карьеры",
        actionQuery: "Составь персональный план развития на полгода с учетом моих целей",
        urgency: "low"
      }
    }
  }

  const handleQuickAction = (query: string) => {
    openNavigator('dashboard')
    // Здесь можно добавить логику для предзаполнения сообщения
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
          
          <Button 
            size="sm" 
            onClick={() => handleQuickAction(personalizedContent.actionQuery)}
          >
            {personalizedContent.action}
          </Button>
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
