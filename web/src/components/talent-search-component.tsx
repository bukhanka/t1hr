'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { 
  Search, 
  Filter, 
  Star,
  MapPin,
  Briefcase,
  Award,
  TrendingUp,
  Eye,
  MessageSquare
} from 'lucide-react'

interface TalentSearchResult {
  id: string
  userId: string
  name: string
  avatar?: string
  jobTitle: string
  department: string
  profileStrength: number
  level: number
  xp: number
  relevanceScore: number
  matchReason: string
  skills: Array<{
    name: string
    level: number
    isVerified: boolean
  }>
  recentProjects: Array<{
    name: string
    role: string
  }>
  badges: Array<{
    name: string
  }>
  availability?: 'available' | 'busy' | 'unknown'
}

interface SearchFilters {
  skills: string[]
  departments: string[]
  jobTitles: string[]
  levels: string[]
}

export function TalentSearchComponent() {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<TalentSearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [availableFilters, setAvailableFilters] = useState<SearchFilters>({
    skills: [],
    departments: [],
    jobTitles: [],
    levels: []
  })
  const [activeFilters, setActiveFilters] = useState({
    skills: [] as string[],
    departments: [] as string[],
    levels: [] as string[],
    availability: 'any' as 'available' | 'busy' | 'any'
  })
  const [positionType, setPositionType] = useState<'TECHNICAL_ROLE' | 'MANAGEMENT_ROLE' | 'INNOVATIVE_PROJECT'>('TECHNICAL_ROLE')
  const [showFilters, setShowFilters] = useState(false)

  // Загружаем доступные фильтры при инициализации
  useEffect(() => {
    fetchAvailableFilters()
  }, [])

  const fetchAvailableFilters = async () => {
    try {
      const response = await fetch('/api/search/talents')
      if (response.ok) {
        const data = await response.json()
        setAvailableFilters(data.filters || {
          skills: [],
          departments: [],
          jobTitles: [],
          levels: ['Junior', 'Middle', 'Senior', 'Expert']
        })
      }
    } catch (error) {
      console.error('Ошибка при загрузке фильтров:', error)
    }
  }

  const performSearch = async () => {
    if (!searchQuery.trim()) return

    setIsSearching(true)
    try {
      const response = await fetch('/api/search/talents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query: searchQuery,
          positionType,
          filters: {
            skills: activeFilters.skills,
            departments: activeFilters.departments,
            levels: activeFilters.levels,
            availability: activeFilters.availability
          }
        })
      })

      if (response.ok) {
        const data = await response.json()
        setSearchResults(data.results || [])
      } else {
        console.error('Ошибка поиска:', response.statusText)
        setSearchResults([])
      }
    } catch (error) {
      console.error('Ошибка при поиске талантов:', error)
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      performSearch()
    }
  }

  const addFilter = (type: keyof typeof activeFilters, value: string) => {
    if (type === 'availability') {
      setActiveFilters(prev => ({
        ...prev,
        [type]: value as 'available' | 'busy' | 'any'
      }))
    } else {
      setActiveFilters(prev => ({
        ...prev,
        [type]: [...(prev[type] as string[]), value]
      }))
    }
  }

  const removeFilter = (type: keyof typeof activeFilters, value: string) => {
    if (type !== 'availability') {
      setActiveFilters(prev => ({
        ...prev,
        [type]: (prev[type] as string[]).filter(item => item !== value)
      }))
    }
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase()
  }

  const getAvailabilityColor = (availability: string) => {
    switch (availability) {
      case 'available': return 'bg-green-100 text-green-800'
      case 'busy': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getAvailabilityText = (availability: string) => {
    switch (availability) {
      case 'available': return 'Доступен'
      case 'busy': return 'Занят'
      default: return 'Неизвестно'
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5 text-blue-600" />
          Умный Поиск Талантов
        </CardTitle>
        <CardDescription>
          Найдите подходящих кандидатов для проектов и позиций используя ИИ-ранжирование
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Основной поиск */}
        <div className="flex gap-2">
          <div className="flex-1">
            <Input
              placeholder="Опишите искомого кандидата: 'Senior React разработчик с опытом TypeScript'"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              className="text-base"
            />
          </div>
          <Select value={positionType} onValueChange={(value: any) => setPositionType(value)}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TECHNICAL_ROLE">Техническая роль</SelectItem>
              <SelectItem value="MANAGEMENT_ROLE">Менеджерская роль</SelectItem>
              <SelectItem value="INNOVATIVE_PROJECT">Инновационный проект</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={performSearch} disabled={isSearching || !searchQuery.trim()}>
            {isSearching ? 'Поиск...' : 'Найти'}
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4" />
          </Button>
        </div>

        {/* Фильтры */}
        {showFilters && (
          <Card className="p-4">
            <div className="space-y-3">
              <h4 className="font-semibold">Фильтры</h4>
              
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {/* Навыки */}
                <div>
                  <label className="text-sm font-medium">Навыки</label>
                  <Select onValueChange={(value) => addFilter('skills', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Выбрать навык" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableFilters.skills.map((skill: any) => (
                        <SelectItem key={skill.name} value={skill.name}>
                          {skill.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Отделы */}
                <div>
                  <label className="text-sm font-medium">Отделы</label>
                  <Select onValueChange={(value) => addFilter('departments', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Выбрать отдел" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableFilters.departments.map((dept: string) => (
                        <SelectItem key={dept} value={dept}>
                          {dept}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Уровни */}
                <div>
                  <label className="text-sm font-medium">Уровень</label>
                  <Select onValueChange={(value) => addFilter('levels', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Выбрать уровень" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableFilters.levels.map((level: string) => (
                        <SelectItem key={level} value={level}>
                          {level}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Доступность */}
                <div>
                  <label className="text-sm font-medium">Доступность</label>
                  <Select value={activeFilters.availability} onValueChange={(value: any) => addFilter('availability', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Любая</SelectItem>
                      <SelectItem value="available">Доступен</SelectItem>
                      <SelectItem value="busy">Занят</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Активные фильтры */}
              <div className="flex flex-wrap gap-2">
                {Object.entries(activeFilters).map(([type, values]) => {
                  if (type === 'availability' && values !== 'any') {
                    return (
                      <Badge key={type} variant="secondary" className="cursor-pointer">
                        Доступность: {getAvailabilityText(values as string)}
                        <button
                          onClick={() => setActiveFilters(prev => ({ ...prev, availability: 'any' }))}
                          className="ml-2 hover:text-red-600"
                        >
                          ×
                        </button>
                      </Badge>
                    )
                  }
                  
                  return (values as string[]).map((value: string) => (
                    <Badge key={`${type}-${value}`} variant="secondary" className="cursor-pointer">
                      {value}
                      <button
                        onClick={() => removeFilter(type as keyof typeof activeFilters, value)}
                        className="ml-2 hover:text-red-600"
                      >
                        ×
                      </button>
                    </Badge>
                  ))
                })}
              </div>
            </div>
          </Card>
        )}

        {/* Результаты поиска */}
        {searchResults.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                Найдено: {searchResults.length} кандидатов
              </h3>
              <Badge variant="outline">
                Отсортировано по релевантности
              </Badge>
            </div>

            <div className="space-y-3">
              {searchResults.map((candidate) => (
                <Card key={candidate.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={candidate.avatar} />
                        <AvatarFallback>{getInitials(candidate.name)}</AvatarFallback>
                      </Avatar>

                      <div className="flex-1 space-y-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-semibold text-lg">{candidate.name}</h4>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Briefcase className="h-4 w-4" />
                              {candidate.jobTitle}
                              <MapPin className="h-4 w-4 ml-2" />
                              {candidate.department}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center gap-1">
                              <Star className="h-4 w-4 text-yellow-500 fill-current" />
                              <span className="font-semibold">{Math.round(candidate.relevanceScore * 100)}%</span>
                            </div>
                            <Badge 
                              className={getAvailabilityColor(candidate.availability || 'unknown')}
                            >
                              {getAvailabilityText(candidate.availability || 'unknown')}
                            </Badge>
                          </div>
                        </div>

                        <div className="bg-blue-50 p-3 rounded-lg">
                          <div className="flex items-start gap-2">
                            <TrendingUp className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-blue-800">
                              <strong>Почему подходит:</strong> {candidate.matchReason}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {/* Навыки */}
                          <div>
                            <h5 className="font-medium text-sm mb-2">Ключевые навыки</h5>
                            <div className="flex flex-wrap gap-1">
                              {candidate.skills.slice(0, 4).map((skill, idx) => (
                                <Badge
                                  key={idx}
                                  variant={skill.isVerified ? "default" : "secondary"}
                                  className="text-xs"
                                >
                                  {skill.name} {skill.level}/5
                                  {skill.isVerified && <Award className="h-3 w-3 ml-1" />}
                                </Badge>
                              ))}
                            </div>
                          </div>

                          {/* Проекты */}
                          <div>
                            <h5 className="font-medium text-sm mb-2">Недавние проекты</h5>
                            <div className="space-y-1">
                              {candidate.recentProjects.slice(0, 2).map((project, idx) => (
                                <div key={idx} className="text-xs">
                                  <span className="font-medium">{project.name}</span>
                                  <span className="text-gray-500"> • {project.role}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Статистика */}
                          <div>
                            <h5 className="font-medium text-sm mb-2">Профиль</h5>
                            <div className="space-y-1">
                              <div className="flex justify-between text-xs">
                                <span>Сила профиля</span>
                                <span>{candidate.profileStrength}%</span>
                              </div>
                              <Progress value={candidate.profileStrength} className="h-1" />
                              <div className="text-xs text-gray-500">
                                Уровень {candidate.level} • {candidate.xp} XP
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t">
                          <div className="flex gap-1">
                            {candidate.badges.slice(0, 3).map((badge, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                🏆 {badge.name}
                              </Badge>
                            ))}
                          </div>
                          
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4 mr-1" />
                              Профиль
                            </Button>
                            <Button size="sm">
                              <MessageSquare className="h-4 w-4 mr-1" />
                              Связаться
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Состояние "нет результатов" */}
        {!isSearching && searchQuery && searchResults.length === 0 && (
          <div className="text-center py-8">
            <div className="text-gray-400 mb-4">
              <Search className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-600 mb-2">
              Кандидаты не найдены
            </h3>
            <p className="text-gray-500">
              Попробуйте изменить запрос или настроить фильтры
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
