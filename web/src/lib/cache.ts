/**
 * Простое, но умное кэширование для улучшения производительности
 */

interface CacheItem<T> {
  data: T
  timestamp: number
  ttl: number
}

class SmartCache {
  private cache = new Map<string, CacheItem<any>>()
  
  /**
   * Получить данные из кэша
   */
  get<T>(key: string): T | null {
    const item = this.cache.get(key)
    
    if (!item) {
      return null
    }
    
    // Проверяем TTL
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key)
      return null
    }
    
    return item.data
  }
  
  /**
   * Сохранить данные в кэш
   */
  set<T>(key: string, data: T, ttlMinutes: number = 5): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMinutes * 60 * 1000
    })
  }
  
  /**
   * Удалить из кэша
   */
  delete(key: string): void {
    this.cache.delete(key)
  }
  
  /**
   * Очистить весь кэш
   */
  clear(): void {
    this.cache.clear()
  }
  
  /**
   * Получить статистику кэша
   */
  getStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    }
  }
  
  /**
   * Очистить устаревшие записи
   */
  cleanup(): void {
    const now = Date.now()
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        this.cache.delete(key)
      }
    }
  }
}

// Глобальный экземпляр кэша
export const smartCache = new SmartCache()

// Автоочистка каждые 10 минут
setInterval(() => {
  smartCache.cleanup()
}, 10 * 60 * 1000)

/**
 * Декоратор для кэширования результатов функций
 */
export function cached<T extends (...args: any[]) => Promise<any>>(
  ttlMinutes: number = 5
) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value
    
    descriptor.value = async function (...args: any[]) {
      // Создаем ключ кэша из имени метода и аргументов
      const cacheKey = `${propertyKey}:${JSON.stringify(args)}`
      
      // Проверяем кэш
      const cached = smartCache.get(cacheKey)
      if (cached !== null) {
        console.log(`🎯 Кэш HIT для ${propertyKey}`)
        return cached
      }
      
      // Выполняем оригинальный метод
      console.log(`🔄 Кэш MISS для ${propertyKey}`)
      const result = await originalMethod.apply(this, args)
      
      // Сохраняем в кэш
      smartCache.set(cacheKey, result, ttlMinutes)
      
      return result
    }
  }
}

/**
 * Утилита для создания ключей кэша
 */
export function createCacheKey(prefix: string, ...params: any[]): string {
  return `${prefix}:${params.map(p => 
    typeof p === 'object' ? JSON.stringify(p) : String(p)
  ).join(':')}`
}

/**
 * Кэширование с автоматическим обновлением
 */
export async function cacheWithRefresh<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlMinutes: number = 5
): Promise<T> {
  // Проверяем кэш
  const cached = smartCache.get<T>(key)
  if (cached !== null) {
    return cached
  }
  
  // Получаем свежие данные
  const data = await fetcher()
  
  // Сохраняем в кэш
  smartCache.set(key, data, ttlMinutes)
  
  return data
}
