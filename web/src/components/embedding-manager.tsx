"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { RefreshCw, Zap, CheckCircle, AlertCircle, Clock } from 'lucide-react'

interface EmbeddingStats {
  total: number
  withEmbeddings: number
  percentage: number
  ready: boolean
  status: 'not_started' | 'in_progress' | 'completed'
  lastUpdate: string | null
}

export function EmbeddingManager() {
  const [stats, setStats] = useState<EmbeddingStats | null>(null)
  const [isInitializing, setIsInitializing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/embeddings/init')
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Ошибка загрузки статистики эмбеддингов:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const initializeEmbeddings = async () => {
    setIsInitializing(true)
    try {
      const response = await fetch('/api/embeddings/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'init_missing' })
      })

      if (response.ok) {
        // Обновляем статистику каждые 5 секунд во время инициализации
        const interval = setInterval(fetchStats, 5000)
        
        // Останавливаем обновление через 2 минуты
        setTimeout(() => {
          clearInterval(interval)
          setIsInitializing(false)
        }, 120000)
      }
    } catch (error) {
      console.error('Ошибка инициализации эмбеддингов:', error)
      setIsInitializing(false)
    }
  }

  useEffect(() => {
    fetchStats()
    
    // Обновляем статистику каждые 30 секунд
    const interval = setInterval(fetchStats, 30000)
    return () => clearInterval(interval)
  }, [])

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 animate-spin" />
            Загрузка статистики эмбеддингов...
          </CardTitle>
        </CardHeader>
      </Card>
    )
  }

  if (!stats) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-red-600">Ошибка загрузки</CardTitle>
          <CardDescription>
            Не удалось загрузить статистику эмбеддингов
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const getStatusIcon = () => {
    switch (stats.status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'in_progress':
        return <Clock className="h-5 w-5 text-yellow-600" />
      default:
        return <AlertCircle className="h-5 w-5 text-gray-600" />
    }
  }

  const getStatusText = () => {
    switch (stats.status) {
      case 'completed':
        return 'Завершено'
      case 'in_progress':
        return 'В процессе'
      default:
        return 'Не начато'
    }
  }

  const getStatusColor = () => {
    switch (stats.status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Векторные эмбеддинги
          </span>
          <Badge className={getStatusColor()}>
            {getStatusIcon()}
            <span className="ml-1">{getStatusText()}</span>
          </Badge>
        </CardTitle>
        <CardDescription>
          Семантический поиск профилей через ИИ-эмбеддинги
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Покрытие эмбеддингами</span>
            <span className="font-medium">
              {stats.withEmbeddings} из {stats.total} ({stats.percentage}%)
            </span>
          </div>
          <Progress value={stats.percentage} className="h-2" />
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="font-medium text-gray-900">Всего профилей</div>
            <div className="text-gray-600">{stats.total}</div>
          </div>
          <div>
            <div className="font-medium text-gray-900">С эмбеддингами</div>
            <div className="text-gray-600">{stats.withEmbeddings}</div>
          </div>
        </div>

        {stats.lastUpdate && (
          <div className="text-xs text-gray-500">
            Последнее обновление: {new Date(stats.lastUpdate).toLocaleString('ru-RU')}
          </div>
        )}

        <div className="flex gap-2">
          <Button
            onClick={initializeEmbeddings}
            disabled={isInitializing || stats.status === 'completed'}
            className="flex items-center gap-2"
          >
            {isInitializing ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Zap className="h-4 w-4" />
            )}
            {isInitializing ? 'Инициализация...' : 'Запустить инициализацию'}
          </Button>
          
          <Button
            variant="outline"
            onClick={fetchStats}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Обновить
          </Button>
        </div>

        {stats.ready && (
          <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 p-3 rounded-lg">
            <CheckCircle className="h-4 w-4" />
            <span>
              Векторный поиск готов к использованию! 
              Семантический поиск талантов работает.
            </span>
          </div>
        )}

        {!stats.ready && stats.percentage > 0 && (
          <div className="flex items-center gap-2 text-sm text-yellow-700 bg-yellow-50 p-3 rounded-lg">
            <Clock className="h-4 w-4" />
            <span>
              Инициализация в процессе. Векторный поиск станет доступен при достижении 20% покрытия.
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
