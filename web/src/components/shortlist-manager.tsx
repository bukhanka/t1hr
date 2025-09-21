"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { 
  Plus,
  FolderOpen,
  Users,
  Trash2,
  Edit,
  MessageCircle
} from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

interface ShortListData {
  id: string
  title: string
  description: string | null
  createdAt: Date | string
  updatedAt: Date | string
  candidates: Array<{
    id: string
    notes: string | null
    profile: {
      id: string
      jobTitle: string | null
      department: string | null
      profileStrength: number
      user: {
        name: string | null
        email: string | null
      }
      userSkills: Array<{
        skill: {
          name: string
        }
        level: number
        isVerified: boolean
      }>
    }
  }>
}

interface ShortListManagerProps {
  shortlists: ShortListData[]
  managerId: string
}

export function ShortListManager({ shortlists, managerId }: ShortListManagerProps) {
  const [localShortlists, setLocalShortlists] = useState<ShortListData[]>(shortlists)
  const [newListTitle, setNewListTitle] = useState('')
  const [newListDescription, setNewListDescription] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  const createShortList = async () => {
    if (!newListTitle.trim()) return

    setIsCreating(true)
    try {
      const response = await fetch('/api/shortlists', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: newListTitle.trim(),
          description: newListDescription.trim() || null
        })
      })

      if (response.ok) {
        const newShortlist = await response.json()
        setLocalShortlists([newShortlist, ...localShortlists])
        setNewListTitle('')
        setNewListDescription('')
      }
    } catch (error) {
      console.error('Ошибка при создании шорт-листа:', error)
    } finally {
      setIsCreating(false)
    }
  }

  const deleteShortList = async (id: string) => {
    try {
      const response = await fetch(`/api/shortlists/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setLocalShortlists(localShortlists.filter(sl => sl.id !== id))
      }
    } catch (error) {
      console.error('Ошибка при удалении шорт-листа:', error)
    }
  }

  const removeCandidateFromShortlist = async (shortlistId: string, candidateId: string) => {
    try {
      const response = await fetch(`/api/shortlists/${shortlistId}/candidates/${candidateId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setLocalShortlists(localShortlists.map(sl => 
          sl.id === shortlistId 
            ? { ...sl, candidates: sl.candidates.filter(c => c.id !== candidateId) }
            : sl
        ))
      }
    } catch (error) {
      console.error('Ошибка при удалении кандидата:', error)
    }
  }

  return (
    <div className="space-y-6">
      {/* Создание нового шорт-листа */}
      <Dialog>
        <DialogTrigger asChild>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Создать шорт-лист
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Создать новый шорт-лист</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Название</Label>
              <Input
                id="title"
                placeholder="Например: Frontend команда для проекта X"
                value={newListTitle}
                onChange={(e) => setNewListTitle(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="description">Описание (опционально)</Label>
              <Textarea
                id="description"
                placeholder="Описание требований или заметки..."
                value={newListDescription}
                onChange={(e) => setNewListDescription(e.target.value)}
              />
            </div>
            <Button 
              onClick={createShortList} 
              disabled={isCreating || !newListTitle.trim()}
              className="w-full"
            >
              {isCreating ? 'Создание...' : 'Создать шорт-лист'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Список шорт-листов */}
      {localShortlists.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <FolderOpen className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Нет шорт-листов
            </h3>
            <p className="text-gray-600 mb-4">
              Создайте ваш первый шорт-лист для организации кандидатов
            </p>
            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Создать первый шорт-лист
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Создать новый шорт-лист</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title">Название</Label>
                    <Input
                      id="title"
                      placeholder="Например: Frontend команда для проекта X"
                      value={newListTitle}
                      onChange={(e) => setNewListTitle(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Описание (опционально)</Label>
                    <Textarea
                      id="description"
                      placeholder="Описание требований или заметки..."
                      value={newListDescription}
                      onChange={(e) => setNewListDescription(e.target.value)}
                    />
                  </div>
                  <Button 
                    onClick={createShortList} 
                    disabled={isCreating || !newListTitle.trim()}
                    className="w-full"
                  >
                    {isCreating ? 'Создание...' : 'Создать шорт-лист'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {localShortlists.map((shortlist) => (
            <Card key={shortlist.id} className="overflow-hidden">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <FolderOpen className="h-5 w-5" />
                      {shortlist.title}
                    </CardTitle>
                    {shortlist.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {shortlist.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">
                      {shortlist.candidates.length} кандидатов
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteShortList(shortlist.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                {shortlist.candidates.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                    <p className="text-gray-500">
                      В этом шорт-листе пока нет кандидатов
                    </p>
                    <p className="text-sm text-gray-400 mt-1">
                      Используйте поиск талантов, чтобы добавить кандидатов
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {shortlist.candidates.map((candidate) => (
                      <div key={candidate.id} className="border rounded-lg p-4 hover:bg-gray-50">
                        <div className="flex items-start justify-between">
                          <div className="flex space-x-3 flex-1">
                            <Avatar className="h-10 w-10">
                              <AvatarFallback>
                                {candidate.profile.user.name?.split(' ').map(n => n[0]).join('') || '??'}
                              </AvatarFallback>
                            </Avatar>
                            
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-1">
                                <h4 className="font-medium">
                                  {candidate.profile.user.name}
                                </h4>
                                <Badge variant="secondary">
                                  {candidate.profile.profileStrength}% профиль
                                </Badge>
                              </div>
                              
                              <p className="text-sm text-gray-600 mb-2">
                                {candidate.profile.jobTitle} • {candidate.profile.department}
                              </p>
                              
                              <div className="flex flex-wrap gap-1 mb-2">
                                {candidate.profile.userSkills.slice(0, 4).map((userSkill, idx) => (
                                  <Badge key={idx} variant="outline" className="text-xs">
                                    {userSkill.skill.name}
                                    {userSkill.isVerified && " ✓"}
                                  </Badge>
                                ))}
                                {candidate.profile.userSkills.length > 4 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{candidate.profile.userSkills.length - 4} еще
                                  </Badge>
                                )}
                              </div>
                              
                              {candidate.notes && (
                                <div className="mt-2 p-2 bg-blue-50 rounded text-sm">
                                  <strong>Заметки:</strong> {candidate.notes}
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex flex-col space-y-1 ml-4">
                            <Button size="sm" variant="outline">
                              <MessageCircle className="mr-1 h-3 w-3" />
                              Связаться
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => removeCandidateFromShortlist(shortlist.id, candidate.id)}
                            >
                              <Trash2 className="mr-1 h-3 w-3" />
                              Удалить
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
