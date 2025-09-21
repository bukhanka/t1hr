'use client'

import { useState, useEffect } from 'react'
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Coins, TrendingUp, History } from "lucide-react"

interface TCoinBalanceProps {
  className?: string
  showHistory?: boolean
  variant?: 'compact' | 'full'
}

interface TCoinData {
  current: number
  totalEarned: number
}

interface Transaction {
  id: string
  amount: number
  type: string
  description: string
  createdAt: string
}

export function TCoinBalance({ 
  className = "", 
  showHistory = false,
  variant = 'compact' 
}: TCoinBalanceProps) {
  const [balance, setBalance] = useState<TCoinData | null>(null)
  const [history, setHistory] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [showHistoryPanel, setShowHistoryPanel] = useState(false)

  useEffect(() => {
    fetchBalance()
    if (showHistory) {
      fetchHistory()
    }
  }, [showHistory])

  const fetchBalance = async () => {
    try {
      const response = await fetch('/api/tcoins/balance')
      if (response.ok) {
        const data = await response.json()
        setBalance(data)
      }
    } catch (error) {
      console.error('Ошибка загрузки баланса T-Coins:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchHistory = async () => {
    try {
      const response = await fetch('/api/tcoins/history?limit=10')
      if (response.ok) {
        const data = await response.json()
        setHistory(data.transactions)
      }
    } catch (error) {
      console.error('Ошибка загрузки истории T-Coins:', error)
    }
  }

  if (loading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
        <span className="text-sm text-gray-500">Загрузка...</span>
      </div>
    )
  }

  if (!balance) return null

  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Badge variant="secondary" className="flex items-center gap-1.5 py-1.5 px-3">
          <Coins className="h-4 w-4 text-yellow-600" />
          <span className="font-semibold text-yellow-700">{balance.current}</span>
          <span className="text-xs text-gray-500">T-Coins</span>
        </Badge>
        {showHistory && (
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setShowHistoryPanel(!showHistoryPanel)}
            className="h-8 w-8 p-0"
          >
            <History className="h-4 w-4" />
          </Button>
        )}
      </div>
    )
  }

  return (
    <Card className={className}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-yellow-100">
              <Coins className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-yellow-700">{balance.current}</span>
                <span className="text-sm text-gray-500">T-Coins</span>
              </div>
              <div className="flex items-center gap-1 text-sm text-gray-500">
                <TrendingUp className="h-3 w-3" />
                <span>Всего заработано: {balance.totalEarned}</span>
              </div>
            </div>
          </div>
          
          {showHistory && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowHistoryPanel(!showHistoryPanel)}
            >
              <History className="h-4 w-4 mr-2" />
              История
            </Button>
          )}
        </div>

        {showHistoryPanel && history.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <h4 className="text-sm font-medium mb-2">Последние транзакции</h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {history.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 truncate flex-1">
                    {transaction.description}
                  </span>
                  <span className={`font-medium ml-2 ${
                    transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {transaction.amount > 0 ? '+' : ''}{transaction.amount}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
