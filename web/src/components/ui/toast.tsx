'use client'

import { useState, useEffect } from 'react'
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface Toast {
  id: string
  title?: string
  description?: string
  variant: 'default' | 'success' | 'error' | 'warning' | 'info'
  duration?: number
}

interface ToastProps extends Toast {
  onRemove: (id: string) => void
}

const toastVariants = {
  default: {
    icon: Info,
    className: 'bg-white border-gray-200 text-gray-900'
  },
  success: {
    icon: CheckCircle,
    className: 'bg-green-50 border-green-200 text-green-900'
  },
  error: {
    icon: AlertCircle,
    className: 'bg-red-50 border-red-200 text-red-900'
  },
  warning: {
    icon: AlertTriangle,
    className: 'bg-yellow-50 border-yellow-200 text-yellow-900'
  },
  info: {
    icon: Info,
    className: 'bg-blue-50 border-blue-200 text-blue-900'
  }
}

export function Toast({ id, title, description, variant, duration = 5000, onRemove }: ToastProps) {
  const [isVisible, setIsVisible] = useState(true)
  const [isExiting, setIsExiting] = useState(false)
  
  const config = toastVariants[variant]
  const Icon = config.icon

  useEffect(() => {
    const timer = setTimeout(() => {
      handleClose()
    }, duration)

    return () => clearTimeout(timer)
  }, [duration])

  const handleClose = () => {
    setIsExiting(true)
    setTimeout(() => {
      setIsVisible(false)
      onRemove(id)
    }, 300) // Animation duration
  }

  if (!isVisible) return null

  return (
    <div
      className={cn(
        "pointer-events-auto w-full max-w-sm rounded-lg border shadow-lg transition-all duration-300 ease-in-out",
        config.className,
        isExiting 
          ? "translate-x-full opacity-0" 
          : "translate-x-0 opacity-100"
      )}
      role="alert"
    >
      <div className="flex items-start p-4">
        <div className="flex-shrink-0">
          <Icon className="h-5 w-5" />
        </div>
        <div className="ml-3 flex-1">
          {title && (
            <p className="text-sm font-medium">
              {title}
            </p>
          )}
          {description && (
            <p className={cn(
              "text-sm",
              title ? "mt-1 text-opacity-80" : ""
            )}>
              {description}
            </p>
          )}
        </div>
        <div className="ml-4 flex-shrink-0">
          <button
            type="button"
            className="inline-flex rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            onClick={handleClose}
          >
            <span className="sr-only">Закрыть</span>
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

interface ToastContainerProps {
  toasts: Toast[]
  onRemove: (id: string) => void
}

export function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  if (toasts.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          {...toast}
          onRemove={onRemove}
        />
      ))}
    </div>
  )
}
