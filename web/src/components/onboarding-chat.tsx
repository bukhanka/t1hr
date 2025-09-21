"use client"

import { useState, useRef, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Send, Loader2, Bot, User, MessageCircle, Target, Book, TrendingUp, Users, Zap } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { TCoinRewardNotification } from '@/components/tcoin-reward-notification'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface OnboardingChatProps {
  className?: string
}

export function OnboardingChat({ className }: OnboardingChatProps) {
  const { data: session } = useSession()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)
  const [showTopics, setShowTopics] = useState(true)
  const [rewardInfo, setRewardInfo] = useState<{
    tcoinsEarned: number
    xpEarned: number
    newTotal: number
    levelUp?: boolean
  } | null>(null)
  
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Топики специально для онбординга
  const onboardingTopics = [
    {
      id: 'welcome',
      title: 'Добро пожаловать!',
      description: 'Расскажи о процессе онбординга',
      icon: Target,
      query: 'Расскажи подробнее о процессе онбординга в SciBox Talent. Что меня ждет?',
      color: 'bg-blue-100 text-blue-800'
    },
    {
      id: 'profile_setup',
      title: 'Настройка профиля',
      description: 'Как правильно заполнить профиль',
      icon: User,
      query: 'Как правильно заполнить свой профиль, чтобы получать релевантные рекомендации?',
      color: 'bg-green-100 text-green-800'
    },
    {
      id: 'company_info',
      title: 'О компании',
      description: 'Узнать больше о компании',
      icon: Book,
      query: 'Расскажи о компании, её культуре и возможностях для развития',
      color: 'bg-purple-100 text-purple-800'
    },
    {
      id: 'first_steps',
      title: 'Первые шаги',
      description: 'Что делать после онбординга',
      icon: TrendingUp,
      query: 'Какие первые шаги мне стоит предпринять после завершения онбординга?',
      color: 'bg-orange-100 text-orange-800'
    }
  ]

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (session && messages.length === 0) {
      startWelcomeChat()
    }
  }, [session])

  const startWelcomeChat = () => {
    const name = session?.user?.name ? session.user.name.split(' ')[0] : ''
    const welcomeMessage = `Привет${name ? `, ${name}` : ''}! 👋

Я Навигатор - ваш ИИ-ассистент, который поможет вам в процессе онбординга и адаптации в SciBox Talent.

Готов ответить на любые вопросы о компании, процессах, и помочь вам с первыми шагами. О чем хотели бы узнать?`
    
    setMessages([{
      id: '1',
      role: 'assistant',
      content: welcomeMessage,
      timestamp: new Date()
    }])
  }

  const handleTopicClick = (query: string) => {
    setInput(query)
    setShowTopics(false)
    // Автоматически отправляем сообщение
    setTimeout(() => {
      const userMessage: Message = {
        id: Date.now().toString(),
        role: 'user',
        content: query,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, userMessage])
      setInput('')
      setIsLoading(true)

      // Отправляем запрос
      sendMessageWithContent(query)
    }, 100)
  }

  const sendMessageWithContent = async (messageContent: string) => {
    try {
      const requestBody: any = {
        message: messageContent,
        context: {
          triggerSource: 'onboarding',
          isOnboarding: true,
          timestamp: new Date().toISOString()
        }
      }
      
      if (currentSessionId) {
        requestBody.sessionId = currentSessionId
      }

      console.log('🚀 Отправляем запрос к Навигатору (онбординг):', requestBody)

      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      })

      console.log('📡 Response status:', response.status, response.statusText)

      if (!response.ok) {
        const errorData = await response.text()
        console.error('❌ Response error:', errorData)
        throw new Error(`Ошибка при отправке сообщения: ${response.status} ${response.statusText}`)
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
                }

                if (data.done && data.sessionId) {
                  setCurrentSessionId(data.sessionId)
                }

                // Обрабатываем информацию о наградах
                if (data.rewards) {
                  setRewardInfo(data.rewards)
                }

                if (data.error) {
                  console.error('Ошибка от сервера:', data.error)
                }
              } catch (e) {
                // Игнорируем ошибки парсинга JSON
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Ошибка при отправке сообщения:', error)
      setMessages(prev => [...prev, {
        id: (Date.now() + 2).toString(),
        role: 'assistant',
        content: 'Извините, произошла ошибка при обработке вашего запроса. Попробуйте еще раз.',
        timestamp: new Date()
      }])
    } finally {
      setIsLoading(false)
    }
  }

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    const messageContent = input.trim()
    setInput('')
    setIsLoading(true)
    setShowTopics(false) // Скрываем темы после отправки сообщения

    await sendMessageWithContent(messageContent)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const handleRewardComplete = () => {
    setRewardInfo(null)
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center space-x-2">
          <Bot className="h-6 w-6 text-blue-600" />
          <div>
            <CardTitle className="text-lg">Навигатор - Помощник по онбордингу</CardTitle>
            <CardDescription>Задайте любые вопросы о компании и процессах</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Топики для быстрого доступа */}
        {showTopics && (messages.length === 0 || (messages.length === 1 && messages[0].role === 'assistant')) && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-700">Популярные вопросы:</h4>
            <div className="grid gap-2 md:grid-cols-2">
              {onboardingTopics.map((topic) => {
                const IconComponent = topic.icon
                return (
                  <Button
                    key={topic.id}
                    variant="outline"
                    size="sm"
                    className="justify-start h-auto p-3 text-left"
                    onClick={() => handleTopicClick(topic.query)}
                  >
                    <div className="flex items-start space-x-2 w-full">
                      <div className={`p-1.5 rounded ${topic.color}`}>
                        <IconComponent className="h-3 w-3" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-xs">{topic.title}</div>
                        <div className="text-xs text-gray-500 line-clamp-2">{topic.description}</div>
                      </div>
                    </div>
                  </Button>
                )
              })}
            </div>
          </div>
        )}

        {/* Область сообщений */}
        <ScrollArea className="h-96" ref={scrollAreaRef}>
          <div className="space-y-4 pr-3">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-lg px-4 py-3 ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-900 border'
                  }`}
                >
                  <div className="flex items-center space-x-2 mb-1">
                    {message.role === 'user' ? (
                      <User className="h-3 w-3" />
                    ) : (
                      <Bot className="h-3 w-3" />
                    )}
                    <span className="text-xs font-medium opacity-70">
                      {message.role === 'user' ? 'Вы' : 'Навигатор'}
                    </span>
                  </div>
                  
                  {message.role === 'assistant' ? (
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
                        {message.content}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <div className="text-sm whitespace-pre-wrap leading-relaxed">
                      {message.content}
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 border rounded-lg px-4 py-3 max-w-[85%]">
                  <div className="flex items-center space-x-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm text-gray-600">Навигатор печатает...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
        
        {/* Поле ввода */}
        <div className="border-t pt-4">
          <div className="flex space-x-2">
            <Input
              placeholder="Задайте вопрос о компании или онбординге..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isLoading}
              className="flex-1"
            />
            <Button 
              onClick={sendMessage} 
              disabled={isLoading || !input.trim()}
              size="sm"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardContent>

      {/* Уведомление о наградах */}
      <TCoinRewardNotification 
        rewards={rewardInfo}
        onComplete={handleRewardComplete}
      />
    </Card>
  )
}
