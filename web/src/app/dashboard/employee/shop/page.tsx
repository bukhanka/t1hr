import { Suspense } from 'react'
import { TCoinShop } from '@/components/tcoin-shop'
import { Loader2, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function ShopPage() {
  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Link href="/dashboard/employee">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Назад к дашборду
          </Button>
        </Link>
      </div>

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
