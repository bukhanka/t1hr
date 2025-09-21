"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useToast } from "@/components/ui/use-toast"
import { Trash2, Globe, Building, Coins, Calendar } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface ProjectManager {
  id: string
  user: { name: string | null; email: string }
  tcoinPermissions: {
    id: string
    maxAmount: number
    dailyLimit: number
    isActive: boolean
    createdAt: Date
    project?: { id: string; name: string } | null
  }[]
}

interface TCoinPermissionsListProps {
  projectManagers: ProjectManager[]
}

export function TCoinPermissionsList({ projectManagers }: TCoinPermissionsListProps) {
  const [deletingPermission, setDeletingPermission] = useState<string | null>(null)
  const { toast } = useToast()

  const handleDeletePermission = async (permissionId: string) => {
    try {
      const response = await fetch(`/api/tcoins/permissions/${permissionId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete permission")
      }

      toast({
        title: "Разрешение удалено",
        description: "Права на начисление T-коинов отозваны.",
        variant: "default"
      })

      // Перезагружаем страницу
      window.location.reload()
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось удалить разрешение.",
        variant: "error"
      })
    } finally {
      setDeletingPermission(null)
    }
  }

  const getInitials = (name: string | null) => {
    if (!name) return "?"
    return name.split(' ').map(n => n[0]).join('').toUpperCase()
  }

  const managersWithPermissions = projectManagers.filter(
    manager => manager.tcoinPermissions.length > 0
  )

  if (managersWithPermissions.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-muted-foreground">
          Нет активных разрешений
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Создайте первое разрешение, чтобы менеджеры могли начислять T-коины
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {managersWithPermissions.map((manager) => (
          <Card key={manager.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="" alt={manager.user.name || ""} />
                    <AvatarFallback className="text-xs">
                      {getInitials(manager.user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium text-sm">{manager.user.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {manager.user.email}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                {manager.tcoinPermissions.map((permission) => (
                  <div
                    key={permission.id}
                    className="flex items-center justify-between p-2 bg-muted/50 rounded"
                  >
                    <div className="flex items-center space-x-2">
                      {permission.project ? (
                        <>
                          <Building className="h-4 w-4 text-blue-500" />
                          <span className="text-sm">{permission.project.name}</span>
                        </>
                      ) : (
                        <>
                          <Globe className="h-4 w-4 text-green-500" />
                          <span className="text-sm">Все проекты</span>
                        </>
                      )}
                    </div>

                    <div className="flex items-center space-x-2">
                      <div className="flex items-center space-x-1">
                        <Coins className="h-3 w-3 text-yellow-500" />
                        <span className="text-xs">{permission.maxAmount}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3 text-blue-500" />
                        <span className="text-xs">{permission.dailyLimit}/день</span>
                      </div>
                      <Badge 
                        variant={permission.isActive ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {permission.isActive ? "Активно" : "Неактивно"}
                      </Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-6 w-6 p-0"
                        onClick={() => setDeletingPermission(permission.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Диалог подтверждения удаления */}
      <AlertDialog 
        open={deletingPermission !== null} 
        onOpenChange={() => setDeletingPermission(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить разрешение?</AlertDialogTitle>
            <AlertDialogDescription>
              Это действие нельзя отменить. Менеджер потеряет права на начисление 
              T-коинов в рамках этого разрешения.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingPermission && handleDeletePermission(deletingPermission)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
