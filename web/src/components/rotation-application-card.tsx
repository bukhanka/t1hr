"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { 
  RotateCcw, 
  Clock, 
  CheckCircle, 
  XCircle, 
  UserX,
  Calendar,
  MessageSquare
} from "lucide-react"

interface RotationApplication {
  id: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'WITHDRAWN'
  reason?: string
  createdAt: string
  updatedAt: string
  reviewedAt?: string
  notes?: string
  reviewer?: {
    name: string
    email: string
  }
}

interface RotationApplicationCardProps {
  className?: string
}

export function RotationApplicationCard({ className }: RotationApplicationCardProps) {
  const [application, setApplication] = useState<RotationApplication | null>(null)
  const [currentRotationStatus, setCurrentRotationStatus] = useState<string>('STABLE')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [reason, setReason] = useState('')
  const [showReasonForm, setShowReasonForm] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchApplicationStatus()
  }, [])

  const fetchApplicationStatus = async () => {
    try {
      const response = await fetch('/api/rotation/apply')
      if (response.ok) {
        const data = await response.json()
        setApplication(data.application)
        setCurrentRotationStatus(data.currentRotationStatus)
      }
    } catch (error) {
      console.error('Ошибка при получении статуса заявки:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitApplication = async () => {
    if (!reason.trim()) {
      toast({
        title: "Ошибка",
        description: "Пожалуйста, укажите причину подачи заявки",
        variant: "error"
      })
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch('/api/rotation/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason: reason.trim() })
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: "Заявка подана",
          description: data.message,
          variant: "success"
        })
        setApplication(data.application)
        setShowReasonForm(false)
        setReason('')
      } else {
        toast({
          title: "Ошибка",
          description: data.error,
          variant: "error"
        })
      }
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось подать заявку",
        variant: "error"
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleWithdrawApplication = async () => {
    setSubmitting(true)
    try {
      const response = await fetch('/api/rotation/withdraw', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: "Заявка отозвана",
          description: data.message,
          variant: "success"
        })
        setApplication(data.application)
      } else {
        toast({
          title: "Ошибка",
          description: data.error,
          variant: "error"
        })
      }
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось отозвать заявку",
        variant: "error"
      })
    } finally {
      setSubmitting(false)
    }
  }

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'PENDING':
        return {
          icon: <Clock className="h-4 w-4" />,
          text: 'Ожидает рассмотрения',
          color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
          description: 'Ваша заявка отправлена HR-менеджерам и ожидает рассмотрения'
        }
      case 'APPROVED':
        return {
          icon: <CheckCircle className="h-4 w-4" />,
          text: 'Одобрена',
          color: 'bg-green-100 text-green-800 border-green-200',
          description: 'Поздравляем! Вы участвуете в программе ротации'
        }
      case 'REJECTED':
        return {
          icon: <XCircle className="h-4 w-4" />,
          text: 'Отклонена',
          color: 'bg-red-100 text-red-800 border-red-200',
          description: 'К сожалению, ваша заявка была отклонена'
        }
      case 'WITHDRAWN':
        return {
          icon: <UserX className="h-4 w-4" />,
          text: 'Отозвана',
          color: 'bg-gray-100 text-gray-800 border-gray-200',
          description: 'Вы отозвали свою заявку на ротацию'
        }
      default:
        return {
          icon: <Clock className="h-4 w-4" />,
          text: 'Неизвестно',
          color: 'bg-gray-100 text-gray-800 border-gray-200',
          description: 'Статус заявки неизвестен'
        }
    }
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Если уже участвует в ротации
  if (currentRotationStatus === 'ROTATION') {
    return (
      <Card className={`${className} bg-gradient-to-br from-green-50 to-emerald-100/50 border-green-200/50`}>
        <CardHeader className="pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-600 rounded-lg">
              <RotateCcw className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-green-900">Программа Ротации</CardTitle>
              <CardDescription className="text-green-700/70">
                Вы участвуете в программе ротации
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-4">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span className="font-semibold text-green-800">Активный участник</span>
          </div>
          <p className="text-sm text-green-700 mb-4">
            Вы можете просматривать и подавать заявки на проекты и вакансии в рамках программы ротации.
          </p>
          <div className="bg-green-50 p-3 rounded-lg">
            <p className="text-sm text-green-800">
              💡 <strong>Совет:</strong> Регулярно проверяйте новые возможности в разделе "Возможности"
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Если есть заявка
  if (application) {
    const statusInfo = getStatusInfo(application.status)
    
    return (
      <Card className={`${className} ${application.status === 'PENDING' ? 'bg-gradient-to-br from-yellow-50 to-amber-100/50 border-yellow-200/50' : 'bg-gradient-to-br from-blue-50 to-indigo-100/50 border-blue-200/50'}`}>
        <CardHeader className="pb-4">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${application.status === 'PENDING' ? 'bg-yellow-600' : 'bg-blue-600'}`}>
              <RotateCcw className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className={application.status === 'PENDING' ? 'text-yellow-900' : 'text-blue-900'}>
                Заявка на Ротацию
              </CardTitle>
              <CardDescription className={application.status === 'PENDING' ? 'text-yellow-700/70' : 'text-blue-700/70'}>
                {statusInfo.description}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            {statusInfo.icon}
            <Badge className={statusInfo.color}>
              {statusInfo.text}
            </Badge>
          </div>

          {application.reason && (
            <div>
              <Label className="text-sm font-medium">Причина подачи заявки:</Label>
              <p className="text-sm text-gray-700 mt-1 p-3 bg-gray-50 rounded-lg">
                {application.reason}
              </p>
            </div>
          )}

          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Calendar className="h-4 w-4" />
            <span>Подана: {new Date(application.createdAt).toLocaleDateString('ru-RU')}</span>
          </div>

          {application.reviewedAt && (
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <CheckCircle className="h-4 w-4" />
              <span>Рассмотрена: {new Date(application.reviewedAt).toLocaleDateString('ru-RU')}</span>
            </div>
          )}

          {application.reviewer && (
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <MessageSquare className="h-4 w-4" />
              <span>Рассмотрел: {application.reviewer.name}</span>
            </div>
          )}

          {application.notes && (
            <div>
              <Label className="text-sm font-medium">Комментарии HR:</Label>
              <p className="text-sm text-gray-700 mt-1 p-3 bg-gray-50 rounded-lg">
                {application.notes}
              </p>
            </div>
          )}

          {application.status === 'PENDING' && (
            <div className="pt-4 border-t">
              <Button 
                variant="outline" 
                onClick={handleWithdrawApplication}
                disabled={submitting}
                className="w-full"
              >
                {submitting ? 'Отзываем...' : 'Отозвать заявку'}
              </Button>
            </div>
          )}

          {application.status === 'REJECTED' && (
            <div className="pt-4 border-t">
              <Button 
                onClick={() => setShowReasonForm(true)}
                className="w-full"
              >
                Подать новую заявку
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  // Если нет заявки - показываем форму подачи
  return (
    <Card className={`${className} bg-gradient-to-br from-blue-50 to-indigo-100/50 border-blue-200/50`}>
      <CardHeader className="pb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-600 rounded-lg">
            <RotateCcw className="h-5 w-5 text-white" />
          </div>
          <div>
            <CardTitle className="text-blue-900">Программа Ротации</CardTitle>
            <CardDescription className="text-blue-700/70">
              Подайте заявку на участие в программе ротации
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-sm text-blue-700">
            Участие в программе ротации позволит вам:
          </p>
          <ul className="text-sm text-blue-700 space-y-1 ml-4">
            <li>• Просматривать и подавать заявки на внутренние проекты</li>
            <li>• Рассматривать вакансии в других отделах</li>
            <li>• Получать опыт работы в разных направлениях</li>
            <li>• Развивать новые навыки и компетенции</li>
          </ul>

          {!showReasonForm ? (
            <Button 
              onClick={() => setShowReasonForm(true)}
              className="w-full"
            >
              Подать заявку на ротацию
            </Button>
          ) : (
            <div className="space-y-4">
              <div>
                <Label htmlFor="reason">Причина подачи заявки (необязательно)</Label>
                <Textarea
                  id="reason"
                  placeholder="Расскажите, почему вы хотите участвовать в программе ротации..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="mt-2"
                  rows={3}
                />
              </div>
              <div className="flex space-x-2">
                <Button 
                  onClick={handleSubmitApplication}
                  disabled={submitting}
                  className="flex-1"
                >
                  {submitting ? 'Подаем заявку...' : 'Подать заявку'}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowReasonForm(false)
                    setReason('')
                  }}
                  disabled={submitting}
                >
                  Отмена
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
