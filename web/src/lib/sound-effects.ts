// Библиотека для звуковых эффектов
export class SoundEffects {
  private static audioContext: AudioContext | null = null

  // Инициализация Web Audio API
  private static getAudioContext(): AudioContext {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    }
    return this.audioContext
  }

  // Генерирует звук "звон монет" программно
  static async playCoinSound() {
    try {
      const audioContext = this.getAudioContext()
      
      // Возобновляем контекст если он заблокирован
      if (audioContext.state === 'suspended') {
        await audioContext.resume()
      }

      // Создаем серию тонов для эффекта "звон монет"
      const notes = [
        { frequency: 587.33, duration: 0.1 }, // D5
        { frequency: 659.25, duration: 0.1 }, // E5  
        { frequency: 783.99, duration: 0.15 }, // G5
        { frequency: 880.00, duration: 0.2 }  // A5
      ]

      let startTime = audioContext.currentTime

      notes.forEach((note, index) => {
        const oscillator = audioContext.createOscillator()
        const gainNode = audioContext.createGain()

        oscillator.connect(gainNode)
        gainNode.connect(audioContext.destination)

        oscillator.frequency.setValueAtTime(note.frequency, startTime)
        oscillator.type = 'sine'

        // Огибающая звука (attack, decay)
        gainNode.gain.setValueAtTime(0, startTime)
        gainNode.gain.linearRampToValueAtTime(0.3, startTime + 0.01)
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + note.duration)

        oscillator.start(startTime)
        oscillator.stop(startTime + note.duration)

        startTime += note.duration * 0.3 // Небольшие перекрытия звуков
      })

      console.log('🔊 Проигран звук монет')
      
    } catch (error) {
      console.warn('Не удалось воспроизвести звук:', error)
    }
  }

  // Генерирует звук повышения уровня
  static async playLevelUpSound() {
    try {
      const audioContext = this.getAudioContext()
      
      if (audioContext.state === 'suspended') {
        await audioContext.resume()
      }

      // Восходящая арпеджио для повышения уровня
      const notes = [
        { frequency: 261.63, duration: 0.15 }, // C4
        { frequency: 329.63, duration: 0.15 }, // E4
        { frequency: 392.00, duration: 0.15 }, // G4
        { frequency: 523.25, duration: 0.3 }   // C5
      ]

      let startTime = audioContext.currentTime

      notes.forEach((note, index) => {
        const oscillator = audioContext.createOscillator()
        const gainNode = audioContext.createGain()

        oscillator.connect(gainNode)
        gainNode.connect(audioContext.destination)

        oscillator.frequency.setValueAtTime(note.frequency, startTime)
        oscillator.type = 'triangle'

        gainNode.gain.setValueAtTime(0, startTime)
        gainNode.gain.linearRampToValueAtTime(0.4, startTime + 0.02)
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + note.duration)

        oscillator.start(startTime)
        oscillator.stop(startTime + note.duration)

        startTime += note.duration * 0.7
      })

      console.log('🔊 Проигран звук повышения уровня')
      
    } catch (error) {
      console.warn('Не удалось воспроизвести звук:', error)
    }
  }

  // Создает простой короткий "пинг" для уведомлений
  static async playNotificationSound() {
    try {
      const audioContext = this.getAudioContext()
      
      if (audioContext.state === 'suspended') {
        await audioContext.resume()
      }

      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)

      oscillator.frequency.setValueAtTime(800, audioContext.currentTime)
      oscillator.type = 'sine'

      gainNode.gain.setValueAtTime(0, audioContext.currentTime)
      gainNode.gain.linearRampToValueAtTime(0.2, audioContext.currentTime + 0.01)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2)

      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.2)

      console.log('🔊 Проигран звук уведомления')
      
    } catch (error) {
      console.warn('Не удалось воспроизвести звук:', error)
    }
  }
}

// Хук для удобного использования в React компонентах
export const useSoundEffects = () => {
  const playCoinSound = () => SoundEffects.playCoinSound()
  const playLevelUpSound = () => SoundEffects.playLevelUpSound()
  const playNotificationSound = () => SoundEffects.playNotificationSound()

  return {
    playCoinSound,
    playLevelUpSound,
    playNotificationSound
  }
}
