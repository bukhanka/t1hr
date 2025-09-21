"use client"

import { useState } from 'react'
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { 
  Heart, 
  MessageSquare, 
  Share2,
  Pin,
  MoreHorizontal,
  Send,
  Loader2,
  ChevronDown,
  ChevronUp,
  Sparkles
} from "lucide-react"
import { useToast } from "@/providers/toast-provider"
import { formatDistanceToNow } from 'date-fns'
import { ru } from 'date-fns/locale'

interface Comment {
  id: string
  content: string
  createdAt: string
  author: {
    user: {
      name: string
      image?: string
    }
  }
}

interface CommunityPost {
  id: string
  title?: string
  content: string
  type: string
  isPinned: boolean
  likesCount: number
  commentsCount: number
  isLikedByUser: boolean
  createdAt: string
  updatedAt: string
  author: {
    user: {
      name: string
      image?: string
    }
  }
  recentComments: Comment[]
}

interface CommunityPostProps {
  post: CommunityPost
  communityId: string
  onUpdate?: (updatedPost: Partial<CommunityPost>) => void
}

const POST_TYPES = {
  TEXT: { label: 'Обсуждение', color: 'default' },
  QUESTION: { label: 'Вопрос', color: 'destructive' },
  RESOURCE_SHARE: { label: 'Ресурс', color: 'secondary' },
  EVENT: { label: 'Событие', color: 'default' }
} as const

