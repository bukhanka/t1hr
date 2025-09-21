"use client"

import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Coins, TrendingUp, Crown } from 'lucide-react'
import { useSoundEffects } from '@/lib/sound-effects'

interface RewardInfo {
  tcoinsEarned: number
  xpEarned: number
  newTotal: number
  levelUp?: boolean
}

interface TCoinRewardNotificationProps {
  rewards: RewardInfo | null
  onComplete?: () => void
}

export function TCoinRewardNotification({ 
  rewards, 
  onComplete 
}: TCoinRewardNotificationProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const { playCoinSound, playLevelUpSound } = useSoundEffects()

  useEffect(() => {
    if (rewards) {
      setIsVisible(true)
      setIsAnimating(true)
      
      // Проигрываем звук в зависимости от типа награды
      if (rewards.levelUp) {
        playLevelUpSound()
      } else if (rewards.tcoinsEarned > 0) {
        playCoinSound()
      }

      // Скрываем уведомление через 3 секунды
      const hideTimer = setTimeout(() => {
        setIsAnimating(false)
        setTimeout(() => {
          setIsVisible(false)
          onComplete?.()
        }, 300) // время для анимации исчезновения
      }, 3000)

      return () => clearTimeout(hideTimer)
    }
  }, [rewards, playCoinSound, playLevelUpSound, onComplete])

  if (!isVisible || !rewards) {
    return null
  }

  return (
    <div className={`fixed top-4 right-4 z-50 transition-all duration-300 ${
      isAnimating 
        ? 'translate-x-0 opacity-100 scale-100' 
        : 'translate-x-full opacity-0 scale-95'
    }`}>
      <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white p-4 rounded-lg shadow-lg border-2 border-yellow-300">
        <div className="flex items-center space-x-3">
          {rewards.levelUp ? (
            <div className="flex items-center space-x-2">
              <Crown className="h-6 w-6 text-yellow-200" />
              <div>
                <div className="font-bold text-lg">🎉 Новый уровень!</div>
                <div className="text-sm opacity-90">
                  +{rewards.xpEarned} XP • +{rewards.tcoinsEarned} T-Coins
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <div className="flex items-center">
                <Coins className="h-5 w-5 text-yellow-200 animate-bounce mr-1" />
                <span className="font-bold text-lg">+{rewards.tcoinsEarned}</span>
              </div>
              <div className="text-sm">
                <div className="font-medium">T-Coins заработано!</div>
                <div className="opacity-90">Общий баланс: {rewards.newTotal}</div>
              </div>
            </div>
          )}
        </div>

        {/* Дополнительная информация о XP если есть */}
        {rewards.xpEarned > 0 && !rewards.levelUp && (
          <div className="mt-2 flex items-center text-sm opacity-90">
            <TrendingUp className="h-4 w-4 mr-1" />
            <span>+{rewards.xpEarned} XP</span>
          </div>
        )}

        {/* Анимированные искорки */}
        <div className="absolute -top-1 -right-1">
          <div className="w-3 h-3 bg-yellow-300 rounded-full animate-ping opacity-75"></div>
        </div>
        <div className="absolute -bottom-1 -left-1">
          <div className="w-2 h-2 bg-orange-300 rounded-full animate-bounce opacity-75" style={{animationDelay: '0.5s'}}></div>
        </div>
      </div>
    </div>
  )
}
