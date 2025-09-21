"use client"

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { 
  Send, 
  Loader2,
  MessageSquare,
  HelpCircle,
  Share,
  Calendar,
  Sparkles,
  Image as ImageIcon,
  Link as LinkIcon
} from "lucide-react"
import { useToast } from "@/providers/toast-provider"

interface CreatePostProps {
  communityId: string
  communityName: string
  onPostCreated?: (post: any) => void
  userImage?: string
  userName?: string
}

const POST_TYPES = [
  { 
    value: 'TEXT', 
    label: 'Обсуждение', 
    icon: MessageSquare, 
    description: 'Поделитесь мыслями и начните обсуждение',
    color: 'bg-blue-50 border-blue-200 text-blue-700'
  },
  { 
    value: 'QUESTION', 
    label: 'Вопрос', 
    icon: HelpCircle, 
    description: 'Задайте вопрос сообществу',
    color: 'bg-red-50 border-red-200 text-red-700'
  },
  { 
    value: 'RESOURCE_SHARE', 
    label: 'Ресурс', 
    icon: Share, 
    description: 'Поделитесь полезной ссылкой или материалом',
    color: 'bg-green-50 border-green-200 text-green-700'
  },
  { 
    value: 'EVENT', 
    label: 'Событие', 
    icon: Calendar, 
    description: 'Анонсируйте мероприятие или встречу',
    color: 'bg-purple-50 border-purple-200 text-purple-700'
  }
]

export function CreatePost({ communityId, communityName, onPostCreated, userImage, userName = "Вы" }: CreatePostProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    type: 'TEXT' as const
  })

  const { toast } = useToast()

  const selectedType = POST_TYPES.find(type => type.value === formData.type)

  const handleSubmit = async () => {
    if (!formData.content.trim()) {
      toast({
        title: "Ошибка",
        description: "Напишите содержимое поста",
        variant: "error"
      })
      return
    }

    try {
      setIsSubmitting(true)
      const response = await fetch(`/api/communities/${communityId}/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title.trim() || undefined,
          content: formData.content.trim(),
          type: formData.type
        })
      })

      const result = await response.json()

      if (response.ok) {
        toast({
          title: "🎉 Пост опубликован!",
          description: "Ваш пост появился в ленте сообщества",
          variant: "default"
        })

        // Сбрасываем форму
        setFormData({
          title: '',
          content: '',
          type: 'TEXT'
        })
        setIsExpanded(false)

        // Уведомляем родительский компонент
        onPostCreated?.(result.post)

      } else {
        toast({
          title: "Ошибка",
          description: result.error,
          variant: "error"
        })
      }
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось создать пост",
        variant: "error"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const getAuthorInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase()
  }

  if (!isExpanded) {
    return (
      <Card className="mb-6 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setIsExpanded(true)}>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={userImage} />
              <AvatarFallback>
                {getAuthorInitials(userName)}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <div className="bg-gray-100 rounded-full px-4 py-2 text-muted-foreground">
                Поделитесь чем-то с сообществом "{communityName}"...
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="ghost" size="sm">
                <ImageIcon className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <LinkIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="mb-6 shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Создать пост</CardTitle>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => {
              setIsExpanded(false)
              setFormData({ title: '', content: '', type: 'TEXT' })
            }}
          >
            ✕
          </Button>
        </div>
        
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Avatar className="h-6 w-6">
            <AvatarImage src={userImage} />
            <AvatarFallback className="text-xs">
              {getAuthorInitials(userName)}
            </AvatarFallback>
          </Avatar>
          <span>Публикуется в <strong>{communityName}</strong></span>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Тип поста */}
        <div>
          <label className="text-sm font-medium mb-2 block">Тип поста</label>
          <Select 
            value={formData.type} 
            onValueChange={(value: any) => setFormData(prev => ({ ...prev, type: value }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {POST_TYPES.map(type => {
                const Icon = type.icon
                return (
                  <SelectItem key={type.value} value={type.value}>
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      <div>
                        <div className="font-medium">{type.label}</div>
                        <div className="text-xs text-muted-foreground">{type.description}</div>
                      </div>
                    </div>
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>
        </div>

        {/* Превью выбранного типа */}
        {selectedType && (
          <div className={`p-3 rounded-lg border ${selectedType.color}`}>
            <div className="flex items-center gap-2">
              <selectedType.icon className="h-4 w-4" />
              <span className="font-medium">{selectedType.label}</span>
            </div>
            <p className="text-sm mt-1 opacity-80">{selectedType.description}</p>
          </div>
        )}

        {/* Заголовок (опционально) */}
        <div>
          <label className="text-sm font-medium mb-2 block">
            Заголовок <span className="text-muted-foreground">(необязательно)</span>
          </label>
          <Input
            placeholder="О чем ваш пост?"
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            maxLength={100}
          />
          <div className="text-xs text-muted-foreground mt-1">
            {formData.title.length}/100
          </div>
        </div>

        {/* Содержимое */}
        <div>
          <label className="text-sm font-medium mb-2 block">Содержимое *</label>
          <Textarea
            placeholder="Напишите здесь..."
            value={formData.content}
            onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
            className="min-h-[120px] resize-none"
            maxLength={1000}
          />
          <div className="flex justify-between items-center text-xs text-muted-foreground mt-1">
            <span>{formData.content.length}/1000</span>
            <div className="flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              <span>Используйте @упоминания для отмеченяых коллег</span>
            </div>
          </div>
        </div>

        {/* Кнопки действий */}
        <div className="flex justify-between items-center pt-2">
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" disabled>
              <ImageIcon className="h-4 w-4 mr-1" />
              Фото
            </Button>
            <Button variant="ghost" size="sm" disabled>
              <LinkIcon className="h-4 w-4 mr-1" />
              Ссылка
            </Button>
          </div>

          <div className="flex gap-2">
            <Button 
              variant="outline"
              onClick={() => {
                setIsExpanded(false)
                setFormData({ title: '', content: '', type: 'TEXT' })
              }}
            >
              Отмена
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={isSubmitting || !formData.content.trim()}
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Опубликовать
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