export function CommunityPost({ post, communityId, onUpdate }: CommunityPostProps) {
  const [isLiking, setIsLiking] = useState(false)
  const [isCommenting, setIsCommenting] = useState(false)
  const [showComments, setShowComments] = useState(false)
  const [comments, setComments] = useState<Comment[]>(post.recentComments || [])
  const [newComment, setNewComment] = useState('')
  const [loadingComments, setLoadingComments] = useState(false)
  
  const { toast } = useToast()

  const handleLike = async () => {
    try {
      setIsLiking(true)
      const response = await fetch(`/api/communities/${communityId}/posts/${post.id}/like`, {
        method: 'POST'
      })

      const result = await response.json()

      if (response.ok) {
        // Обновляем состояние поста
        onUpdate?.({
          likesCount: result.likesCount,
          isLikedByUser: result.isLiked
        })

        if (result.action === 'liked') {
          toast({
            title: "❤️ Лайк поставлен!",
            description: "Вы поддержали этот пост",
            variant: "default"
          })
        }
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
        description: "Не удалось поставить лайк",
        variant: "error"
      })
    } finally {
      setIsLiking(false)
    }
  }

  const handleComment = async () => {
    if (!newComment.trim()) return

    try {
      setIsCommenting(true)
      const response = await fetch(`/api/communities/${communityId}/posts/${post.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newComment.trim() })
      })

      const result = await response.json()

      if (response.ok) {
        // Добавляем новый комментарий в начало списка
        setComments(prev => [result.comment, ...prev])
        setNewComment('')
        
        // Обновляем счетчик комментариев
        onUpdate?.({
          commentsCount: post.commentsCount + 1
        })

        toast({
          title: "💬 Комментарий добавлен!",
          description: "Ваш комментарий опубликован",
          variant: "default"
        })
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
        description: "Не удалось добавить комментарий",
        variant: "error"
      })
    } finally {
      setIsCommenting(false)
    }
  }

  const loadAllComments = async () => {
    try {
      setLoadingComments(true)
      const response = await fetch(`/api/communities/${communityId}/posts/${post.id}/comments`)
      
      if (response.ok) {
        const result = await response.json()
        setComments(result.comments)
        setShowComments(true)
      }
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить комментарии",
        variant: "error"
      })
    } finally {
      setLoadingComments(false)
    }
  }

  const getAuthorInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase()
  }

  const getTypeConfig = (type: string) => {
    return POST_TYPES[type as keyof typeof POST_TYPES] || POST_TYPES.TEXT
  }

  const timeAgo = formatDistanceToNow(new Date(post.createdAt), { 
    addSuffix: true, 
    locale: ru 
  })

  return (
    <Card className="mb-4">
      <CardContent className="p-4">
        {/* Заголовок поста */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={post.author.user.image || undefined} />
              <AvatarFallback>
                {getAuthorInitials(post.author.user.name)}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium">{post.author.user.name}</span>
                <Badge 
                  variant={getTypeConfig(post.type).color as any}
                  className="text-xs"
                >
                  {getTypeConfig(post.type).label}
                </Badge>
                {post.isPinned && (
                  <Pin className="h-3 w-3 text-yellow-600" />
                )}
              </div>
              <span className="text-xs text-muted-foreground">{timeAgo}</span>
            </div>
          </div>
          
          <Button variant="ghost" size="sm">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>

        {/* Заголовок поста */}
        {post.title && (
          <h3 className="text-lg font-semibold mb-2">{post.title}</h3>
        )}

        {/* Содержимое */}
        <div className="mb-4">
          <p className="whitespace-pre-wrap break-words">{post.content}</p>
        </div>

        {/* Статистика */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
          <span>{post.likesCount} лайков</span>
          <span>{post.commentsCount} комментариев</span>
        </div>

        {/* Действия */}
        <div className="flex items-center gap-2 pb-3 border-b">
          <Button
            variant={post.isLikedByUser ? "default" : "ghost"}
            size="sm"
            onClick={handleLike}
            disabled={isLiking}
            className={post.isLikedByUser ? "text-red-600" : ""}
          >
            {isLiking ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Heart className={`h-4 w-4 mr-1 ${post.isLikedByUser ? 'fill-current' : ''}`} />
            )}
            Нравится
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowComments(!showComments)}
          >
            <MessageSquare className="h-4 w-4 mr-1" />
            Комментировать
          </Button>

          <Button variant="ghost" size="sm">
            <Share2 className="h-4 w-4 mr-1" />
            Поделиться
          </Button>
        </div>

        {/* Последние комментарии */}
        {post.recentComments && post.recentComments.length > 0 && !showComments && (
          <div className="mt-3 space-y-2">
            {post.recentComments.slice(0, 2).map((comment) => (
              <div key={comment.id} className="flex items-start gap-2 text-sm">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={comment.author.user.image || undefined} />
                  <AvatarFallback className="text-xs">
                    {getAuthorInitials(comment.author.user.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <span className="font-medium">{comment.author.user.name}</span>
                  <span className="ml-2">{comment.content}</span>
                </div>
              </div>
            ))}
            
            {post.commentsCount > 2 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={loadAllComments}
                disabled={loadingComments}
                className="text-xs"
              >
                {loadingComments ? (
                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                ) : (
                  <ChevronDown className="h-3 w-3 mr-1" />
                )}
                Показать все {post.commentsCount} комментариев
              </Button>
            )}
          </div>
        )}

        {/* Полный список комментариев */}
        {showComments && (
          <div className="mt-3 space-y-3">
            {comments.length > 0 ? (
              <>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Комментарии</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowComments(false)}
                  >
                    <ChevronUp className="h-3 w-3" />
                  </Button>
                </div>
                
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {comments.map((comment) => (
                    <div key={comment.id} className="flex items-start gap-2 text-sm">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={comment.author.user.image || undefined} />
                        <AvatarFallback className="text-xs">
                          {getAuthorInitials(comment.author.user.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 bg-gray-50 rounded-lg p-2">
                        <div className="font-medium text-xs">{comment.author.user.name}</div>
                        <div>{comment.content}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {formatDistanceToNow(new Date(comment.createdAt), { 
                            addSuffix: true, 
                            locale: ru 
                          })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Пока нет комментариев</p>
            )}

            {/* Форма добавления комментария */}
            <div className="flex items-start gap-2">
              <Avatar className="h-6 w-6">
                <AvatarFallback className="text-xs">Я</AvatarFallback>
              </Avatar>
              <div className="flex-1 flex gap-2">
                <Textarea
                  placeholder="Напишите комментарий..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="min-h-[40px] resize-none"
                  rows={1}
                />
                <Button
                  size="sm"
                  onClick={handleComment}
                  disabled={isCommenting || !newComment.trim()}
                >
                  {isCommenting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
