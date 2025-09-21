"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Users, 
  Plus, 
  Search,
  MessageSquare,
  Calendar,
  Hash,
  Crown,
  Shield,
  UserPlus,
  UserMinus,
  Loader2,
  Sparkles,
  Zap,
  Code,
  Lightbulb,
  Building
} from "lucide-react"
import { useToast } from "@/providers/toast-provider"

interface Community {
  id: string
  name: string
  description: string
  type: string
  tags: string[]
  privacy: string
  memberCount: number
  isMember: boolean
  isCreator: boolean
  creator: {
    user: { name: string; image?: string }
  }
  members: Array<{
    profile: { user: { name: string; image?: string } }
    joinedAt: string
  }>
  posts: Array<{
    id: string
    content: string
    createdAt: string
    author: { user: { name: string } }
  }>
  _count: {
    members: number
    posts: number
  }
  createdAt: string
}

interface CommunityStats {
  total: number
  joined: number
  created: number
}

const COMMUNITY_TYPES = [
  { value: 'skill', label: 'Навыки', icon: Code, description: 'По технологиям и навыкам' },
  { value: 'project', label: 'Проекты', icon: Zap, description: 'По рабочим проектам' },
  { value: 'interest', label: 'Интересы', icon: Lightbulb, description: 'По общим интересам' },
  { value: 'department', label: 'Отделы', icon: Building, description: 'По департаментам' }
]

