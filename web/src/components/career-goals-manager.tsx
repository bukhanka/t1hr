"use client"

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Target, 
  TrendingUp, 
  Plus, 
  Star, 
  Map,
  BookOpen,
  Users,
  Briefcase,
  Award,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Clock,
  Zap
} from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface CareerGoal {
  id: string
  goalType: string
  target: string
  priority: number
  createdAt: Date | string
}

interface RoadmapStep {
  id: string
  title: string
  description: string
  type: 'skill' | 'course' | 'project' | 'experience'
  status: 'pending' | 'in_progress' | 'completed'
  estimatedTime: string
  xpReward?: number
  resource?: {
    id: string
    name: string
    link?: string
  }
}

interface CareerRoadmap {
  goalTarget: string
  estimatedTime: string
  progressPercentage: number
  steps: RoadmapStep[]
  recommendations: {
    courses: any[]
    projects: any[]
    mentors: any[]
  }
}

interface CareerGoalsManagerProps {
  careerGoals: CareerGoal[]
  userSkills: any[]
  onGoalsUpdate: () => void
}

// Предопределенные карьерные цели
const CAREER_TARGETS = [
  {
    value: 'Senior Developer',
    label: 'Senior Developer',
    icon: '🚀',
    description: 'Техническое лидерство и экспертиза'
  },
  {
    value: 'Team Lead',
    label: 'Team Lead',
    icon: '👨‍💼',
    description: 'Управление командой разработчиков'
  },
  {
    value: 'Tech Lead',
    label: 'Tech Lead',
    icon: '⚡',
    description: 'Техническое руководство проектами'
  },
  {
    value: 'Solution Architect',
    label: 'Solution Architect',
    icon: '🏗️',
    description: 'Архитектурные решения и дизайн систем'
  },
  {
    value: 'Product Manager',
    label: 'Product Manager',
    icon: '📊',
    description: 'Управление продуктом и стратегия'
  },
  {
    value: 'DevOps Engineer',
    label: 'DevOps Engineer',
    icon: '🔧',
    description: 'Инфраструктура и автоматизация'
  },
  {
    value: 'Data Scientist',
    label: 'Data Scientist',
    icon: '📈',
    description: 'Анализ данных и машинное обучение'
  },
  {
    value: 'UX/UI Designer',
    label: 'UX/UI Designer',
    icon: '🎨',
    description: 'Дизайн пользовательского опыта'
  }
]

const GOAL_TYPES = [
  { value: 'vertical_growth', label: 'Вертикальный рост', description: 'Повышение в текущей области' },
  { value: 'horizontal_switch', label: 'Горизонтальный переход', description: 'Смена специализации' },
  { value: 'skill_mastery', label: 'Мастерство в навыках', description: 'Углубление экспертизы' },
  { value: 'leadership', label: 'Развитие лидерства', description: 'Управленческие навыки' }
]

