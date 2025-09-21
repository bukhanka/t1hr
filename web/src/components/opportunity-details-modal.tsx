'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useToast } from "@/providers/toast-provider"
import { 
  BookOpen,
  Users,
  Briefcase,
  Award,
  TrendingUp,
  Clock,
  User,
  Calendar,
  Target,
  MapPin,
  Loader2
} from "lucide-react"

interface OpportunityDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  opportunity: {
    id: string
    title: string
    description: string
    type: 'course' | 'mentor' | 'project' | 'job' | 'skill'
    tags?: string[]
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

export function OpportunityDetailsModal({ isOpen, onClose, opportunity }: OpportunityDetailsModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [enrolled, setEnrolled] = useState(false)
  const { toast } = useToast()

  const getApiEndpoint = () => {
    switch (opportunity.type) {
      case 'course': return '/api/courses/enroll'
      case 'mentor': return '/api/mentoring/apply'
      case 'project': return '/api/projects/express-interest'
      case 'job': return '/api/jobs/apply'
      case 'skill': return '/api/skills/add-to-goals'
    }
  }

  const getWithdrawApiEndpoint = () => {
    switch (opportunity.type) {
      case 'course': return '/api/courses/withdraw'
      case 'mentor': return '/api/mentoring/withdraw'
      case 'project': return '/api/projects/withdraw-interest'
      case 'job': return '/api/jobs/withdraw'
      case 'skill': return '/api/skills/remove-from-goals'
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
      case 'course': return enrolled ? 'Записан' : 'Записаться на курс'
      case 'mentor': return enrolled ? 'Заявка подана' : 'Подать заявку'
      case 'project': return enrolled ? 'Интерес выражен' : 'Выразить интерес'
      case 'job': return enrolled ? 'Заявка подана' : 'Подать заявку'
      case 'skill': return enrolled ? 'В целях' : 'Добавить в цели'
    }
  }

  const handleAction = async () => {
    if (isLoading || enrolled) return

    setIsLoading(true)
    
    try {
      const response = await fetch(getApiEndpoint(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(getRequestBody()),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Произошла ошибка')
      }

      setEnrolled(true)
      toast({
        title: "Успешно!",
        description: data.message || "Действие выполнено успешно",
        variant: "default",
      })
    } catch (error) {
      console.error('Ошибка при выполнении действия:', error)
      toast({
        title: "Ошибка",
        description: error instanceof Error ? error.message : "Произошла ошибка при выполнении действия",
        variant: "error",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleWithdraw = async () => {
    if (isLoading || !enrolled) return

    setIsLoading(true)
    
    try {
      const response = await fetch(getWithdrawApiEndpoint(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(getRequestBody()),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Произошла ошибка')
      }

      setEnrolled(false)
      toast({
        title: "Заявка отозвана",
        description: data.message || "Заявка успешно отозвана",
        variant: "default",
      })
    } catch (error) {
      console.error('Ошибка при отзыве заявки:', error)
      toast({
        title: "Ошибка",
        description: error instanceof Error ? error.message : "Произошла ошибка при отзыве заявки",
        variant: "error",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getTypeIcon = () => {
    switch (opportunity.type) {
      case 'course': return <BookOpen className="h-5 w-5 text-blue-600" />
      case 'mentor': return <Users className="h-5 w-5 text-purple-600" />
      case 'project': return <Briefcase className="h-5 w-5 text-green-600" />
      case 'job': return <TrendingUp className="h-5 w-5 text-orange-600" />
      case 'skill': return <Award className="h-5 w-5 text-pink-600" />
    }
  }

  const getTypeLabel = () => {
    switch (opportunity.type) {
      case 'course': return 'Курс обучения'
      case 'mentor': return 'Менторская программа'
      case 'project': return 'Проект'
      case 'job': return 'Вакансия'
      case 'skill': return 'Навык'
    }
  }

  const renderCourseDetails = () => (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        {opportunity.duration && (
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">Длительность: {opportunity.duration} часов</span>
          </div>
        )}
        {opportunity.format && (
          <div className="flex items-center space-x-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">Формат: {opportunity.format}</span>
          </div>
        )}
        {opportunity.xpReward && (
          <div className="flex items-center space-x-2">
            <Award className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">Награда: +{opportunity.xpReward} XP</span>
          </div>
        )}
      </div>

      {opportunity.skills && opportunity.skills.length > 0 && (
        <div>
          <h4 className="font-medium mb-2">Развиваемые навыки:</h4>
          <div className="flex flex-wrap gap-2">
            {opportunity.skills.map((skill, index) => (
              <Badge key={index} variant="secondary">{skill}</Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  )

  const renderMentorDetails = () => (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        {opportunity.maxSlots && (
          <div className="flex items-center space-x-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">Максимум участников: {opportunity.maxSlots}</span>
          </div>
        )}
        {opportunity.mentorId && (
          <div className="flex items-center space-x-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">Ментор назначен</span>
          </div>
        )}
      </div>

      {opportunity.skills && opportunity.skills.length > 0 && (
        <div>
          <h4 className="font-medium mb-2">Направления развития:</h4>
          <div className="flex flex-wrap gap-2">
            {opportunity.skills.map((skill, index) => (
              <Badge key={index} variant="outline">{skill}</Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  )

  const renderJobDetails = () => (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        {opportunity.department && (
          <div className="flex items-center space-x-2">
            <Briefcase className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">Отдел: {opportunity.department}</span>
          </div>
        )}
        {opportunity.level && (
          <div className="flex items-center space-x-2">
            <Target className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">Уровень: {opportunity.level}</span>
          </div>
        )}
      </div>

      {opportunity.requirements && opportunity.requirements.length > 0 && (
        <div>
          <h4 className="font-medium mb-2">Требования:</h4>
          <div className="flex flex-wrap gap-2">
            {opportunity.requirements.map((req, index) => (
              <Badge key={index} variant="outline">{req}</Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  )

  const renderSkillDetails = () => (
    <div className="space-y-4">
      {opportunity.category && (
        <div className="flex items-center space-x-2">
          <Badge variant="secondary">{opportunity.category}</Badge>
        </div>
      )}
      
      <div className="bg-muted/50 p-4 rounded-lg">
        <h4 className="font-medium mb-2">Как развивать этот навык:</h4>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• Участвуйте в проектах, где используется этот навык</li>
          <li>• Найдите ментора с экспертизой в данной области</li>
          <li>• Изучите соответствующие курсы и материалы</li>
          <li>• Практикуйтесь в свободное время</li>
        </ul>
      </div>
    </div>
  )

  const renderProjectDetails = () => (
    <div className="space-y-4">
      <div className="bg-muted/50 p-4 rounded-lg">
        <h4 className="font-medium mb-2">О проекте:</h4>
        <p className="text-sm text-muted-foreground">
          Это интересная возможность применить ваши навыки в реальном проекте 
          и получить ценный опыт работы в команде.
        </p>
      </div>

      <div>
        <h4 className="font-medium mb-2">Что вы получите:</h4>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• Опыт работы в команде</li>
          <li>• Развитие профессиональных навыков</li>
          <li>• Возможность изучить новые технологии</li>
          <li>• Расширение профессиональной сети</li>
        </ul>
      </div>
    </div>
  )

  const renderDetails = () => {
    switch (opportunity.type) {
      case 'course': return renderCourseDetails()
      case 'mentor': return renderMentorDetails()
      case 'job': return renderJobDetails()
      case 'skill': return renderSkillDetails()
      case 'project': return renderProjectDetails()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center space-x-3">
            {getTypeIcon()}
            <div>
              <DialogTitle className="text-xl">{opportunity.title}</DialogTitle>
              <DialogDescription className="text-base mt-1">
                {getTypeLabel()}
                {opportunity.level && (
                  <Badge variant="outline" className="ml-2">
                    {opportunity.level}
                  </Badge>
                )}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          <div>
            <h4 className="font-medium mb-2">Описание:</h4>
            <p className="text-muted-foreground">{opportunity.description}</p>
          </div>

          {renderDetails()}

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Закрыть
            </Button>
            {enrolled ? (
              <Button 
                variant="outline"
                onClick={handleWithdraw}
                disabled={isLoading}
              >
                {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Отозвать заявку
              </Button>
            ) : (
              <Button 
                onClick={handleAction}
                disabled={isLoading}
              >
                {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {getActionText()}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
