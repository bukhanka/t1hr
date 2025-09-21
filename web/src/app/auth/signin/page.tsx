"use client"

import { useState } from "react"
import { signIn, getSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function SignIn() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError("Неверные учетные данные")
      } else {
        // Перенаправляем пользователя на dashboard
        router.push("/dashboard")
      }
    } catch (error) {
      setError("Произошла ошибка при входе")
    } finally {
      setLoading(false)
    }
  }

  const handleDemoLogin = async (email: string, name: string) => {
    setLoading(true)
    setError("")

    try {
      const result = await signIn("credentials", {
        email,
        password: "demo", // Пароль не важен для демо-пользователей
        redirect: false,
      })

      if (result?.error) {
        setError("Ошибка входа в демо-режиме")
      } else {
        router.push("/dashboard")
      }
    } catch (error) {
      setError("Произошла ошибка при входе")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">ST</span>
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-center">
            Вход в SciBox Talent
          </CardTitle>
          <CardDescription className="text-center">
            Введите ваши учетные данные для доступа к системе
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="user@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Пароль</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            
            {error && (
              <Alert className="border-red-200 bg-red-50">
                <AlertDescription className="text-red-800">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading}
            >
              {loading ? "Вход..." : "Войти"}
            </Button>
          </form>

          <div className="mt-4">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-muted-foreground">
                  Или войдите быстро
                </span>
              </div>
            </div>
          </div>

          {/* Demo quick login buttons */}
          <div className="mt-4 space-y-3">
            <div className="text-sm font-medium text-gray-700 mb-2">🚀 Демо-аккаунты для презентации:</div>
            
            {/* Основные роли */}
            <div className="grid grid-cols-1 gap-2">
              <Button
                type="button"
                variant="outline"
                className="w-full justify-start h-12 border-blue-200 hover:bg-blue-50"
                onClick={() => handleDemoLogin('demo.employee@company.com', 'Демо Сотрудник')}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 text-sm font-medium">👨‍💻</span>
                  </div>
                  <div className="text-left">
                    <p className="font-medium">Демо Сотрудник</p>
                    <p className="text-sm text-muted-foreground">Senior Full-Stack Developer</p>
                  </div>
                </div>
              </Button>

              <Button
                type="button"
                variant="outline"
                className="w-full justify-start h-12 border-green-200 hover:bg-green-50"
                onClick={() => handleDemoLogin('demo.manager@company.com', 'Демо Менеджер')}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 text-sm font-medium">👨‍💼</span>
                  </div>
                  <div className="text-left">
                    <p className="font-medium">Демо Менеджер</p>
                    <p className="text-sm text-muted-foreground">Engineering Manager</p>
                  </div>
                </div>
              </Button>

              <Button
                type="button"
                variant="outline"
                className="w-full justify-start h-12 border-purple-200 hover:bg-purple-50"
                onClick={() => handleDemoLogin('demo.hr@company.com', 'Демо HR')}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <span className="text-purple-600 text-sm font-medium">👩‍💼</span>
                  </div>
                  <div className="text-left">
                    <p className="font-medium">Демо HR</p>
                    <p className="text-sm text-muted-foreground">HR Business Partner</p>
                  </div>
                </div>
              </Button>
            </div>

            <div className="text-sm font-medium text-gray-700 mb-2 mt-4">👥 Дополнительные роли:</div>
            
            {/* Дополнительные роли */}
            <div className="grid grid-cols-1 gap-2">
              <Button
                type="button"
                variant="outline"
                className="w-full justify-start h-10 text-sm"
                onClick={() => handleDemoLogin('ivan.petrov@company.com', 'Иван Петров')}
              >
                <div className="flex items-center space-x-2">
                  <span className="text-blue-600">🎨</span>
                  <span>Иван Петров - Senior Frontend</span>
                </div>
              </Button>

              <Button
                type="button"
                variant="outline"
                className="w-full justify-start h-10 text-sm"
                onClick={() => handleDemoLogin('olga.nikolaeva@company.com', 'Ольга Николаева')}
              >
                <div className="flex items-center space-x-2">
                  <span className="text-purple-600">📊</span>
                  <span>Ольга Николаева - Data Scientist</span>
                </div>
              </Button>

              <Button
                type="button"
                variant="outline"
                className="w-full justify-start h-10 text-sm"
                onClick={() => handleDemoLogin('mikhail.fedorov@company.com', 'Михаил Федоров')}
              >
                <div className="flex items-center space-x-2">
                  <span className="text-orange-600">⚙️</span>
                  <span>Михаил Федоров - DevOps</span>
                </div>
              </Button>

              <Button
                type="button"
                variant="outline"
                className="w-full justify-start h-10 text-sm"
                onClick={() => handleDemoLogin('anna.morozova@company.com', 'Анна Морозова')}
              >
                <div className="flex items-center space-x-2">
                  <span className="text-green-600">🌱</span>
                  <span>Анна Морозова - Junior Frontend</span>
                </div>
              </Button>

              <Button
                type="button"
                variant="outline"
                className="w-full justify-start h-10 text-sm"
                onClick={() => handleDemoLogin('vladimir.senior@company.com', 'Владимир Сеньоров')}
              >
                <div className="flex items-center space-x-2">
                  <span className="text-red-600">🏆</span>
                  <span>Владимир Сеньоров - Principal Engineer</span>
                </div>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
