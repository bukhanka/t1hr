"use client"

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CommunityPostsFeed } from './community-posts-feed'
import { 
  ArrowLeft,
  Users, 
  MessageSquare,
  Crown,
  Shield,
  UserPlus,
  UserMinus,
  Share2,
  MoreHorizontal,
  Calendar,
  Hash,
  Loader2,
  Settings,
  Code,
  Lightbulb,
  Building,
  Zap
} from "lucide-react"
import { useToast } from "@/providers/toast-provider"
import { useRouter } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'
import { ru } from 'date-fns/locale'

interface Member {
  profile: {
    user: {
      name: string
      image?: string
    }
  }
  role: string
  joinedAt: string
}

interface Community {
  id: string
  name: string
  description: string
  type: string
  tags: string[]
  privacy: string
  memberCount: number
  createdAt: string
  creator: {
    user: {
      name: string
      image?: string
    }
  }
  members: Member[]
  _count: {
    members: number
    posts: number
  }
  isMember: boolean
  isCreator: boolean
  userRole?: string
}

interface CommunityDetailProps {
  community: Community
  currentUser: {
    name: string
    image?: string
  }
}

const COMMUNITY_TYPES = {
  skill: { label: 'Навыки', icon: Code, description: 'По технологиям и навыкам' },
  project: { label: 'Проекты', icon: Zap, description: 'По рабочим проектам' },
  interest: { label: 'Интересы', icon: Lightbulb, description: 'По общим интересам' },
  department: { label: 'Отделы', icon: Building, description: 'По департаментам' }
}

const ROLE_LABELS = {
  ADMIN: { label: 'Администратор', icon: Crown, color: 'bg-yellow-100 text-yellow-800' },
  MODERATOR: { label: 'Модератор', icon: Shield, color: 'bg-blue-100 text-blue-800' },
  MEMBER: { label: 'Участник', icon: Users, color: 'bg-gray-100 text-gray-800' }
}

export function CommunityDetail({ community, currentUser }: CommunityDetailProps) {
  const [joining, setJoining] = useState(false)
  const [activeTab, setActiveTab] = useState('posts')
  
  const router = useRouter()
  const { toast } = useToast()

  const typeConfig = COMMUNITY_TYPES[community.type as keyof typeof COMMUNITY_TYPES]
  const TypeIcon = typeConfig?.icon || Users

  const handleJoinLeave = async () => {
    try {
      setJoining(true)
      const method = community.isMember ? 'DELETE' : 'POST'
      const response = await fetch(`/api/communities/${community.id}/join`, {
        method
      })

      const result = await response.json()

      if (response.ok) {
        toast({
          title: community.isMember ? "Выполнено" : "Добро пожаловать! 🎉",
          description: result.message,
          variant: "default"
        })
        
        // Перезагружаем страницу для обновления состояния
        router.refresh()
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
        description: "Произошла ошибка при выполнении действия",
        variant: "error"
      })
    } finally {
      setJoining(false)
    }
  }

  const getAuthorInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase()
  }

  const getRoleConfig = (role: string) => {
    return ROLE_LABELS[role as keyof typeof ROLE_LABELS] || ROLE_LABELS.MEMBER
  }

  return (
    <div className="space-y-6">
      {/* Заголовок с кнопкой назад */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">Сообщество</h1>
      </div>

      {/* Основная информация */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <TypeIcon className="h-8 w-8 text-primary" />
                <div>
                  <CardTitle className="text-2xl">{community.name}</CardTitle>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <TypeIcon className="h-3 w-3" />
                      {typeConfig?.label}
                    </Badge>
                    {community.privacy !== 'PUBLIC' && (
                      <Badge variant="outline">
                        {community.privacy === 'PRIVATE' ? 'Закрытое' : 'По приглашениям'}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              
              <CardDescription className="text-base">
                {community.description}
              </CardDescription>
            </div>

            <div className="flex gap-2">
              {!community.isMember ? (
                <Button
                  onClick={handleJoinLeave}
                  disabled={joining}
                >
                  {joining ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <UserPlus className="h-4 w-4 mr-2" />
                  )}
                  Присоединиться
                </Button>
              ) : (
                <Button
                  variant={community.isCreator ? "outline" : "outline"}
                  onClick={handleJoinLeave}
                  disabled={joining || community.isCreator}
                >
                  {joining ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <UserMinus className="h-4 w-4 mr-2" />
                  )}
                  {community.isCreator ? 'Создатель' : 'Покинуть'}
                </Button>
              )}
              
              <Button variant="outline" size="sm">
                <Share2 className="h-4 w-4" />
              </Button>
              
              {(community.isCreator || community.userRole === 'ADMIN') && (
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Теги */}
          {community.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {community.tags.map((tag, index) => (
                <Badge key={index} variant="outline" className="flex items-center gap-1">
                  <Hash className="h-2 w-2" />
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Статистика */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{community._count.members}</div>
              <div className="text-sm text-muted-foreground">Участников</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{community._count.posts}</div>
              <div className="text-sm text-muted-foreground">Постов</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {formatDistanceToNow(new Date(community.createdAt), { locale: ru })}
              </div>
              <div className="text-sm text-muted-foreground">Возраст</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {community.privacy === 'PUBLIC' ? '🌍' : '🔒'}
              </div>
              <div className="text-sm text-muted-foreground">
                {community.privacy === 'PUBLIC' ? 'Открытое' : 'Закрытое'}
              </div>
            </div>
          </div>

          {/* Создатель */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Создал:</span>
            <Avatar className="h-5 w-5">
              <AvatarImage src={community.creator.user.image || undefined} />
              <AvatarFallback className="text-xs">
                {getAuthorInitials(community.creator.user.name)}
              </AvatarFallback>
            </Avatar>
            <span>{community.creator.user.name}</span>
            <Calendar className="h-3 w-3 ml-2" />
            <span>{formatDistanceToNow(new Date(community.createdAt), { addSuffix: true, locale: ru })}</span>
          </div>
        </CardContent>
      </Card>

      {/* Вкладки */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="posts" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Посты ({community._count.posts})
          </TabsTrigger>
          <TabsTrigger value="members" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Участники ({community._count.members})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="posts" className="mt-6">
          <CommunityPostsFeed
            communityId={community.id}
            communityName={community.name}
            userImage={currentUser.image}
            userName={currentUser.name}
            isMember={community.isMember}
          />
        </TabsContent>

        <TabsContent value="members" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Участники сообщества</CardTitle>
              <CardDescription>
                {community._count.members} активных участников
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {community.members.map((member, index) => {
                  const roleConfig = getRoleConfig(member.role)
                  const RoleIcon = roleConfig.icon
                  
                  return (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={member.profile.user.image || undefined} />
                          <AvatarFallback>
                            {getAuthorInitials(member.profile.user.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{member.profile.user.name}</div>
                          <div className="text-sm text-muted-foreground">
                            Присоединился {formatDistanceToNow(new Date(member.joinedAt), { 
                              addSuffix: true, 
                              locale: ru 
                            })}
                          </div>
                        </div>
                      </div>
                      
                      <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${roleConfig.color}`}>
                        <RoleIcon className="h-3 w-3" />
                        {roleConfig.label}
                      </div>
                    </div>
                  )
                })}
                
                {community._count.members > community.members.length && (
                  <div className="text-center py-4">
                    <Button variant="outline" size="sm">
                      Показать всех участников
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
