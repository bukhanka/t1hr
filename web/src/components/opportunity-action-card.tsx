'use client'

import { useState } from 'react'
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
  Calendar,
  Eye,
  Loader2
} from "lucide-react"

interface OpportunityActionCardProps {
  opportunity: {
    id: string
    title: string
    description: string
    type: 'course' | 'mentor' | 'project' | 'job' | 'skill'
    // Дополнительные поля
    level?: string
    xpReward?: number
    duration?: number
    format?: string
    skills?: string[]
    requirements?: string[]
    department?: string
    maxSlots?: number
    mentorId?: string
    category?: string
  }
}

export function OpportunityActionCard({ opportunity }: OpportunityActionCardProps) {
  const [showDetails, setShowDetails] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [enrolled, setEnrolled] = useState(false)
  const { toast } = useToast()

  const getTypeIcon = () => {
    switch (opportunity.type) {
      case 'course': return <BookOpen className="w-4 h-4 text-blue-600" />
      case 'mentor': return <Users className="w-4 h-4 text-orange-600" />
      case 'project': return <Calendar className="w-4 h-4 text-green-600" />
      case 'job': return <Award className="w-4 h-4 text-purple-600" />
      case 'skill': return <TrendingUp className="w-4 h-4 text-pink-600" />
    }
  }

  const getTypeColor = () => {
    switch (opportunity.type) {
      case 'course': return 'bg-blue-100'
      case 'mentor': return 'bg-orange-100'
      case 'project': return 'bg-green-100'
      case 'job': return 'bg-purple-100'
      case 'skill': return 'bg-pink-100'
    }
  }

  const getTypeLabel = () => {
    switch (opportunity.type) {
      case 'course': return 'Обучение'
      case 'mentor': return 'Менторство'
      case 'project': return 'Проект'
      case 'job': return 'Вакансия'
      case 'skill': return 'Навык'
    }
  }

  const getApiEndpoint = () => {
    switch (opportunity.type) {
      case 'course': return '/api/courses/enroll'
      case 'mentor': return '/api/mentoring/apply'
      case 'project': return '/api/projects/express-interest'
      case 'job': return '/api/jobs/apply'
      case 'skill': return '/api/skills/add-to-goals'
    }
  }

  const getRequestBody = () => {
    switch (opportunity.type) {
      case 'course': return { courseId: opportunity.id }
      case 'mentor': return { programId: opportunity.id }
      case 'project': return { projectId: opportunity.id }
      case 'job': return { jobId: opportunity.id }
      case 'skill': return { skillId: opportunity.id }
    }
  }

  const getActionText = () => {
    switch (opportunity.type) {
      case 'course': return 'Записаться'
      case 'mentor': return 'Подать заявку'
      case 'project': return 'Интересует'
      case 'job': return 'Подать заявку'
      case 'skill': return 'Добавить в цели'
    }
  }

  const handleQuickAction = async () => {
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

        // XP награда
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
    <>
      <div className="flex items-start space-x-3 p-3 rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors">
        <div className={`w-8 h-8 ${getTypeColor()} rounded-full flex items-center justify-center flex-shrink-0`}>
          {getTypeIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{opportunity.title}</p>
          <p className="text-xs text-muted-foreground mb-2 overflow-hidden" style={{
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical' as const
            }}>
            {opportunity.description}
          </p>
          <div className="flex items-center justify-between">
            <Badge variant="secondary" className="text-xs">
              {getTypeLabel()}
            </Badge>
            <div className="flex space-x-1">
              <Button 
                size="sm" 
                variant="ghost" 
                className="h-6 px-2 text-xs"
                onClick={() => setShowDetails(true)}
              >
                <Eye className="h-3 w-3 mr-1" />
                Подробнее
              </Button>
              <Button 
                size="sm" 
                className="h-6 px-2 text-xs"
                onClick={handleQuickAction}
                disabled={isLoading || enrolled}
              >
                {isLoading && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                {enrolled 
                  ? (opportunity.type === 'course' ? 'Записан' : 
                     opportunity.type === 'skill' ? 'В целях' : 'Подано')
                  : getActionText()
                }
              </Button>
            </div>
          </div>
        </div>
      </div>

      <OpportunityDetailsModal
        isOpen={showDetails}
        onClose={() => setShowDetails(false)}
        opportunity={{
          id: opportunity.id,
          title: opportunity.title,
          description: opportunity.description,
          type: opportunity.type,
          level: opportunity.level,
          xpReward: opportunity.xpReward,
          duration: opportunity.duration,
          format: opportunity.format,
          skills: opportunity.skills,
          requirements: opportunity.requirements,
          department: opportunity.department,
          maxSlots: opportunity.maxSlots,
          mentorId: opportunity.mentorId,
          category: opportunity.category
        }}
      />
    </>
  )
}
