"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { 
  Search,
  Filter,
  CheckCircle,
  Star,
  MessageCircle,
  Bookmark,
  Loader2,
  AlertCircle,
  Users
} from 'lucide-react'

interface TalentSearchResult {
  id: string
  name: string
  jobTitle: string
  department: string
  profileStrength: number
  level: number
  xp: number
  matchPercentage: number
  semanticSimilarity: number
  skills: Array<{
    name: string
    level: number
    isVerified: boolean
  }>
  recentProjects: Array<{
    name: string
    role: string
    achievements: string
  }>
  availability: string
}

interface SearchFilters {
  skills: string[]
  departments: string[]
  levels: string[]
  availability: 'available' | 'busy' | 'any'
}

export function TalentSearch() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<TalentSearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isInitializing, setIsInitializing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [embeddingStatus, setEmbeddingStatus] = useState<{
    profilesWithEmbeddings: number
    totalProfiles: number
    coveragePercentage: number
    readyForSemanticSearch: boolean
  } | null>(null)

  const [filters, setFilters] = useState<SearchFilters>({
    skills: [],
    departments: [],
    levels: [],
    availability: 'any'
  })

  // Проверяем статус эмбеддингов при загрузке
  useEffect(() => {
    checkEmbeddingStatus()
  }, [])

  const checkEmbeddingStatus = async () => {
    try {
      const response = await fetch('/api/admin/init-embeddings')
      if (response.ok) {
        const status = await response.json()
        setEmbeddingStatus(status)
      }
    } catch (error) {
      console.error('Ошибка при проверке статуса эмбеддингов:', error)
    }
  }

  const initializeEmbeddings = async () => {
    setIsInitializing(true)
    try {
      const response = await fetch('/api/admin/init-embeddings', {
        method: 'POST'
      })

      if (response.ok) {
        alert('Процесс инициализации эмбеддингов запущен! Это может занять несколько минут.')
        // Проверяем статус каждые 10 секунд
        const interval = setInterval(async () => {
          await checkEmbeddingStatus()
          if (embeddingStatus && embeddingStatus.coveragePercentage >= 80) {
            clearInterval(interval)
            setIsInitializing(false)
          }
        }, 10000)
      } else {
        const error = await response.json()
        setError(error.error)
      }
    } catch (error) {
      setError('Ошибка при инициализации эмбеддингов')
      console.error(error)
    } finally {
      setIsInitializing(false)
    }
  }

  const searchTalents = async () => {
    if (!query.trim()) return

    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/search/talents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: query.trim(),
          filters: filters
        })
      })

      if (response.ok) {
        const data = await response.json()
        setResults(data.results)
      } else {
        const error = await response.json()
        setError(error.error)
      }
    } catch (error) {
      setError('Ошибка при выполнении поиска')
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      searchTalents()
    }
  }

  const getAvailabilityColor = (availability: string) => {
    switch (availability) {
      case 'available': return 'text-green-600'
      case 'busy': return 'text-orange-600'
      default: return 'text-gray-600'
    }
  }

  const getAvailabilityIcon = (availability: string) => {
    switch (availability) {
      case 'available': return CheckCircle
      case 'busy': return Star
      default: return AlertCircle
    }
  }

  const getMatchColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-green-100 text-green-800'
    if (percentage >= 60) return 'bg-yellow-100 text-yellow-800'
    return 'bg-blue-100 text-blue-800'
  }

  return (
    <div className="space-y-6">
      {/* Статус эмбеддингов */}
      {embeddingStatus && !embeddingStatus.readyForSemanticSearch && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-orange-900">
                  Инициализация векторного поиска
                </h3>
                <p className="text-sm text-orange-700 mt-1">
                  Эмбеддинги созданы для {embeddingStatus.profilesWithEmbeddings} из {embeddingStatus.totalProfiles} профилей 
                  ({embeddingStatus.coveragePercentage}%). Для полной функциональности рекомендуется инициализировать все профили.
                </p>
              </div>
              <Button 
                onClick={initializeEmbeddings}
                disabled={isInitializing}
                size="sm"
              >
                {isInitializing ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                {isInitializing ? 'Инициализация...' : 'Инициализировать'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Поисковая строка */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Умный поиск талантов</CardTitle>
          <p className="text-sm text-muted-foreground">
            {embeddingStatus?.readyForSemanticSearch 
              ? "🤖 Семантический поиск активен - используйте естественный язык"
              : "📝 Обычный поиск - будет заменен на семантический после инициализации"
            }
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex space-x-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Например: Нужен Senior Java разработчик с опытом в финтехе, который работал с Kafka"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="pl-10"
                />
              </div>
              <Button 
                onClick={searchTalents} 
                disabled={isLoading || !query.trim()}
              >
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Search className="mr-2 h-4 w-4" />
                )}
                Найти
              </Button>
            </div>

            {/* Быстрые запросы */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setQuery("Senior Backend Developer с опытом микросервисов")
                  setTimeout(searchTalents, 100)
                }}
              >
                Backend Senior
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setQuery("Frontend разработчик React TypeScript")
                  setTimeout(searchTalents, 100)
                }}
              >
                Frontend React
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setQuery("DevOps инженер с опытом Docker Kubernetes")
                  setTimeout(searchTalents, 100)
                }}
              >
                DevOps
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setQuery("Data Scientist Python машинное обучение")
                  setTimeout(searchTalents, 100)
                }}
              >
                Data Science
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ошибка */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <p className="text-red-900">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Результаты поиска */}
      {results.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">
              Найденные кандидаты <span className="text-muted-foreground">({results.length})</span>
            </h2>
          </div>

          <div className="grid gap-4">
            {results.map((candidate) => {
              const AvailabilityIcon = getAvailabilityIcon(candidate.availability)
              
              return (
                <Card key={candidate.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex space-x-4 flex-1">
                        <Avatar className="h-12 w-12">
                          <AvatarFallback>
                            {candidate.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h3 className="font-semibold">{candidate.name}</h3>
                            <Badge className={getMatchColor(candidate.matchPercentage)}>
                              {candidate.matchPercentage}% соответствие
                            </Badge>
                            {candidate.semanticSimilarity && (
                              <Badge variant="outline" className="text-xs">
                                Семантика: {Math.round(candidate.semanticSimilarity * 100)}%
                              </Badge>
                            )}
                          </div>
                          <p className="text-muted-foreground text-sm mb-2">
                            {candidate.jobTitle} • {candidate.department} • Уровень {candidate.level}
                          </p>
                          <div className="flex flex-wrap gap-1 mb-3">
                            {candidate.skills.slice(0, 5).map((skill, idx) => (
                              <Badge key={idx} variant={skill.isVerified ? "default" : "secondary"} className="text-xs">
                                {skill.name}
                                {skill.isVerified && " ✓"}
                              </Badge>
                            ))}
                            {candidate.skills.length > 5 && (
                              <Badge variant="outline" className="text-xs">
                                +{candidate.skills.length - 5} еще
                              </Badge>
                            )}
                          </div>
                          {candidate.recentProjects.length > 0 && (
                            <div className="text-sm text-gray-700 mb-2">
                              <strong>Недавние проекты:</strong>
                              {candidate.recentProjects.slice(0, 2).map((project, idx) => (
                                <div key={idx} className="ml-2">
                                  • {project.name} ({project.role})
                                </div>
                              ))}
                            </div>
                          )}
                          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                            <div className="flex items-center space-x-1">
                              <AvailabilityIcon className={`h-4 w-4 ${getAvailabilityColor(candidate.availability)}`} />
                              <span>
                                {candidate.availability === 'available' ? 'Доступен для новых задач' :
                                 candidate.availability === 'busy' ? 'Занят на проекте' :
                                 'Статус неизвестен'}
                              </span>
                            </div>
                            <span>Сила профиля: {candidate.profileStrength}%</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col space-y-2 ml-4">
                        <Button size="sm">
                          <Bookmark className="mr-2 h-4 w-4" />
                          В шорт-лист
                        </Button>
                        <Button size="sm" variant="outline">
                          <Users className="mr-2 h-4 w-4" />
                          Профиль
                        </Button>
                        <Button size="sm" variant="outline">
                          <MessageCircle className="mr-2 h-4 w-4" />
                          Связаться
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {/* Пустое состояние */}
      {!isLoading && results.length === 0 && query && (
        <Card>
          <CardContent className="p-8 text-center">
            <Search className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Кандидаты не найдены
            </h3>
            <p className="text-gray-600 mb-4">
              Попробуйте изменить поисковый запрос или параметры фильтрации
            </p>
            <Button variant="outline" onClick={() => setQuery('')}>
              Очистить поиск
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
