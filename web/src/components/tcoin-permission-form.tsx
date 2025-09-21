"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, Shield } from "lucide-react"

interface ProjectManager {
  id: string
  user: { name: string | null; email: string }
}

interface Project {
  id: string
  name: string
}

interface TCoinPermissionFormProps {
  projectManagers: ProjectManager[]
  projects: Project[]
}

export function TCoinPermissionForm({ projectManagers, projects }: TCoinPermissionFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [managerId, setManagerId] = useState("")
  const [projectId, setProjectId] = useState("")
  const [maxAmount, setMaxAmount] = useState("100")
  const [dailyLimit, setDailyLimit] = useState("500")
  const [isGlobal, setIsGlobal] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch("/api/tcoins/permissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          managerId,
          projectId: isGlobal ? null : projectId,
          maxAmount: parseInt(maxAmount),
          dailyLimit: parseInt(dailyLimit),
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to create permission")
      }

      toast({
        title: "Разрешение создано!",
        description: "Проектный менеджер получил права на начисление T-коинов.",
        variant: "success"
      })

      // Сброс формы
      setManagerId("")
      setProjectId("")
      setMaxAmount("100")
      setDailyLimit("500")
      setIsGlobal(false)

      // Перезагружаем страницу для обновления списка
      window.location.reload()
    } catch (error: any) {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось создать разрешение.",
        variant: "error"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const selectedManager = projectManagers.find(m => m.id === managerId)
  const selectedProject = projects.find(p => p.id === projectId)

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="manager">Проектный менеджер</Label>
        <Select value={managerId} onValueChange={setManagerId}>
          <SelectTrigger id="manager">
            <SelectValue placeholder="Выберите менеджера" />
          </SelectTrigger>
          <SelectContent>
            {projectManagers.map((manager) => (
              <SelectItem key={manager.id} value={manager.id}>
                <div className="flex flex-col">
                  <span className="font-medium">{manager.user.name}</span>
                  <span className="text-sm text-muted-foreground">
                    {manager.user.email}
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="global"
          checked={isGlobal}
          onCheckedChange={setIsGlobal}
        />
        <Label htmlFor="global">Глобальные права (для всех проектов)</Label>
      </div>

      {!isGlobal && (
        <div className="space-y-2">
          <Label htmlFor="project">Проект</Label>
          <Select value={projectId} onValueChange={setProjectId}>
            <SelectTrigger id="project">
              <SelectValue placeholder="Выберите проект" />
            </SelectTrigger>
            <SelectContent>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="maxAmount">Макс. за раз</Label>
          <Input
            id="maxAmount"
            type="number"
            value={maxAmount}
            onChange={(e) => setMaxAmount(e.target.value)}
            min="1"
            max="1000"
            required
          />
          <p className="text-xs text-muted-foreground">T-коинов</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="dailyLimit">Дневной лимит</Label>
          <Input
            id="dailyLimit"
            type="number"
            value={dailyLimit}
            onChange={(e) => setDailyLimit(e.target.value)}
            min="1"
            max="5000"
            required
          />
          <p className="text-xs text-muted-foreground">T-коинов в день</p>
        </div>
      </div>

      {selectedManager && (
        <div className="p-4 bg-muted rounded-lg">
          <h4 className="font-medium mb-2">Сводка разрешения:</h4>
          <div className="space-y-1 text-sm">
            <p><span className="font-medium">Менеджер:</span> {selectedManager.user.name}</p>
            <p>
              <span className="font-medium">Проект:</span>{" "}
              {isGlobal ? "Все проекты" : selectedProject?.name || "Не выбран"}
            </p>
            <p><span className="font-medium">Макс. начисление:</span> {maxAmount} T-коинов</p>
            <p><span className="font-medium">Дневной лимит:</span> {dailyLimit} T-коинов</p>
          </div>
        </div>
      )}

      <Button 
        type="submit" 
        className="w-full" 
        disabled={isLoading || !managerId || (!isGlobal && !projectId)}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Создаем...
          </>
        ) : (
          <>
            <Shield className="mr-2 h-4 w-4" />
            Выдать разрешение
          </>
        )}
      </Button>
    </form>
  )
}