export function Communities() {
  const [communities, setCommunities] = useState<Community[]>([])
  const [stats, setStats] = useState<CommunityStats>({ total: 0, joined: 0, created: 0 })
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState<string>('all')
  const [showJoinedOnly, setShowJoinedOnly] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [joiningCommunity, setJoiningCommunity] = useState<string | null>(null)

  // Создание сообщества
  const [newCommunity, setNewCommunity] = useState({
    name: '',
    description: '',
    type: 'skill',
    tags: [],
    privacy: 'PUBLIC'
  })

  const { toast } = useToast()

  useEffect(() => {
    loadCommunities()
  }, [searchTerm, selectedType, showJoinedOnly])

  const loadCommunities = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (selectedType !== 'all') params.set('type', selectedType)
      if (searchTerm) params.set('search', searchTerm)
      if (showJoinedOnly) params.set('joined', 'true')

      const response = await fetch(`/api/communities?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setCommunities(data.communities)
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Ошибка загрузки сообществ:', error)
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить сообщества",
        variant: "error"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleJoinCommunity = async (communityId: string, communityName: string) => {
    try {
      setJoiningCommunity(communityId)
      const response = await fetch(`/api/communities/${communityId}/join`, {
        method: 'POST'
      })

      const result = await response.json()

      if (response.ok) {
        toast({
          title: "Добро пожаловать! 🎉",
          description: result.message,
          variant: "default"
        })
        // Обновляем состояние сообщества
        setCommunities(prev => prev.map(community => 
          community.id === communityId 
            ? { ...community, isMember: true, memberCount: community.memberCount + 1 }
            : community
        ))
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
        description: "Не удалось присоединиться к сообществу",
        variant: "error"
      })
    } finally {
      setJoiningCommunity(null)
    }
  }

  const handleLeaveCommunity = async (communityId: string) => {
    try {
      setJoiningCommunity(communityId)
      const response = await fetch(`/api/communities/${communityId}/join`, {
        method: 'DELETE'
      })

      const result = await response.json()

      if (response.ok) {
        toast({
          title: "Выполнено",
          description: result.message,
          variant: "default"
        })
        setCommunities(prev => prev.map(community => 
          community.id === communityId 
            ? { ...community, isMember: false, memberCount: community.memberCount - 1 }
            : community
        ))
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
        description: "Не удалось покинуть сообщество",
        variant: "error"
      })
    } finally {
      setJoiningCommunity(null)
    }
  }

  const handleCreateCommunity = async () => {
    try {
      if (!newCommunity.name || !newCommunity.description) {
        toast({
          title: "Ошибка",
          description: "Заполните все обязательные поля",
          variant: "error"
        })
        return
      }

      const response = await fetch('/api/communities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCommunity)
      })

      const result = await response.json()

      if (response.ok) {
        toast({
          title: "Сообщество создано! 🎉",
          description: result.message,
          variant: "default"
        })
        setShowCreateModal(false)
        setNewCommunity({ name: '', description: '', type: 'skill', tags: [], privacy: 'PUBLIC' })
        loadCommunities() // Перезагружаем список
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
        description: "Не удалось создать сообщество",
        variant: "error"
      })
    }
  }

  const getTypeIcon = (type: string) => {
    const typeConfig = COMMUNITY_TYPES.find(t => t.value === type)
    const Icon = typeConfig?.icon || Users
    return <Icon className="h-4 w-4" />
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Загружаем сообщества...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Сообщества</h2>
          <p className="text-gray-600">Объединяйтесь с коллегами по интересам и навыкам</p>
        </div>

        <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Создать сообщество
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Создать новое сообщество</DialogTitle>
              <DialogDescription>
                Создайте сообщество для объединения коллег с общими интересами
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Название сообщества</Label>
                <Input
                  id="name"
                  value={newCommunity.name}
                  onChange={(e) => setNewCommunity(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="React Developers T1"
                />
              </div>

              <div>
                <Label htmlFor="description">Описание</Label>
                <Textarea
                  id="description"
                  value={newCommunity.description}
                  onChange={(e) => setNewCommunity(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Сообщество для обмена опытом по React разработке..."
                  rows={3}
                />
              </div>

              <div>
                <Label>Тип сообщества</Label>
                <Select 
                  value={newCommunity.type}
                  onValueChange={(value) => setNewCommunity(prev => ({ ...prev, type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COMMUNITY_TYPES.map(type => {
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
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                Отмена
              </Button>
              <Button onClick={handleCreateCommunity}>
                Создать
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              <div>
                <div className="text-2xl font-bold">{stats.total}</div>
                <div className="text-sm text-muted-foreground">Всего сообществ</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-green-600" />
              <div>
                <div className="text-2xl font-bold">{stats.joined}</div>
                <div className="text-sm text-muted-foreground">Ваше участие</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-yellow-600" />
              <div>
                <div className="text-2xl font-bold">{stats.created}</div>
                <div className="text-sm text-muted-foreground">Созданные вами</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Фильтры */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Поиск сообществ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <Select value={selectedType} onValueChange={setSelectedType}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Тип сообщества" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все типы</SelectItem>
            {COMMUNITY_TYPES.map(type => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          variant={showJoinedOnly ? "default" : "outline"}
          onClick={() => setShowJoinedOnly(!showJoinedOnly)}
        >
          Мои сообщества
        </Button>
      </div>

      {/* Список сообществ */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {communities.map((community) => (
          <Card key={community.id} className="flex flex-col hover:shadow-lg transition-shadow cursor-pointer" onClick={() => window.location.href = `/communities/${community.id}`}>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  {getTypeIcon(community.type)}
                  <CardTitle className="text-lg">{community.name}</CardTitle>
                </div>
                
                {community.isCreator && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Crown className="h-3 w-3" />
                    Создатель
                  </Badge>
                )}
              </div>
              
              <CardDescription className="line-clamp-2">
                {community.description}
              </CardDescription>
            </CardHeader>

            <CardContent className="flex-1 flex flex-col">
              {/* Теги */}
              {community.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {community.tags.slice(0, 3).map((tag, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      <Hash className="h-2 w-2 mr-1" />
                      {tag}
                    </Badge>
                  ))}
                  {community.tags.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{community.tags.length - 3}
                    </Badge>
                  )}
                </div>
              )}

              {/* Статистика */}
              <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                <div className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {community._count.members}
                </div>
                <div className="flex items-center gap-1">
                  <MessageSquare className="h-3 w-3" />
                  {community._count.posts}
                </div>
              </div>

              {/* Последняя активность */}
              {community.posts.length > 0 && (
                <div className="bg-gray-50 rounded p-2 text-xs mb-3">
                  <div className="text-muted-foreground">Последний пост:</div>
                  <div className="truncate">{community.posts[0].content.substring(0, 80)}...</div>
                  <div className="text-muted-foreground">
                    от {community.posts[0].author.user.name}
                  </div>
                </div>
              )}

              {/* Кнопка участия */}
              <div className="mt-auto">
                {community.isMember ? (
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleLeaveCommunity(community.id)
                    }}
                    disabled={joiningCommunity === community.id || community.isCreator}
                  >
                    {joiningCommunity === community.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <UserMinus className="h-4 w-4 mr-2" />
                        {community.isCreator ? 'Создатель' : 'Покинуть'}
                      </>
                    )}
                  </Button>
                ) : (
                  <Button 
                    className="w-full"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleJoinCommunity(community.id, community.name)
                    }}
                    disabled={joiningCommunity === community.id}
                  >
                    {joiningCommunity === community.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <UserPlus className="h-4 w-4 mr-2" />
                        Присоединиться
                      </>
                    )}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {communities.length === 0 && (
        <div className="text-center py-12">
          <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-medium mb-2">Нет сообществ</h3>
          <p className="text-muted-foreground mb-4">
            {searchTerm || selectedType !== 'all' || showJoinedOnly
              ? 'Попробуйте изменить фильтры поиска'
              : 'Станьте первым, кто создаст сообщество!'}
          </p>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Создать первое сообщество
          </Button>
        </div>
      )}
    </div>
  )
}
