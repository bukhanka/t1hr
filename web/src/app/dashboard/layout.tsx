"use client"

import { useSession } from "next-auth/react"
import { redirect } from "next/navigation"
import { Navigation } from "@/components/navigation"

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
    <div className="min-h-screen bg-gray-50">
      <Navigation user={session.user} />
      <main className="container mx-auto py-8">
        {children}
      </main>
    </div>
  )
}
