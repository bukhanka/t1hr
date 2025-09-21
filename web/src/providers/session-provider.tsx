"use client"

import { SessionProvider } from "next-auth/react"
import { ToastProvider } from "./toast-provider"

interface Props {
  children: React.ReactNode
}

export function Providers({ children }: Props) {
  return (
    <SessionProvider>
      <ToastProvider>
        {children}
      </ToastProvider>
    </SessionProvider>
  )
}
