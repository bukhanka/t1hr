"use client"

import { useState } from "react"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/components/ui/use-toast"
import { RotateCcw, UserCheck } from "lucide-react"

interface RotationStatusToggleProps {
  profileId: string
  currentStatus: string
  employeeName: string
}

export function RotationStatusToggle({ 
  profileId, 
  currentStatus, 
  employeeName 
}: RotationStatusToggleProps) {
  const [status, setStatus] = useState(currentStatus)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleToggle = async (checked: boolean) => {
    setIsLoading(true)
    const newStatus = checked ? 'ROTATION' : 'STABLE'
    
    try {
      const response = await fetch('/api/hr/rotation-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          profileId,
          rotationStatus: newStatus
        })
      })

      if (!response.ok) {
        throw new Error('Не удалось обновить статус')
      }

      setStatus(newStatus)
      toast({
        title: "Статус обновлен",
        description: `${employeeName} ${newStatus === 'ROTATION' ? 'добавлен в программу ротации' : 'переведен на стабильную позицию'}`,
        variant: "success"
      })

      // Перезагружаем страницу для обновления статистики
      window.location.reload()
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось обновить статус ротации",
        variant: "error"
      })
      console.error('Ошибка при обновлении статуса ротации:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex items-center space-x-2">
      <Switch
        checked={status === 'ROTATION'}
        onCheckedChange={handleToggle}
        disabled={isLoading}
        aria-label={`Переключить статус ротации для ${employeeName}`}
      />
    </div>
  )
}
