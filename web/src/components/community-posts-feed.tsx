"use client"

import { useState, useEffect, useCallback } from 'react'
import { CreatePost } from './create-post'
import { CommunityPost } from './community-post'
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Loader2,
  RefreshCcw,
  Filter,
  TrendingUp,
  Clock,
  MessageSquare,
  Heart
} from "lucide-react"
import { useToast } from "@/providers/toast-provider"

interface Post {
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
  recentComments: Array<{
    id: string
    content: string
    createdAt: string
    author: {
      user: {
        name: string
        image?: string
      }
    }
  }>
}

interface CommunityPostsFeedProps {
  communityId: string
  communityName: string
  userImage?: string
  userName?: string
  isMember: boolean
}

const SORT_OPTIONS = [
  { value: 'recent', label: 'Новые', icon: Clock },
  { value: 'popular', label: 'Популярные', icon: TrendingUp },
  { value: 'discussed', label: 'Обсуждаемые', icon: MessageSquare },
  { value: 'liked', label: 'Лайки', icon: Heart }
]

export function CommunityPostsFeed({ 
  communityId, 
  communityName, 
  userImage, 
  userName,
  isMember 
}: CommunityPostsFeedProps) {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [sortBy, setSortBy] = useState('recent')
  const [hasMore, setHasMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)

  const { toast } = useToast()

  const loadPosts = useCallback(async (refresh = false) => {
    try {
      if (refresh) setRefreshing(true)
      else setLoading(true)

      const params = new URLSearchParams({
        limit: '10',
        offset: refresh ? '0' : posts.length.toString()
      })

      const response = await fetch(`/api/communities/${communityId}/posts?${params}`)
      
      if (response.ok) {
        const result = await response.json()
        
        if (refresh) {
          setPosts(result.posts)
        } else {
          setPosts(prev => [...prev, ...result.posts])
        }
        
        setHasMore(result.hasMore)
      } else {
        const error = await response.json()
        toast({
          title: "Ошибка",
          description: error.error || "Не удалось загрузить посты",
          variant: "error"
        })
      }
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить посты",
        variant: "error"
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
      setLoadingMore(false)
    }
  }, [communityId, posts.length, toast])

  useEffect(() => {
    loadPosts(true)
  }, [communityId])

  const handlePostCreated = (newPost: Post) => {
    setPosts(prev => [newPost, ...prev])
  }

  const handlePostUpdate = (postId: string, updates: Partial<Post>) => {
    setPosts(prev => prev.map(post => 
      post.id === postId ? { ...post, ...updates } : post
    ))
  }

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      setLoadingMore(true)
      loadPosts(false)
    }
  }

  const handleRefresh = () => {
    loadPosts(true)
  }

  if (loading && posts.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Загружаем посты...</span>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Форма создания поста (только для участников) */}
      {isMember && (
        <CreatePost
          communityId={communityId}
          communityName={communityName}
          userImage={userImage}
          userName={userName}
          onPostCreated={handlePostCreated}
        />
      )}

      {/* Заголовок и фильтры */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-semibold">Лента постов</h3>
          <p className="text-sm text-muted-foreground">
            {posts.length} {posts.length === 1 ? 'пост' : posts.length < 5 ? 'поста' : 'постов'}
          </p>
        </div>

        <div className="flex gap-2">
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map(option => {
                const Icon = option.icon
                return (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center gap-2">
                      <Icon className="h-3 w-3" />
                      {option.label}
                    </div>
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCcw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Список постов */}
      {posts.length > 0 ? (
        <div className="space-y-4">
          {posts.map((post) => (
            <CommunityPost
              key={post.id}
              post={post}
              communityId={communityId}
              onUpdate={(updates) => handlePostUpdate(post.id, updates)}
            />
          ))}

          {/* Кнопка "Загрузить еще" */}
          {hasMore && (
            <div className="flex justify-center pt-4">
              <Button
                variant="outline"
                onClick={handleLoadMore}
                disabled={loadingMore}
              >
                {loadingMore ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Загружаем...
                  </>
                ) : (
                  'Загрузить еще'
                )}
              </Button>
            </div>
          )}

          {!hasMore && posts.length > 5 && (
            <div className="text-center py-8 text-muted-foreground">
              <p>Вы просмотрели все посты в этом сообществе</p>
              <Button variant="ghost" size="sm" onClick={handleRefresh} className="mt-2">
                <RefreshCcw className="h-4 w-4 mr-2" />
                Обновить ленту
              </Button>
            </div>
          )}
        </div>
      ) : (
        /* Пустое состояние */
        <div className="text-center py-12">
          <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-medium mb-2">Пока нет постов</h3>
          <p className="text-muted-foreground mb-4">
            {isMember 
              ? 'Станьте первым, кто поделится чем-то интересным!'
              : 'Присоединитесь к сообществу, чтобы создавать посты'
            }
          </p>
          {isMember && (
            <Button onClick={() => {
              // Прокрутка к форме создания поста
              window.scrollTo({ top: 0, behavior: 'smooth' })
            }}>
              Создать первый пост
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
