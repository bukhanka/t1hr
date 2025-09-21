"use client"

import { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Coins, MessageCircle, TrendingUp, User } from "lucide-react"

interface TeamMember {
  id: string
  name: string
  email: string
  avatar?: string
  role: string
  department: string
  currentTCoins: number
  monthlyEarned: number
  lastActivity: string
  projects: string[]
}

export function ProjectTeamList() {
  const [selectedProject, setSelectedProject] = useState<string>("all")

  // Моковые данные команды
  const teamMembers: TeamMember[] = [
    {
      id: "1",
      name: "Анна Петрова",
      email: "anna@company.com",
      role: "Senior Frontend Developer",
      department: "Engineering",
      currentTCoins: 850,
      monthlyEarned: 320,
      lastActivity: "2 часа назад",
      projects: ["E-commerce Platform", "Mobile App"],
    },
    {
      id: "2",
      name: "Михаил Козлов",
      email: "mikhail@company.com",
      role: "Backend Developer",
      department: "Engineering",
      currentTCoins: 720,
      monthlyEarned: 280,
      lastActivity: "30 минут назад",
      projects: ["E-commerce Platform", "Analytics Dashboard"],
    },
    {
      id: "3",
      name: "Елена Сидорова",
      email: "elena@company.com",
      role: "UX/UI Designer",
      department: "Design",
      currentTCoins: 640,
      monthlyEarned: 250,
      lastActivity: "1 час назад",
      projects: ["Mobile App", "Analytics Dashboard"],
    },
    {
      id: "4",
      name: "Дмитрий Иванов",
      email: "dmitriy@company.com",
      role: "QA Engineer",
      department: "Quality Assurance",
      currentTCoins: 590,
      monthlyEarned: 180,
      lastActivity: "4 часа назад",
      projects: ["E-commerce Platform"],
    },
  ]

  const projects = [
    { id: "all", name: "Все проекты" },
    { id: "ecommerce", name: "E-commerce Platform" },
    { id: "mobile", name: "Mobile App" },
    { id: "analytics", name: "Analytics Dashboard" },
  ]

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase()
  }

  const getActivityColor = (lastActivity: string) => {
    if (lastActivity.includes('минут')) return 'bg-green-500'
    if (lastActivity.includes('час')) return 'bg-yellow-500'
    return 'bg-gray-500'
  }

  return (
    <div className="space-y-4">
      {/* Фильтр проектов */}
      <div className="flex flex-wrap gap-2">
        {projects.map((project) => (
          <Button
            key={project.id}
            variant={selectedProject === project.id ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedProject(project.id)}
          >
            {project.name}
          </Button>
        ))}
      </div>

      {/* Список команды */}
      <div className="space-y-3">
        {teamMembers.map((member) => (
          <Card key={member.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <div className="relative">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={member.avatar} alt={member.name} />
                      <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
                    </Avatar>
                    <div 
                      className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${getActivityColor(member.lastActivity)}`}
                      title={`Последняя активность: ${member.lastActivity}`}
                    />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-medium text-sm">{member.name}</h3>
                      <Badge variant="secondary" className="text-xs">
                        {member.department}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{member.role}</p>
                    <p className="text-xs text-muted-foreground">{member.email}</p>
                    
                    {/* Проекты */}
                    <div className="flex flex-wrap gap-1 mt-2">
                      {member.projects.map((project) => (
                        <Badge key={project} variant="outline" className="text-xs">
                          {project}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="text-right space-y-2">
                  {/* T-коины */}
                  <div className="flex items-center space-x-1 text-sm">
                    <Coins className="h-4 w-4 text-yellow-500" />
                    <span className="font-medium">{member.currentTCoins}</span>
                  </div>
                  
                  {/* Заработано за месяц */}
                  <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                    <TrendingUp className="h-3 w-3" />
                    <span>+{member.monthlyEarned}</span>
                  </div>

                  {/* Действия */}
                  <div className="flex space-x-1">
                    <Button size="sm" variant="outline" className="h-7 w-7 p-0">
                      <MessageCircle className="h-3 w-3" />
                    </Button>
                    <Button size="sm" variant="outline" className="h-7 w-7 p-0">
                      <User className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Статистика команды */}
      <div className="grid grid-cols-3 gap-4 pt-4 border-t">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">
            {teamMembers.length}
          </div>
          <div className="text-xs text-muted-foreground">
            участников
          </div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">
            {teamMembers.reduce((sum, member) => sum + member.currentTCoins, 0)}
          </div>
          <div className="text-xs text-muted-foreground">
            T-коинов у команды
          </div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-600">
            {teamMembers.reduce((sum, member) => sum + member.monthlyEarned, 0)}
          </div>
          <div className="text-xs text-muted-foreground">
            заработано за месяц
          </div>
        </div>
      </div>
    </div>
  )
}
