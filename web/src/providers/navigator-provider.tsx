"use client"

import { createContext, useContext, useState, ReactNode } from 'react'

interface NavigatorContextType {
  isOpen: boolean
  triggerSource?: string
  openNavigator: (source?: string) => void
  closeNavigator: () => void
}

const NavigatorContext = createContext<NavigatorContextType | undefined>(undefined)

export function NavigatorProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [triggerSource, setTriggerSource] = useState<string>()

  const openNavigator = (source?: string) => {
    setTriggerSource(source)
    setIsOpen(true)
  }

  const closeNavigator = () => {
    setIsOpen(false)
    setTriggerSource(undefined)
  }

  return (
    <NavigatorContext.Provider value={{
      isOpen,
      triggerSource,
      openNavigator,
      closeNavigator
    }}>
      {children}
    </NavigatorContext.Provider>
  )
}

export function useNavigator() {
  const context = useContext(NavigatorContext)
  if (context === undefined) {
    throw new Error('useNavigator must be used within a NavigatorProvider')
  }
  return context
}
