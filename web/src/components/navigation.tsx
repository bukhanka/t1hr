"use client"

import { signOut } from "next-auth/react"
import Link from "next/link"
import { Role } from "@prisma/client"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { 
  User, 
  Users, 
  Search, 
  BarChart3,
  LogOut 
} from "lucide-react"
import { TCoinBalance } from "@/components/tcoin-balance"

interface NavigationProps {
  user: {
    name?: string | null
    email?: string | null
    image?: string | null
    role: Role
  }
}

const roleLabels = {
  [Role.EMPLOYEE]: "Сотрудник",
  [Role.MANAGER]: "Менеджер",
  [Role.HR]: "HR-специалист",
}

const roleIcons = {
  [Role.EMPLOYEE]: User,
  [Role.MANAGER]: Users,
  [Role.HR]: BarChart3,
}

export function Navigation({ user }: NavigationProps) {
  const Icon = roleIcons[user.role]

  const getNavigationItems = () => {
    switch (user.role) {
      case Role.EMPLOYEE:
        return [
          { href: "/dashboard/employee", label: "Мой Карьерный Путь" },
          { href: "/dashboard/employee/profile", label: "Мастерская Карьеры" },
          { href: "/dashboard/employee/shop", label: "T-Coins Магазин" },
          { href: "/communities", label: "Сообщества" },
          { href: "/leaderboards", label: "Лидерборды" },
        ]
      case Role.MANAGER:
        return [
          { href: "/dashboard/manager", label: "Поиск Талантов" },
          { href: "/dashboard/manager/shortlists", label: "Мои Шорт-листы" },
        ]
      case Role.HR:
        return [
          { href: "/dashboard/hr", label: "HR-Аналитика" },
          { href: "/dashboard/hr/reports", label: "Отчеты" },
        ]
      default:
        return []
    }
  }

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">ST</span>
              </div>
              <span className="font-semibold text-lg">SciBox Talent</span>
            </Link>
          </div>

          <nav className="hidden md:flex space-x-8">
            {getNavigationItems().map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center space-x-4">
            {/* T-Coins баланс только для сотрудников */}
            {user.role === Role.EMPLOYEE && (
              <TCoinBalance variant="compact" />
            )}
            
            <Badge variant="secondary" className="flex items-center space-x-1">
              <Icon className="w-3 h-3" />
              <span>{roleLabels[user.role]}</span>
            </Badge>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.image || undefined} alt={user.name || "User"} />
                    <AvatarFallback>
                      {user.name?.charAt(0) || user.email?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuItem className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.name}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut()}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Выйти</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  )
}
