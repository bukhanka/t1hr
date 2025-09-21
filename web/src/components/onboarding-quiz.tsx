"use client"

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { 
  MessageCircle, 
  Send, 
  Loader2, 
  User, 
  Bot, 
  Coins,
  Trophy,
  Sparkles,
  CheckCircle
} from 'lucide-react'
import { useToast } from '@/providers/toast-provider'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface OnboardingStats {
  skillsExtracted: number
  tCoinsEarned: number
  progress: number
}

interface OnboardingQuizProps {
  onComplete?: (stats: OnboardingStats) => void
}

export function OnboardingQuiz({ onComplete }: OnboardingQuizProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [isStarted, setIsStarted] = useState(false)
  const [progress, setProgress] = useState(0)
  const [stats, setStats] = useState<OnboardingStats>({
    skillsExtracted: 0,
    tCoinsEarned: 0,
    progress: 0
  })
  
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const startOnboarding = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/onboarding/start', {
        method: 'POST'
      })

      if (!response.ok) {
        throw new Error('Не удалось запустить онбординг')
      }

      const data = await response.json()
      
      setSessionId(data.sessionId)
      setIsStarted(true)
      
      // Добавляем приветственное сообщение
      const welcomeMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: data.welcomeMessage,
        timestamp: new Date()
      }
      
      setMessages([welcomeMessage])
      setProgress(10) // Стартовый прогресс

      toast({
        title: "Онбординг запущен! 🚀",
        description: `Добро пожаловать! Текущий баланс: ${data.profile.tCoins} T-Coins`,
        variant: "default"
      })

    } catch (error) {
      console.error('Ошибка запуска онбординга:', error)
      toast({
        title: "Ошибка",
        description: "Не удалось запустить онбординг. Попробуйте еще раз.",
        variant: "error"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const sendMessage = async () => {
    if (!input.trim() || isLoading || !sessionId) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/onboarding/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage.content,
          sessionId
        })
      })

      if (!response.ok) {
        throw new Error('Ошибка при отправке сообщения')
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (reader) {
        let assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: '',
          timestamp: new Date()
        }

        setMessages(prev => [...prev, assistantMessage])

        while (true) {
          const { value, done } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value, { stream: true })
          const lines = chunk.split('\n')

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6))
                
                if (data.content) {
                  assistantMessage.content += data.content
                  setMessages(prev => prev.map(msg => 
                    msg.id === assistantMessage.id 
                      ? { ...msg, content: assistantMessage.content }
                      : msg
                  ))
                } else if (data.done) {
                  // Обновляем статистику на основе извлеченных данных
                  if (data.extractedData) {
                    const newStats = {
                      skillsExtracted: stats.skillsExtracted + data.extractedData.skillsExtracted,
                      tCoinsEarned: stats.tCoinsEarned + (data.extractedData.skillsExtracted * 25),
                      progress: Math.min(progress + 15, 100)
                    }
                    setStats(newStats)
                    setProgress(newStats.progress)

                    if (data.extractedData.skillsExtracted > 0) {
                      toast({
                        title: `Навыки добавлены! +${data.extractedData.skillsExtracted * 25} T-Coins`,
                        description: `Обнаружены навыки: ${data.extractedData.skills.join(', ')}`,
                        variant: "default"
                      })
                    }
                  }
                  
                  // Проверяем, завершен ли онбординг
                  if (progress >= 90) {
                    // Отправляем запрос для завершения онбординга
                    fetch('/api/onboarding/complete', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ sessionId })
                    }).then(response => response.json()).then(result => {
                      if (result.success) {
                        setTimeout(() => {
                          onComplete?.(stats)
                          toast({
                            title: "Онбординг завершен! 🎉",
                            description: `Вы получили ${stats.tCoinsEarned + 200} T-Coins и заполнили профиль на 60%`,
                            variant: "default"
                          })
                        }, 2000)
                      }
                    })
                  }
                }
              } catch (e) {
                console.error('Ошибка парсинга JSON:', e)
              }
            }
          }
        }
      }

    } catch (error) {
      console.error('Ошибка отправки сообщения:', error)
      toast({
        title: "Ошибка",
        description: "Не удалось отправить сообщение",
        variant: "error"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  if (!isStarted) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <Bot className="h-16 w-16 text-blue-600" />
              <Sparkles className="h-6 w-6 text-yellow-500 absolute -top-1 -right-1" />
            </div>
          </div>
          <CardTitle className="text-2xl mb-2">
            Добро пожаловать в T1! 🚀
          </CardTitle>
          <p className="text-muted-foreground">
            Давайте за 5-7 минут создадим ваш идеальный профиль и найдем лучшие возможности в компании
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Награды за онбординг */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6">
            <h3 className="font-semibold mb-4 flex items-center">
              <Trophy className="h-5 w-5 mr-2 text-yellow-600" />
              Что вы получите:
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Badge variant="secondary" className="flex items-center">
                  <Coins className="h-3 w-3 mr-1 text-yellow-600" />
                  200 T-Coins
                </Badge>
                <span className="text-sm">за завершение</span>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="secondary" className="flex items-center">
                  <Coins className="h-3 w-3 mr-1 text-yellow-600" />
                  +50 бонус
                </Badge>
                <span className="text-sm">за скорость</span>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="secondary">
                  📈 60% профиля
                </Badge>
                <span className="text-sm">мгновенно</span>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="secondary">
                  🎯 Личный план
                </Badge>
                <span className="text-sm">развития</span>
              </div>
            </div>
          </div>

          {/* Кнопка старта */}
          <div className="text-center">
            <Button 
              size="lg" 
              onClick={startOnboarding}
              disabled={isLoading}
              className="px-8 py-3"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Запускаем...
                </>
              ) : (
                <>
                  <MessageCircle className="h-5 w-5 mr-2" />
                  Начать онбординг
                </>
              )}
            </Button>
          </div>

          <div className="text-center text-sm text-muted-foreground">
            Время прохождения: 5-7 минут
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-4xl mx-auto h-[700px] flex flex-col">
      <CardHeader className="shrink-0">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <Bot className="h-6 w-6 text-blue-600" />
            <div>
              <CardTitle className="text-lg">ИИ-Онбординг</CardTitle>
              <p className="text-sm text-muted-foreground">
                Создаем ваш профиль за {Math.ceil((100 - progress) * 0.05)} минут
              </p>
            </div>
          </div>
          
          {/* Статистика */}
          <div className="flex space-x-4">
            <Badge variant="outline" className="flex items-center">
              <Coins className="h-3 w-3 mr-1 text-yellow-600" />
              +{stats.tCoinsEarned}
            </Badge>
            <Badge variant="outline">
              {stats.skillsExtracted} навыков
            </Badge>
          </div>
        </div>

        {/* Прогресс-бар */}
        <div className="space-y-2">
          <Progress value={progress} className="w-full" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Прогресс онбординга</span>
            <span>{progress}%</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col min-h-0">
        {/* Чат сообщения */}
        <ScrollArea className="flex-1 pr-4" ref={scrollAreaRef}>
          <div className="space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`flex max-w-[80%] ${
                    msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                  } items-start space-x-2`}
                >
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                    msg.role === 'user' 
                      ? 'bg-blue-600 ml-2' 
                      : 'bg-gray-200 mr-2'
                  }`}>
                    {msg.role === 'user' ? (
                      <User className="w-4 h-4 text-white" />
                    ) : (
                      <Bot className="w-4 h-4 text-gray-600" />
                    )}
                  </div>
                  <div
                    className={`rounded-lg px-4 py-2 ${
                      msg.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    {msg.role === 'assistant' ? (
                      <div className="text-sm leading-relaxed prose prose-sm max-w-none">
                        <ReactMarkdown 
                          remarkPlugins={[remarkGfm]}
                          components={{
                            p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                            ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
                            ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
                            li: ({ children }) => <li className="text-sm">{children}</li>,
                            strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                            em: ({ children }) => <em className="italic">{children}</em>,
                            code: ({ children }) => <code className="bg-gray-200 px-1 py-0.5 rounded text-xs font-mono">{children}</code>,
                            pre: ({ children }) => <pre className="bg-gray-200 p-2 rounded text-xs font-mono overflow-x-auto mb-2">{children}</pre>,
                            blockquote: ({ children }) => <blockquote className="border-l-4 border-gray-300 pl-3 italic mb-2">{children}</blockquote>,
                            h1: ({ children }) => <h1 className="text-lg font-bold mb-2">{children}</h1>,
                            h2: ({ children }) => <h2 className="text-base font-bold mb-2">{children}</h2>,
                            h3: ({ children }) => <h3 className="text-sm font-bold mb-1">{children}</h3>,
                          }}
                        >
                          {msg.content}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <div className="text-sm whitespace-pre-wrap">{msg.content}</div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Поле ввода */}
        <div className="flex space-x-2 mt-4">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Напишите ваш ответ..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button 
            onClick={sendMessage} 
            disabled={isLoading || !input.trim()}
            size="icon"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
        
        {progress >= 90 && (
          <div className="mt-4 p-4 bg-green-50 rounded-lg flex items-center justify-center">
            <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
            <span className="text-green-700 font-medium">
              Онбординг скоро завершится! Получите свои награды 🎉
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
