'use client'

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
  MapPin
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
            <Button>
              {opportunity.type === 'course' && 'Записаться на курс'}
              {opportunity.type === 'mentor' && 'Подать заявку'}
              {opportunity.type === 'project' && 'Выразить интерес'}
              {opportunity.type === 'job' && 'Подать заявку'}
              {opportunity.type === 'skill' && 'Добавить в цели'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
