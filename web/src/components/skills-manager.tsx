"use client"

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { 
  Plus, 
  Star, 
  CheckCircle2, 
  Target, 
  TrendingUp, 
  Search,
  X,
  BookOpen,
  Zap,
  Award,
  Eye,
  Sparkles
} from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface Skill {
  id: string
  name: string
  category?: string | null
}

interface UserSkill {
  id: string
  level: number
  isVerified: boolean
  status: 'USING' | 'WANTS_TO_LEARN'
  skill: Skill
}

interface SkillsManagerProps {
  userSkills: UserSkill[]
  onSkillsUpdate: () => void
}

export function SkillsManager({ userSkills, onSkillsUpdate }: SkillsManagerProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [availableSkills, setAvailableSkills] = useState<Skill[]>([])
  const [filteredSkills, setFilteredSkills] = useState<Skill[]>([])
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null)
  const [skillLevel, setSkillLevel] = useState(3)
  const [skillStatus, setSkillStatus] = useState<'USING' | 'WANTS_TO_LEARN'>('USING')
  const [loading, setLoading] = useState(false)
  const [newSkillName, setNewSkillName] = useState('')
  const [isCreatingSkill, setIsCreatingSkill] = useState(false)
  
  const { toast } = useToast()

  // Загружаем доступные навыки
  useEffect(() => {
    fetchAvailableSkills()
  }, [])

  // Фильтруем навыки по поисковому запросу
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredSkills(availableSkills.slice(0, 20))
      return
    }

    const query = searchQuery.toLowerCase()
    const filtered = availableSkills
      .filter(skill => 
        skill.name.toLowerCase().includes(query) ||
        skill.category?.toLowerCase().includes(query)
      )
      .slice(0, 15)
    
    setFilteredSkills(filtered)

    // Если точного совпадения нет, предлагаем создать новый навык
    const exactMatch = availableSkills.find(skill => 
      skill.name.toLowerCase() === query
    )
    setIsCreatingSkill(!exactMatch && query.length > 2)
    setNewSkillName(query)
  }, [searchQuery, availableSkills])

  const fetchAvailableSkills = async () => {
    try {
      const response = await fetch('/api/skills')
      if (response.ok) {
        const skills = await response.json()
        setAvailableSkills(skills)
        setFilteredSkills(skills.slice(0, 20))
      }
    } catch (error) {
      console.error('Ошибка загрузки навыков:', error)
    }
  }

  const addSkillToProfile = async (skill: Skill, level: number, status: 'USING' | 'WANTS_TO_LEARN') => {
    setLoading(true)
    try {
      const response = await fetch('/api/skills/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          skillId: skill.id,
          level,
          status
        })
      })

      if (response.ok) {
        const result = await response.json()
        toast({
          title: "✨ Навык добавлен!",
          description: `${skill.name} добавлен в ваш профиль. +${result.xpReward} XP`,
          variant: "success"
        })
        onSkillsUpdate()
        setSearchQuery('')
        setSelectedSkill(null)
      } else {
        const error = await response.json()
        toast({
          title: "Ошибка",
          description: error.error || 'Не удалось добавить навык',
          variant: "error"
        })
      }
    } catch (error) {
      toast({
        title: "Ошибка",
        description: 'Произошла ошибка при добавлении навыка',
        variant: "error"
      })
    } finally {
      setLoading(false)
    }
  }

  const createAndAddSkill = async () => {
    if (!newSkillName.trim()) return

    setLoading(true)
    try {
      // Сначала создаем навык
      const createResponse = await fetch('/api/skills/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newSkillName.trim(),
          category: 'Custom'
        })
      })

      if (createResponse.ok) {
        const newSkill = await createResponse.json()
        await addSkillToProfile(newSkill, skillLevel, skillStatus)
        fetchAvailableSkills() // Обновляем список
      } else {
        const error = await createResponse.json()
        toast({
          title: "Ошибка",
          description: error.error || 'Не удалось создать навык',
          variant: "error"
        })
      }
    } catch (error) {
      toast({
        title: "Ошибка",
        description: 'Произошла ошибка при создании навыка',
        variant: "error"
      })
    } finally {
      setLoading(false)
    }
  }

  const updateSkillLevel = async (userSkillId: string, newLevel: number) => {
    try {
      const response = await fetch(`/api/skills/${userSkillId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ level: newLevel })
      })

      if (response.ok) {
        toast({
          title: "🚀 Уровень обновлен",
          description: `Уровень навыка изменен на ${newLevel}`,
          variant: "success"
        })
        onSkillsUpdate()
      }
    } catch (error) {
      console.error('Ошибка обновления уровня:', error)
    }
  }

  const removeSkill = async (userSkillId: string) => {
    try {
      const response = await fetch(`/api/skills/${userSkillId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast({
          title: "Навык удален",
          description: "Навык удален из вашего профиля",
          variant: "default"
        })
        onSkillsUpdate()
      }
    } catch (error) {
      console.error('Ошибка удаления навыка:', error)
    }
  }

  const getSkillCategoryIcon = (category?: string | null) => {
    switch (category?.toLowerCase()) {
      case 'programming': return '💻'
      case 'framework': return '⚛️'
      case 'database': return '🗄️'
      case 'devops': return '🔧'
      case 'design': return '🎨'
      case 'management': return '👥'
      default: return '⭐'
    }
  }

  const getSkillLevelText = (level: number) => {
    const levels = ['', 'Новичок', 'Базовый', 'Средний', 'Продвинутый', 'Эксперт']
    return levels[level] || 'Неопределен'
  }

  const usingSkills = userSkills.filter(us => us.status === 'USING')
  const learningGoals = userSkills.filter(us => us.status === 'WANTS_TO_LEARN')
  const verifiedCount = usingSkills.filter(us => us.isVerified).length

  return (
    <div className="space-y-6">
      {/* Статистика навыков */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Zap className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{usingSkills.length}</p>
                <p className="text-xs text-muted-foreground">Активных навыков</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{verifiedCount}</p>
                <p className="text-xs text-muted-foreground">Подтвержденных</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Target className="w-5 h-5 text-orange-600" />
              <div>
                <p className="text-2xl font-bold">{learningGoals.length}</p>
                <p className="text-xs text-muted-foreground">В планах изучения</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">
                  {usingSkills.reduce((sum, skill) => sum + skill.level, 0)}
                </p>
                <p className="text-xs text-muted-foreground">Общий уровень</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="my-skills" className="space-y-4">
        <TabsList>
          <TabsTrigger value="my-skills">
            <Zap className="w-4 h-4 mr-2" />
            Мои навыки ({usingSkills.length})
          </TabsTrigger>
          <TabsTrigger value="learning-goals">
            <Target className="w-4 h-4 mr-2" />
            Цели изучения ({learningGoals.length})
          </TabsTrigger>
          <TabsTrigger value="add-skills">
            <Plus className="w-4 h-4 mr-2" />
            Добавить навыки
          </TabsTrigger>
        </TabsList>

        {/* Мои навыки */}
        <TabsContent value="my-skills" className="space-y-4">
          {usingSkills.length === 0 ? (
            <Card className="text-center py-8">
              <CardContent>
                <Eye className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Навыки не добавлены</h3>
                <p className="text-muted-foreground mb-4">
                  Добавьте ваши профессиональные навыки для получения персональных рекомендаций
                </p>
                <Button onClick={() => {
                  // Switch to add-skills tab
                  const addSkillsTab = document.querySelector('[value="add-skills"]') as HTMLElement
                  addSkillsTab?.click()
                }}>
                  <Plus className="w-4 h-4 mr-2" />
                  Добавить первый навык
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {usingSkills.map((userSkill) => (
                <Card key={userSkill.id} className="group hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">{getSkillCategoryIcon(userSkill.skill.category)}</span>
                        <CardTitle className="text-base">{userSkill.skill.name}</CardTitle>
                      </div>
                      {userSkill.isVerified && (
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <Label className="text-xs">Уровень владения</Label>
                        <Badge variant="secondary">{userSkill.level}/5</Badge>
                      </div>
                      <Progress value={(userSkill.level / 5) * 100} className="h-2" />
                      <p className="text-xs text-muted-foreground mt-1">
                        {getSkillLevelText(userSkill.level)}
                      </p>
                    </div>
                    
                    <div className="flex gap-2">
                      <Select 
                        value={userSkill.level.toString()}
                        onValueChange={(value) => updateSkillLevel(userSkill.id, parseInt(value))}
                      >
                        <SelectTrigger className="flex-1 h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[1, 2, 3, 4, 5].map(level => (
                            <SelectItem key={level} value={level.toString()}>
                              {level} - {getSkillLevelText(level)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeSkill(userSkill.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>

                    {!userSkill.isVerified && (
                      <Button size="sm" variant="outline" className="w-full">
                        <Award className="w-4 h-4 mr-2" />
                        Запросить подтверждение
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Цели изучения */}
        <TabsContent value="learning-goals" className="space-y-4">
          {learningGoals.length === 0 ? (
            <Card className="text-center py-8">
              <CardContent>
                <Target className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Нет целей изучения</h3>
                <p className="text-muted-foreground mb-4">
                  Поставьте цели для изучения новых навыков и получайте персональные рекомендации курсов
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {learningGoals.map((userSkill) => (
                <Card key={userSkill.id} className="group hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">{getSkillCategoryIcon(userSkill.skill.category)}</span>
                        <CardTitle className="text-base">{userSkill.skill.name}</CardTitle>
                      </div>
                      <Badge variant="outline">Цель</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Планирую изучить • Целевой уровень: {getSkillLevelText(userSkill.level)}
                    </p>
                    
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="flex-1">
                        <BookOpen className="w-4 h-4 mr-2" />
                        Найти курсы
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeSkill(userSkill.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Добавить навыки */}
        <TabsContent value="add-skills" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Добавить новый навык</CardTitle>
              <CardDescription>
                Найдите существующий навык или создайте новый для вашего профиля
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Поиск навыков */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Начните вводить название навыка... (JavaScript, React, Python)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Предлагаемые навыки */}
              {searchQuery && (
                <div className="border rounded-lg p-4 bg-gray-50 max-h-60 overflow-y-auto">
                  <h4 className="text-sm font-medium mb-2">Предлагаемые навыки:</h4>
                  <div className="grid gap-2 grid-cols-1 sm:grid-cols-2">
                    {filteredSkills.map((skill) => (
                      <Button
                        key={skill.id}
                        variant="ghost"
                        className="justify-start h-auto p-3 hover:bg-white"
                        onClick={() => {
                          setSelectedSkill(skill)
                          setSearchQuery('')
                        }}
                      >
                        <div className="flex items-center space-x-2">
                          <span>{getSkillCategoryIcon(skill.category)}</span>
                          <div className="text-left">
                            <p className="font-medium">{skill.name}</p>
                            {skill.category && (
                              <p className="text-xs text-muted-foreground">{skill.category}</p>
                            )}
                          </div>
                        </div>
                      </Button>
                    ))}
                  </div>
                  
                  {/* Создать новый навык */}
                  {isCreatingSkill && (
                    <div className="mt-3 pt-3 border-t">
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                        onClick={() => {
                          setSelectedSkill({ id: 'new', name: newSkillName, category: 'Custom' })
                          setSearchQuery('')
                        }}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Создать навык "{newSkillName}"
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* Форма добавления навыка */}
              {selectedSkill && (
                <Card className="bg-blue-50">
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <Sparkles className="w-5 h-5 text-blue-600" />
                        <h3 className="font-medium">
                          Добавляем навык: {selectedSkill.name}
                        </h3>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <Label className="text-sm font-medium">Статус</Label>
                          <Select
                            value={skillStatus}
                            onValueChange={(value: 'USING' | 'WANTS_TO_LEARN') => setSkillStatus(value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="USING">
                                <div className="flex items-center space-x-2">
                                  <Zap className="w-4 h-4" />
                                  <span>Активно использую</span>
                                </div>
                              </SelectItem>
                              <SelectItem value="WANTS_TO_LEARN">
                                <div className="flex items-center space-x-2">
                                  <Target className="w-4 h-4" />
                                  <span>Планирую изучить</span>
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label className="text-sm font-medium">
                            Уровень владения: {getSkillLevelText(skillLevel)}
                          </Label>
                          <Select
                            value={skillLevel.toString()}
                            onValueChange={(value) => setSkillLevel(parseInt(value))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {[1, 2, 3, 4, 5].map(level => (
                                <SelectItem key={level} value={level.toString()}>
                                  {level} - {getSkillLevelText(level)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          onClick={() => {
                            if (selectedSkill.id === 'new') {
                              createAndAddSkill()
                            } else {
                              addSkillToProfile(selectedSkill, skillLevel, skillStatus)
                            }
                          }}
                          disabled={loading}
                          className="flex-1"
                        >
                          {loading ? 'Добавляем...' : (
                            <>
                              <Plus className="w-4 h-4 mr-2" />
                              Добавить навык
                            </>
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setSelectedSkill(null)}
                        >
                          Отмена
                        </Button>
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
