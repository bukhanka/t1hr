'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useToast } from "@/providers/toast-provider"
import { OpportunityDetailsModal } from "./opportunity-details-modal"
import { 
  BookOpen,
  Users,
  Briefcase,
  Award,
  TrendingUp,
  Star,
  Loader2
} from "lucide-react"

interface OpportunityCardProps {
  id: string
  title: string
  description: string
  type: 'course' | 'mentor' | 'project' | 'job' | 'skill'
  tags?: string[]
  level?: string
  xpReward?: number
  matchScore?: number
  actionText?: string
  isEnrolled?: boolean
  // Дополнительные поля для модального окна
  duration?: number
  format?: string
  skills?: string[]
  requirements?: string[]
  department?: string
  maxSlots?: number
  mentorId?: string
  category?: string
}

export function OpportunityCard({ 
  id,
  title, 
  description, 
  type, 
  tags = [], 
  level, 
  xpReward, 
  matchScore,
  actionText = "Интересует",
  isEnrolled = false,
  duration,
  format,
  skills,
  requirements,
  department,
  maxSlots,
  mentorId,
  category
}: OpportunityCardProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [enrolled, setEnrolled] = useState(isEnrolled)
  const [showDetails, setShowDetails] = useState(false)
  const { toast } = useToast()

  const getTypeIcon = () => {
    switch (type) {
      case 'course': return <BookOpen className="h-4 w-4" />
      case 'mentor': return <Users className="h-4 w-4" />
      case 'project': return <Briefcase className="h-4 w-4" />
      case 'job': return <TrendingUp className="h-4 w-4" />
      case 'skill': return <Award className="h-4 w-4" />
    }
  }

  const getTypeColor = () => {
    switch (type) {
      case 'course': return 'text-blue-600'
      case 'mentor': return 'text-purple-600'
      case 'project': return 'text-green-600'
      case 'job': return 'text-orange-600'
      case 'skill': return 'text-pink-600'
    }
  }

  const getTypeLabel = () => {
    switch (type) {
      case 'course': return 'Курс'
      case 'mentor': return 'Менторство'
      case 'project': return 'Проект'
      case 'job': return 'Вакансия'
      case 'skill': return 'Навык'
    }
  }

  const getApiEndpoint = () => {
    switch (type) {
      case 'course': return '/api/courses/enroll'
      case 'mentor': return '/api/mentoring/apply'
      case 'project': return '/api/projects/express-interest'
      case 'job': return '/api/jobs/apply'
      case 'skill': return '/api/skills/add-to-goals'
    }
  }

  const getRequestBody = () => {
    switch (type) {
      case 'course': return { courseId: id }
      case 'mentor': return { programId: id }
      case 'project': return { projectId: id }
      case 'job': return { jobId: id }
      case 'skill': return { skillId: id }
    }
  }

  const handleAction = async () => {
    if (enrolled) {
      toast({
        variant: "info",
        title: "Уже участвуете",
        description: "Вы уже участвуете в этой активности",
      })
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch(getApiEndpoint(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(getRequestBody())
      })

      const data = await response.json()

      if (response.ok) {
        setEnrolled(true)
        toast({
          variant: "success",
          title: "Успешно!",
          description: data.message || "Действие выполнено успешно",
        })

        // Если есть информация о геймификации, показываем её
        if (data.gamification) {
          setTimeout(() => {
            toast({
              variant: "success",
              title: "Награда!",
              description: `+${data.gamification.xpAwarded} XP за активность!`,
            })
          }, 1500)
        }
      } else {
        toast({
          variant: "error",
          title: "Ошибка",
          description: data.error || "Произошла ошибка",
        })
      }
    } catch (error) {
      console.error('Ошибка при выполнении действия:', error)
      toast({
        variant: "error",
        title: "Ошибка",
        description: "Не удалось выполнить действие",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className={getTypeColor()}>
              {getTypeIcon()}
            </div>
            <Badge variant="secondary">{getTypeLabel()}</Badge>
            {level && (
              <Badge variant="outline">{level}</Badge>
            )}
          </div>
          {matchScore && (
            <div className="flex items-center space-x-1">
              <Star className="h-3 w-3 text-yellow-500 fill-current" />
              <span className="text-xs text-muted-foreground">{matchScore}% совпадение</span>
            </div>
          )}
        </div>
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {tags.slice(0, 4).map((tag, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
            {tags.length > 4 && (
              <Badge variant="outline" className="text-xs">
                +{tags.length - 4}
              </Badge>
            )}
          </div>
        )}
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {xpReward && (
              <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                <Award className="h-3 w-3" />
                <span>+{xpReward} XP</span>
              </div>
            )}
          </div>
          <div className="flex space-x-2">
            <Button size="sm" variant="outline" onClick={() => setShowDetails(true)}>
              Подробнее
            </Button>
            <Button 
              size="sm" 
              onClick={handleAction}
              disabled={isLoading || enrolled}
            >
              {isLoading && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
              {enrolled 
                ? (type === 'course' ? 'Записан' : 
                   type === 'skill' ? 'В целях' : 'Подано')
                : actionText
              }
            </Button>
          </div>
        </div>
      </CardContent>
      
      <OpportunityDetailsModal
        isOpen={showDetails}
        onClose={() => setShowDetails(false)}
        opportunity={{
          id,
          title,
          description,
          type,
          tags,
          level,
          xpReward,
          duration,
          format,
          skills,
          requirements,
          department,
          maxSlots,
          mentorId,
          category
        }}
      />
    </Card>
  )
}
