"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Trophy, 
  Medal, 
  Crown,
  Coins,
  Zap,
  RefreshCw,
  Loader2,
  TrendingUp,
  Star,
  Users
} from "lucide-react"

interface LeaderboardEntry {
  position: number
  profileId: string
  userId: string
  name: string
  score: number
  avatar?: string
  department?: string
  level?: number
  badge?: string
}

interface LeaderboardData {
  type: string
  period: string
  entries: LeaderboardEntry[]
  totalParticipants: number
  generatedAt: Date
  validUntil: Date
  currentUser?: LeaderboardEntry | null
}

interface LeaderboardConfig {
  type: string
  title: string
  description: string
  icon: string
  period: string
  updateFrequency: string
}

const LEADERBOARD_CATEGORIES = [
  {
    id: 'tcoins',
    name: 'T-Coins',
    icon: Coins,
    types: ['tcoins_weekly', 'tcoins_monthly', 'tcoins_alltime']
  },
  {
    id: 'xp',
    name: 'Опыт',
    icon: Zap,
    types: ['xp_weekly', 'xp_monthly']
  },
  {
    id: 'other',
    name: 'Прочее',
    icon: Star,
    types: ['profile_strength', 'activity_weekly']
  }
]

export function Leaderboard() {
  const [configs, setConfigs] = useState<LeaderboardConfig[]>([])
  const [activeData, setActiveData] = useState<LeaderboardData | null>(null)
  const [activeType, setActiveType] = useState<string>('tcoins_weekly')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    loadLeaderboardConfigs()
  }, [])

  useEffect(() => {
    if (activeType) {
      loadLeaderboardData(activeType)
    }
  }, [activeType])

  const loadLeaderboardConfigs = async () => {
    try {
      const response = await fetch('/api/leaderboards')
      if (response.ok) {
        const data = await response.json()
        setConfigs(data.leaderboards)
      }
    } catch (error) {
      console.error('Ошибка загрузки конфигурации лидербордов:', error)
    }
  }

  const loadLeaderboardData = async (type: string, forceRefresh = false) => {
    try {
      if (forceRefresh) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }

      const url = `/api/leaderboards/${type}${forceRefresh ? '?refresh=true' : ''}`
      const response = await fetch(url)
      
      if (response.ok) {
        const data = await response.json()
        setActiveData(data)
      }
    } catch (error) {
      console.error('Ошибка загрузки лидерборда:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = () => {
    if (activeType) {
      loadLeaderboardData(activeType, true)
    }
  }

  const getPositionIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Crown className="h-5 w-5 text-yellow-500" />
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />
      case 3:
        return <Medal className="h-5 w-5 text-amber-600" />
      default:
        return <span className="text-lg font-bold text-muted-foreground">#{position}</span>
    }
  }

  const formatScore = (score: number, type: string) => {
    if (type.includes('tcoins')) {
      return `${score.toLocaleString()} T-Coins`
    } else if (type.includes('xp')) {
      return `${score.toLocaleString()} XP`
    } else if (type === 'profile_strength') {
      return `${score}%`
    } else {
      return score.toString()
    }
  }

  const getScoreIcon = (type: string) => {
    if (type.includes('tcoins')) return <Coins className="h-4 w-4 text-yellow-600" />
    if (type.includes('xp')) return <Zap className="h-4 w-4 text-blue-600" />
    if (type === 'profile_strength') return <TrendingUp className="h-4 w-4 text-green-600" />
    return <Star className="h-4 w-4 text-purple-600" />
  }

  const activeConfig = configs.find(c => c.type === activeType)

  if (loading && !activeData) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Загружаем лидерборды...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Лидерборды</h2>
          <p className="text-gray-600">Соревнуйтесь с коллегами и отслеживайте свой прогресс</p>
        </div>
        
        <Button 
          variant="outline" 
          onClick={handleRefresh}
          disabled={refreshing}
        >
          {refreshing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          <span className="ml-2">Обновить</span>
        </Button>
      </div>

      {/* Табы по категориям */}
      <Tabs value={activeType} onValueChange={setActiveType}>
        <TabsList className="grid w-full grid-cols-3">
          {LEADERBOARD_CATEGORIES.map(category => {
            const Icon = category.icon
            return (
              <TabsTrigger key={category.id} value={category.types[0]} className="flex items-center gap-2">
                <Icon className="h-4 w-4" />
                {category.name}
              </TabsTrigger>
            )
          })}
        </TabsList>

        {LEADERBOARD_CATEGORIES.map(category => (
          <TabsContent key={category.id} value={category.types[0]} className="space-y-4">
            {/* Подтабы внутри категории */}
            <div className="flex flex-wrap gap-2">
              {category.types.map(type => {
                const config = configs.find(c => c.type === type)
                if (!config) return null
                
                return (
                  <Button
                    key={type}
                    variant={activeType === type ? "default" : "outline"}
                    size="sm"
                    onClick={() => setActiveType(type)}
                  >
                    {config.icon} {config.title}
                  </Button>
                )
              })}
            </div>

            {/* Данные лидерборда */}
            {activeData && activeType.startsWith(category.id === 'other' ? activeType.split('_')[0] : category.id) && (
              <LeaderboardTable 
                data={activeData}
                config={activeConfig}
                onRefresh={handleRefresh}
                refreshing={refreshing}
              />
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}

interface LeaderboardTableProps {
  data: LeaderboardData
  config?: LeaderboardConfig
  onRefresh: () => void
  refreshing: boolean
}

function LeaderboardTable({ data, config, onRefresh, refreshing }: LeaderboardTableProps) {
  const getPositionIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Crown className="h-5 w-5 text-yellow-500" />
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />
      case 3:
        return <Medal className="h-5 w-5 text-amber-600" />
      default:
        return <span className="text-lg font-bold text-muted-foreground">#{position}</span>
    }
  }

  const formatScore = (score: number) => {
    if (data.type.includes('tcoins')) {
      return `${score.toLocaleString()} T-Coins`
    } else if (data.type.includes('xp')) {
      return `${score.toLocaleString()} XP`
    } else if (data.type === 'profile_strength') {
      return `${score}%`
    } else {
      return score.toString()
    }
  }

  const getScoreIcon = () => {
    if (data.type.includes('tcoins')) return <Coins className="h-4 w-4 text-yellow-600" />
    if (data.type.includes('xp')) return <Zap className="h-4 w-4 text-blue-600" />
    if (data.type === 'profile_strength') return <TrendingUp className="h-4 w-4 text-green-600" />
    return <Star className="h-4 w-4 text-purple-600" />
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="flex items-center gap-2">
              {config?.icon} {config?.title}
              <Badge variant="outline" className="ml-2">
                <Users className="h-3 w-3 mr-1" />
                {data.totalParticipants}
              </Badge>
            </CardTitle>
            <CardDescription>{config?.description}</CardDescription>
          </div>
          
          {data.currentUser && (
            <div className="text-right">
              <div className="text-sm text-muted-foreground">Ваша позиция</div>
              <div className="flex items-center justify-end gap-2">
                <span className="font-bold text-lg">#{data.currentUser.position}</span>
                {getScoreIcon()}
                <span className="font-medium">{formatScore(data.currentUser.score)}</span>
              </div>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-3">
          {data.entries.slice(0, 20).map((entry) => (
            <div 
              key={entry.userId} 
              className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                data.currentUser?.userId === entry.userId ? 'bg-blue-50 border-2 border-blue-200' : 'bg-gray-50 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center space-x-4">
                <div className="flex items-center justify-center w-8">
                  {getPositionIcon(entry.position)}
                </div>
                
                <Avatar className="h-8 w-8">
                  <AvatarImage src={entry.avatar} alt={entry.name} />
                  <AvatarFallback>{entry.name[0]?.toUpperCase()}</AvatarFallback>
                </Avatar>
                
                <div>
                  <div className="font-medium">{entry.name}</div>
                  {entry.department && (
                    <div className="text-sm text-muted-foreground">{entry.department}</div>
                  )}
                </div>

                {entry.level && (
                  <Badge variant="secondary">
                    Lvl {entry.level}
                  </Badge>
                )}

                {entry.badge && (
                  <span className="text-lg">{entry.badge}</span>
                )}
              </div>

              <div className="flex items-center space-x-2">
                {getScoreIcon()}
                <span className="font-bold text-lg">
                  {formatScore(entry.score)}
                </span>
              </div>
            </div>
          ))}
        </div>

        {data.entries.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Trophy className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Пока нет участников в этом лидерборде</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