export function CareerGoalsManager({ careerGoals, userSkills, onGoalsUpdate }: CareerGoalsManagerProps) {
  const [activeTab, setActiveTab] = useState('my-goals')
  const [loading, setLoading] = useState(false)
  const [roadmaps, setRoadmaps] = useState<{ [key: string]: CareerRoadmap }>({})
  const [selectedGoalType, setSelectedGoalType] = useState('')
  const [selectedTarget, setSelectedTarget] = useState('')
  const [priority, setPriority] = useState(3)
  
  const { toast } = useToast()

  useEffect(() => {
    // Загружаем роадмапы для существующих целей
    careerGoals.forEach(goal => {
      loadRoadmapForGoal(goal)
    })
  }, [careerGoals])

  const loadRoadmapForGoal = async (goal: CareerGoal) => {
    try {
      const response = await fetch(`/api/career/roadmap?target=${encodeURIComponent(goal.target)}`)
      if (response.ok) {
        const roadmap = await response.json()
        setRoadmaps(prev => ({
          ...prev,
          [goal.id]: roadmap
        }))
      }
    } catch (error) {
      console.error('Ошибка загрузки роадмапа:', error)
    }
  }

  const addCareerGoal = async () => {
    if (!selectedGoalType || !selectedTarget) {
      toast({
        title: "Ошибка",
        description: "Выберите тип цели и желаемую позицию",
        variant: "error"
      })
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/career/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goalType: selectedGoalType,
          target: selectedTarget,
          priority
        })
      })

      if (response.ok) {
        const result = await response.json()
        toast({
          title: "🎯 Цель добавлена!",
          description: `Карьерная цель "${selectedTarget}" установлена. Генерируем персональный роадмап...`,
          variant: "success"
        })
        
        onGoalsUpdate()
        setSelectedGoalType('')
        setSelectedTarget('')
        setPriority(3)
        
        // Переключаемся на вкладку с целями
        setActiveTab('my-goals')
        
      } else {
        const error = await response.json()
        toast({
          title: "Ошибка",
          description: error.error || 'Не удалось добавить цель',
          variant: "error"
        })
      }
    } catch (error) {
      toast({
        title: "Ошибка",
        description: 'Произошла ошибка при добавлении цели',
        variant: "error"
      })
    } finally {
      setLoading(false)
    }
  }

  const updateStepStatus = async (goalId: string, stepId: string, status: 'pending' | 'in_progress' | 'completed') => {
    try {
      const response = await fetch(`/api/career/roadmap/steps/${stepId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })

      if (response.ok) {
        // Обновляем локальное состояние
        setRoadmaps(prev => ({
          ...prev,
          [goalId]: {
            ...prev[goalId],
            steps: prev[goalId]?.steps.map(step => 
              step.id === stepId ? { ...step, status } : step
            ) || []
          }
        }))

        if (status === 'completed') {
          toast({
            title: "🎉 Шаг выполнен!",
            description: "Вы продвигаетесь к своей карьерной цели",
            variant: "success"
          })
        }
      }
    } catch (error) {
      console.error('Ошибка обновления статуса шага:', error)
    }
  }

  const getStepIcon = (type: string, status: string) => {
    const isCompleted = status === 'completed'
    const isInProgress = status === 'in_progress'
    
    if (isCompleted) return <CheckCircle2 className="w-4 h-4 text-green-600" />
    if (isInProgress) return <Clock className="w-4 h-4 text-blue-600 animate-pulse" />

    switch (type) {
      case 'skill': return <Zap className="w-4 h-4 text-purple-600" />
      case 'course': return <BookOpen className="w-4 h-4 text-blue-600" />
      case 'project': return <Briefcase className="w-4 h-4 text-orange-600" />
      case 'experience': return <Users className="w-4 h-4 text-green-600" />
      default: return <Target className="w-4 h-4 text-gray-600" />
    }
  }

  const getProgressColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600'
    if (percentage >= 50) return 'text-blue-600'
    if (percentage >= 25) return 'text-orange-600'
    return 'text-gray-600'
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="my-goals">
            <Target className="w-4 h-4 mr-2" />
            Мои цели ({careerGoals.length})
          </TabsTrigger>
          <TabsTrigger value="roadmaps">
            <Map className="w-4 h-4 mr-2" />
            Роадмапы развития
          </TabsTrigger>
          <TabsTrigger value="add-goal">
            <Plus className="w-4 h-4 mr-2" />
            Добавить цель
          </TabsTrigger>
        </TabsList>

        {/* Мои цели */}
        <TabsContent value="my-goals" className="space-y-4">
          {careerGoals.length === 0 ? (
            <Card className="text-center py-8">
              <CardContent>
                <Target className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Карьерные цели не определены</h3>
                <p className="text-muted-foreground mb-4">
                  Поставьте карьерную цель и получите персональный роадмап развития с конкретными шагами
                </p>
                <Button onClick={() => setActiveTab('add-goal')}>
                  <Plus className="w-4 h-4 mr-2" />
                  Поставить первую цель
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {careerGoals.map((goal) => (
                <Card key={goal.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="text-2xl">
                          {CAREER_TARGETS.find(t => t.value === goal.target)?.icon || '🎯'}
                        </div>
                        <div>
                          <CardTitle className="text-lg">{goal.target}</CardTitle>
                          <CardDescription>
                            {GOAL_TYPES.find(t => t.value === goal.goalType)?.label} • 
                            Приоритет: {goal.priority}/5
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">
                          {roadmaps[goal.id] ? `${roadmaps[goal.id].progressPercentage}% готово` : 'Загружаем...'}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setActiveTab('roadmaps')}
                        >
                          <Map className="w-4 h-4 mr-1" />
                          Роадмап
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  
                  {roadmaps[goal.id] && (
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-muted-foreground">Прогресс развития</span>
                          <span className={`font-medium ${getProgressColor(roadmaps[goal.id].progressPercentage)}`}>
                            {roadmaps[goal.id].progressPercentage}%
                          </span>
                        </div>
                        <Progress 
                          value={roadmaps[goal.id].progressPercentage} 
                          className="h-2"
                        />
                        <div className="flex justify-between items-center text-xs text-muted-foreground">
                          <span>Планируемое время: {roadmaps[goal.id].estimatedTime}</span>
                          <span>
                            {roadmaps[goal.id].steps.filter(s => s.status === 'completed').length} из {roadmaps[goal.id].steps.length} шагов
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Роадмапы развития */}
        <TabsContent value="roadmaps" className="space-y-4">
          {Object.keys(roadmaps).length === 0 ? (
            <Card className="text-center py-8">
              <CardContent>
                <Map className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Роадмапы не найдены</h3>
                <p className="text-muted-foreground mb-4">
                  Сначала добавьте карьерные цели для генерации персональных роадмапов
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {careerGoals.map((goal) => {
                const roadmap = roadmaps[goal.id]
                if (!roadmap) return null

                return (
                  <Card key={goal.id}>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <span className="text-2xl">
                          {CAREER_TARGETS.find(t => t.value === goal.target)?.icon || '🎯'}
                        </span>
                        <span>Роадмап: {goal.target}</span>
                      </CardTitle>
                      <CardDescription>
                        Персональный план развития на основе ваших текущих навыков
                      </CardDescription>
                    </CardHeader>
                    
                    <CardContent className="space-y-6">
                      {/* Прогресс */}
                      <div className="grid md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                        <div className="text-center">
                          <div className={`text-2xl font-bold ${getProgressColor(roadmap.progressPercentage)}`}>
                            {roadmap.progressPercentage}%
                          </div>
                          <div className="text-sm text-muted-foreground">Готовность</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">
                            {roadmap.estimatedTime}
                          </div>
                          <div className="text-sm text-muted-foreground">Планируемое время</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">
                            {roadmap.steps.filter(s => s.status === 'completed').length}/{roadmap.steps.length}
                          </div>
                          <div className="text-sm text-muted-foreground">Выполнено шагов</div>
                        </div>
                      </div>

                      {/* Шаги роадмапа */}
                      <div className="space-y-4">
                        <h4 className="font-semibold flex items-center">
                          <Sparkles className="w-4 h-4 mr-2" />
                          План развития
                        </h4>
                        
                        <div className="space-y-3">
                          {roadmap.steps.map((step, index) => (
                            <div 
                              key={step.id}
                              className={`p-4 border rounded-lg transition-all ${
                                step.status === 'completed' ? 'bg-green-50 border-green-200' :
                                step.status === 'in_progress' ? 'bg-blue-50 border-blue-200' :
                                'bg-white border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              <div className="flex items-start space-x-3">
                                <div className="flex-shrink-0 mt-1">
                                  {getStepIcon(step.type, step.status)}
                                </div>
                                
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between">
                                    <h5 className="font-medium text-gray-900">
                                      {index + 1}. {step.title}
                                    </h5>
                                    <div className="flex items-center space-x-2">
                                      {step.xpReward && (
                                        <Badge variant="secondary">
                                          +{step.xpReward} XP
                                        </Badge>
                                      )}
                                      <Badge variant="outline" className="text-xs">
                                        {step.estimatedTime}
                                      </Badge>
                                    </div>
                                  </div>
                                  
                                  <p className="mt-1 text-sm text-gray-600">
                                    {step.description}
                                  </p>
                                  
                                  {step.resource && (
                                    <div className="mt-2 flex items-center space-x-2">
                                      <ArrowRight className="w-3 h-3 text-gray-400" />
                                      <span className="text-sm text-blue-600">
                                        {step.resource.name}
                                      </span>
                                    </div>
                                  )}
                                  
                                  <div className="mt-3 flex gap-2">
                                    {step.status === 'pending' && (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => updateStepStatus(goal.id, step.id, 'in_progress')}
                                      >
                                        Начать
                                      </Button>
                                    )}
                                    {step.status === 'in_progress' && (
                                      <Button
                                        size="sm"
                                        onClick={() => updateStepStatus(goal.id, step.id, 'completed')}
                                      >
                                        Завершить
                                      </Button>
                                    )}
                                    {step.resource?.link && (
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        asChild
                                      >
                                        <a href={step.resource.link} target="_blank" rel="noopener noreferrer">
                                          Перейти к ресурсу
                                        </a>
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Рекомендации */}
                      <div className="grid md:grid-cols-3 gap-4 pt-4 border-t">
                        <div>
                          <h5 className="font-medium mb-2 flex items-center">
                            <BookOpen className="w-4 h-4 mr-1" />
                            Курсы ({roadmap.recommendations.courses.length})
                          </h5>
                          <div className="space-y-1">
                            {roadmap.recommendations.courses.slice(0, 2).map((course: any) => (
                              <div key={course.id} className="text-sm text-blue-600 hover:underline cursor-pointer">
                                {course.title}
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        <div>
                          <h5 className="font-medium mb-2 flex items-center">
                            <Briefcase className="w-4 h-4 mr-1" />
                            Проекты ({roadmap.recommendations.projects.length})
                          </h5>
                          <div className="space-y-1">
                            {roadmap.recommendations.projects.slice(0, 2).map((project: any) => (
                              <div key={project.id} className="text-sm text-orange-600 hover:underline cursor-pointer">
                                {project.name}
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        <div>
                          <h5 className="font-medium mb-2 flex items-center">
                            <Users className="w-4 h-4 mr-1" />
                            Менторы ({roadmap.recommendations.mentors.length})
                          </h5>
                          <div className="space-y-1">
                            {roadmap.recommendations.mentors.slice(0, 2).map((mentor: any) => (
                              <div key={mentor.id} className="text-sm text-green-600 hover:underline cursor-pointer">
                                {mentor.title}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>

        {/* Добавить цель */}
        <TabsContent value="add-goal" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Поставить карьерную цель</CardTitle>
              <CardDescription>
                Выберите желаемую позицию и получите персональный роадмап развития с конкретными шагами
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <Label className="text-sm font-medium mb-2 block">Тип карьерной цели</Label>
                  <Select value={selectedGoalType} onValueChange={setSelectedGoalType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите тип развития" />
                    </SelectTrigger>
                    <SelectContent>
                      {GOAL_TYPES.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          <div>
                            <div className="font-medium">{type.label}</div>
                            <div className="text-xs text-muted-foreground">{type.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-sm font-medium mb-2 block">Приоритет (1-5)</Label>
                  <Select value={priority.toString()} onValueChange={(value) => setPriority(parseInt(value))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5].map(p => (
                        <SelectItem key={p} value={p.toString()}>
                          {p} - {p === 1 ? 'Низкий' : p === 5 ? 'Критический' : p === 3 ? 'Средний' : p === 2 ? 'Ниже среднего' : 'Высокий'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium mb-2 block">Целевая позиция</Label>
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {CAREER_TARGETS.map(target => (
                    <Card
                      key={target.value}
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        selectedTarget === target.value ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:bg-gray-50'
                      }`}
                      onClick={() => setSelectedTarget(target.value)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl">{target.icon}</span>
                          <div>
                            <h4 className="font-medium">{target.label}</h4>
                            <p className="text-xs text-muted-foreground">
                              {target.description}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={addCareerGoal}
                  disabled={loading || !selectedGoalType || !selectedTarget}
                  className="flex-1"
                >
                  {loading ? 'Создаем роадмап...' : (
                    <>
                      <Target className="w-4 h-4 mr-2" />
                      Поставить цель и создать роадмап
                    </>
                  )}
                </Button>
              </div>

              {selectedTarget && (
                <Card className="bg-blue-50">
                  <CardContent className="pt-4">
                    <div className="flex items-start space-x-3">
                      <Sparkles className="w-5 h-5 text-blue-600 mt-1" />
                      <div>
                        <h4 className="font-medium text-blue-900">
                          Что произойдет после создания цели?
                        </h4>
                        <ul className="mt-2 text-sm text-blue-800 space-y-1">
                          <li>• ИИ проанализирует ваши текущие навыки и опыт</li>
                          <li>• Создаст персональный роадмап с конкретными шагами</li>
                          <li>• Подберет релевантные курсы, проекты и менторов</li>
                          <li>• Рассчитает примерное время достижения цели</li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
