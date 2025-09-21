'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/providers/toast-provider"
import { 
  Coins, 
  ShoppingCart, 
  Gift, 
  BookOpen, 
  Crown,
  Loader2,
  CheckCircle 
} from "lucide-react"

interface RewardItem {
  id: string
  name: string
  description: string
  cost: number
  category: string
  imageUrl?: string
  inStock: boolean
}

interface RewardCatalog {
  categories: Record<string, string>
  items: RewardItem[]
  total: number
}

interface TCoinBalance {
  current: number
  totalEarned: number
}

const categoryIcons = {
  merch: Gift,
  development: BookOpen,
  privileges: Crown
}

export function TCoinShop() {
  const [catalog, setCatalog] = useState<RewardCatalog | null>(null)
  const [balance, setBalance] = useState<TCoinBalance | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [loading, setLoading] = useState(true)
  const [purchasing, setPurchasing] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    Promise.all([
      fetchCatalog(),
      fetchBalance()
    ]).finally(() => setLoading(false))
  }, [])

  const fetchCatalog = async () => {
    try {
      const response = await fetch(`/api/tcoins/rewards?category=${selectedCategory}`)
      if (response.ok) {
        const data = await response.json()
        setCatalog(data)
      }
    } catch (error) {
      console.error('Ошибка загрузки каталога:', error)
    }
  }

  const fetchBalance = async () => {
    try {
      const response = await fetch('/api/tcoins/balance')
      if (response.ok) {
        const data = await response.json()
        setBalance(data)
      }
    } catch (error) {
      console.error('Ошибка загрузки баланса:', error)
    }
  }

  const handlePurchase = async (item: RewardItem) => {
    if (!balance || balance.current < item.cost) {
      toast({
        title: "Недостаточно T-Coins",
        description: `Для покупки "${item.name}" нужно ${item.cost} T-Coins, у вас ${balance?.current || 0}`,
        variant: "error"
      })
      return
    }

    setPurchasing(item.id)
    try {
      const response = await fetch('/api/tcoins/spend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId: item.id,
          quantity: 1
        })
      })

      const result = await response.json()

      if (response.ok && result.success) {
        setBalance(prev => prev ? { ...prev, current: result.purchase.remainingBalance } : null)
        
        toast({
          title: "Покупка успешна! 🎉",
          description: result.message,
          variant: "default"
        })
      } else {
        toast({
          title: "Ошибка покупки",
          description: result.error || "Что-то пошло не так",
          variant: "error"
        })
      }
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось совершить покупку",
        variant: "error"
      })
    } finally {
      setPurchasing(null)
    }
  }

  const filterItemsByCategory = (category: string) => {
    if (!catalog) return []
    if (category === 'all') return catalog.items
    return catalog.items.filter(item => item.category === category)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!catalog || !balance) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Не удалось загрузить магазин</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Заголовок с балансом */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">T-Coins магазин</h2>
          <p className="text-gray-600">Обменивайте T-Coins на классные призы!</p>
        </div>
        <Card className="w-48">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Coins className="h-5 w-5 text-yellow-600" />
              <div>
                <div className="text-lg font-bold text-yellow-700">{balance.current}</div>
                <div className="text-xs text-gray-500">T-Coins</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Табы по категориям */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">Все</TabsTrigger>
          {Object.entries(catalog.categories).map(([key, label]) => {
            const Icon = categoryIcons[key as keyof typeof categoryIcons]
            return (
              <TabsTrigger key={key} value={key} className="flex items-center gap-2">
                {Icon && <Icon className="h-4 w-4" />}
                {label}
              </TabsTrigger>
            )
          })}
        </TabsList>

        <TabsContent value="all" className="mt-6">
          <RewardGrid 
            items={catalog.items} 
            balance={balance}
            purchasing={purchasing}
            onPurchase={handlePurchase}
          />
        </TabsContent>

        {Object.keys(catalog.categories).map(category => (
          <TabsContent key={category} value={category} className="mt-6">
            <RewardGrid 
              items={filterItemsByCategory(category)} 
              balance={balance}
              purchasing={purchasing}
              onPurchase={handlePurchase}
            />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}

interface RewardGridProps {
  items: RewardItem[]
  balance: TCoinBalance
  purchasing: string | null
  onPurchase: (item: RewardItem) => void
}

function RewardGrid({ items, balance, purchasing, onPurchase }: RewardGridProps) {
  if (items.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">В этой категории пока нет товаров</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map(item => {
        const canAfford = balance.current >= item.cost
        const isPurchasing = purchasing === item.id

        return (
          <Card key={item.id} className={`relative overflow-hidden ${!canAfford ? 'opacity-75' : ''}`}>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">{item.name}</CardTitle>
                <Badge variant="outline" className="flex items-center gap-1">
                  <Coins className="h-3 w-3 text-yellow-600" />
                  {item.cost}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-sm mb-4 min-h-[40px]">
                {item.description}
              </CardDescription>
              
              <Button 
                onClick={() => onPurchase(item)}
                disabled={!canAfford || !item.inStock || isPurchasing}
                className="w-full"
                variant={canAfford ? "default" : "secondary"}
              >
                {isPurchasing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Покупка...
                  </>
                ) : !item.inStock ? (
                  'Нет в наличии'
                ) : !canAfford ? (
                  `Нужно еще ${item.cost - balance.current} T-Coins`
                ) : (
                  <>
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Купить
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
