import { Suspense } from 'react'
import { TCoinShop } from '@/components/tcoin-shop'
import { Loader2 } from 'lucide-react'

export default function ShopPage() {
  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      <Suspense fallback={
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Загрузка магазина...</span>
        </div>
      }>
        <TCoinShop />
      </Suspense>
    </div>
  )
}
