"use client"

import { useSession } from "next-auth/react"
import { redirect } from "next/navigation"
import { Role } from "@prisma/client"

export default function DashboardPage() {
  const { data: session } = useSession()

  if (!session) {
    redirect("/auth/signin")
  }

  // Перенаправляем пользователя на соответствующую его роли страницу
  switch (session.user.role) {
    case Role.EMPLOYEE:
      redirect("/dashboard/employee")
    case Role.MANAGER:
      redirect("/dashboard/manager")
    case Role.HR:
      redirect("/dashboard/hr")
    case Role.PROJECT_MANAGER:
      redirect("/dashboard/project-manager")
    default:
      redirect("/dashboard/employee")
  }
}
