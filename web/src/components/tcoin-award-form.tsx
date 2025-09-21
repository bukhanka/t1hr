"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, Coins } from "lucide-react"

interface Employee {
  id: string
  name: string
  email: string
  department: string
}

export function TCoinAwardForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<string>("")
  const [amount, setAmount] = useState("")
  const [reason, setReason] = useState("")
  const [project, setProject] = useState<string>("")
  const { toast } = useToast()

  // Моковые данные для демонстрации
  const employees: Employee[] = [
    { id: "1", name: "Анна Петрова", email: "anna@company.com", department: "Frontend" },
    { id: "2", name: "Михаил Козлов", email: "mikhail@company.com", department: "Backend" },
    { id: "3", name: "Елена Сидорова", email: "elena@company.com", department: "Design" },
    { id: "4", name: "Дмитрий Иванов", email: "dmitriy@company.com", department: "QA" },
  ]

  const projects = [
    { id: "project1", name: "E-commerce Platform" },
    { id: "project2", name: "Mobile App Redesign" },
    { id: "project3", name: "Analytics Dashboard" },
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch("/api/tcoins/award", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: selectedEmployee,
          amount: parseInt(amount),
          reason,
          projectId: project,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to award T-coins")
      }

      const data = await response.json()

      toast({
        title: "T-коины начислены!",
        description: `Успешно начислено ${amount} T-коинов сотруднику.`,
        variant: "success"
      })

      // Сброс формы
      setSelectedEmployee("")
      setAmount("")
      setReason("")
      setProject("")
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось начислить T-коины. Попробуйте еще раз.",
        variant: "error"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const selectedEmp = employees.find(emp => emp.id === selectedEmployee)

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="employee">Выберите сотрудника</Label>
        <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
          <SelectTrigger id="employee">
            <SelectValue placeholder="Выберите сотрудника из команды" />
          </SelectTrigger>
          <SelectContent>
            {employees.map((employee) => (
              <SelectItem key={employee.id} value={employee.id}>
                <div className="flex flex-col">
                  <span className="font-medium">{employee.name}</span>
                  <span className="text-sm text-muted-foreground">
                    {employee.department} • {employee.email}
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="project">Проект</Label>
        <Select value={project} onValueChange={setProject}>
          <SelectTrigger id="project">
            <SelectValue placeholder="Выберите проект" />
          </SelectTrigger>
          <SelectContent>
            {projects.map((proj) => (
              <SelectItem key={proj.id} value={proj.id}>
                {proj.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="amount">Количество T-коинов</Label>
        <Input
          id="amount"
          type="number"
          placeholder="50"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          min="1"
          max="100"
          required
        />
        <p className="text-sm text-muted-foreground">
          Максимум 100 T-коинов за одно начисление
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="reason">Причина начисления</Label>
        <Textarea
          id="reason"
          placeholder="Отличная работа над фичей авторизации..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          required
          className="min-h-[80px]"
        />
      </div>

      {selectedEmp && (
        <div className="p-4 bg-muted rounded-lg">
          <h4 className="font-medium mb-2">Сводка начисления:</h4>
          <div className="space-y-1 text-sm">
            <p><span className="font-medium">Сотрудник:</span> {selectedEmp.name}</p>
            <p><span className="font-medium">Отдел:</span> {selectedEmp.department}</p>
            <p><span className="font-medium">Сумма:</span> {amount || "0"} T-коинов</p>
          </div>
        </div>
      )}

      <Button 
        type="submit" 
        className="w-full" 
        disabled={isLoading || !selectedEmployee || !amount || !reason || !project}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Начисляем...
          </>
        ) : (
          <>
            <Coins className="mr-2 h-4 w-4" />
            Начислить T-коины
          </>
        )}
      </Button>
    </form>
  )
}
