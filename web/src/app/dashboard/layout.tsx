"use client"

import { useSession } from "next-auth/react"
import { redirect } from "next/navigation"
import { Navigation } from "@/components/navigation"
import { NavigatorProvider } from "@/providers/navigator-provider"
import { NavigatorFAB } from "@/components/navigator-fab"
import { NavigatorModal } from "@/components/navigator-modal"
import { useNavigator } from "@/providers/navigator-provider"

function DashboardContent({
  children,
  user
}: {
  children: React.ReactNode
  user: any
}) {
  const { isOpen, triggerSource, closeNavigator } = useNavigator()

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        <Navigation user={user} />
        <main className="container mx-auto py-8">
          {children}
        </main>
        
        {/* Глобальная кнопка Навигатора */}
        <NavigatorFAB />
      </div>

      {/* Модальное окно Навигатора */}
      <NavigatorModal 
        isOpen={isOpen}
        onOpenChange={closeNavigator}
        triggerSource={triggerSource}
      />
    </>
  )
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session, status } = useSession()

  if (status === "loading") {
    return <div>Loading...</div>
  }

  if (!session) {
    redirect("/auth/signin")
  }

  return (
    <NavigatorProvider>
      <DashboardContent user={session.user}>
        {children}
      </DashboardContent>
    </NavigatorProvider>
  )
}
