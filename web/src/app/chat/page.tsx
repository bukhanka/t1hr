"use client"

import { useState, useRef, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Send, Loader2, Bot, History, ArrowLeft, TrendingUp, Target, Book, Users, Zap } from 'lucide-react'
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { TCoinRewardNotification } from '@/components/tcoin-reward-notification'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface ChatSession {
  id: string
  title: string
  createdAt: string
  messageCount: number
}

export default function FullscreenChat() {
  const { data: session, status } = useSession()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
  const [showTopics, setShowTopics] = useState(true)
  const [rewardInfo, setRewardInfo] = useState<{
    tcoinsEarned: number
    xpEarned: number
    newTotal: number
    levelUp?: boolean
  } | null>(null)
  
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Топ тематики для быстрого доступа
  const topTopics = [
    {
      id: 'profile',
      title: 'Улучшение профиля',
      description: 'Советы по заполнению профиля',
      icon: Target,
      query: 'Как улучшить мой профиль, чтобы получить больше XP и привлечь внимание к своим навыкам?',
      color: 'bg-blue-100 text-blue-800'
    },
    {
      id: 'projects',
      title: 'Поиск проектов',
      description: 'Найти подходящие проекты',
      icon: Book,
      query: 'Какие проекты сейчас подходят для моих навыков и целей развития?',
      color: 'bg-green-100 text-green-800'
    },
    {
      id: 'career',
      title: 'План карьеры',
      description: 'Построить план развития',
      icon: TrendingUp,
      query: 'Составь персональный план развития на полгода с учетом моих целей',
      color: 'bg-purple-100 text-purple-800'
    },
    {
      id: 'skills',
      title: 'Развитие навыков',
      description: 'Изучить новые технологии',
      icon: Zap,
      query: 'Какие навыки мне стоит изучить для карьерного роста?',
      color: 'bg-orange-100 text-orange-800'
    },
    {
      id: 'team',
      title: 'Работа в команде',
      description: 'Найти коллег и менторов',
      icon: Users,
      query: 'Как найти коллег с похожими интересами или ментора в компании?',
      color: 'bg-pink-100 text-pink-800'
    }
  ]

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (status === "loading") return
    if (!session) redirect("/auth/signin")
    
    initializeChat()
  }, [session, status])

  const initializeChat = async () => {
    await loadChatSessions()
    
    const savedSessionId = localStorage.getItem('navigator_session_id')
    if (savedSessionId) {
      await loadChatSession(savedSessionId)
    } else {
      startWelcomeChat()
    }
  }

  const loadChatSessions = async () => {
    try {
      const response = await fetch('/api/ai/chat/sessions')
      if (response.ok) {
        const sessions = await response.json()
        setChatSessions(sessions.slice(0, 5))
      }
    } catch (error) {
      console.error('Ошибка загрузки сессий:', error)
    }
  }

  const loadChatSession = async (sessionId: string) => {
    setIsLoadingHistory(true)
    try {
      const response = await fetch(`/api/ai/chat/sessions/${sessionId}`)
      if (response.ok) {
        const session = await response.json()
        
        const loadedMessages: Message[] = session.messages.map((msg: any) => ({
          id: msg.id,
          role: msg.role.toLowerCase() as 'user' | 'assistant',
          content: msg.content,
          timestamp: new Date(msg.createdAt)
        }))
        
        setMessages(loadedMessages)
        setCurrentSessionId(sessionId)
        localStorage.setItem('navigator_session_id', sessionId)
      }
    } catch (error) {
      console.error('Ошибка загрузки сессии:', error)
    } finally {
      setIsLoadingHistory(false)
    }
  }

  const startWelcomeChat = () => {
    const name = session?.user?.name ? session.user.name.split(' ')[0] : ''
    const welcomeMessage = `Привет${name ? `, ${name}` : ''}! Я Навигатор - ваш ИИ-консультант по карьере.

Готов помочь с карьерным развитием.

О чем хотели бы поговорить?`
    
    setMessages([{
      id: '1',
      role: 'assistant',
      content: welcomeMessage,
      timestamp: new Date()
    }])
    setCurrentSessionId(null)
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
          triggerSource: 'fullscreen',
          timestamp: new Date().toISOString()
        }
      }
      
      if (currentSessionId) {
        requestBody.sessionId = currentSessionId
      }

      console.log('🚀 Отправляем запрос к Навигатору:', requestBody)

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
                  localStorage.setItem('navigator_session_id', data.sessionId)
                  await loadChatSessions()
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
    setInput('')
    setIsLoading(true)
    setShowTopics(false) // Скрываем темы после отправки сообщения

    try {
      const requestBody: any = {
        message: userMessage.content,
        context: {
          triggerSource: 'fullscreen',
          timestamp: new Date().toISOString()
        }
      }
      
      if (currentSessionId) {
        requestBody.sessionId = currentSessionId
      }

      console.log('🚀 Отправляем запрос к Навигатору:', requestBody)

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
                  localStorage.setItem('navigator_session_id', data.sessionId)
                  await loadChatSessions()
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

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const startNewChat = () => {
    setMessages([])
    setCurrentSessionId(null)
    localStorage.removeItem('navigator_session_id')
    setShowHistory(false)
    setShowTopics(true)
    startWelcomeChat()
  }

  const handleRewardComplete = () => {
    setRewardInfo(null)
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* Фиксированный заголовок */}
      <header className="flex-shrink-0 bg-white border-b px-4 py-3 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-1" />
                Назад
              </Button>
            </Link>
            <Bot className="h-6 w-6 text-blue-600" />
            <h1 className="text-lg font-semibold">Навигатор</h1>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setShowTopics(!showTopics)}
            >
              <TrendingUp className="w-4 h-4 mr-1" />
              Темы
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setShowHistory(!showHistory)}
            >
              <History className="w-4 h-4 mr-1" />
              История
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={startNewChat}
            >
              Новый чат
            </Button>
          </div>
        </div>
      </header>

      {/* Основное содержимое */}
      <div className="flex-1 max-w-6xl mx-auto w-full flex overflow-hidden">
        {/* Sidebar с историей */}
        {showHistory && (
          <div className="flex-shrink-0 w-64 bg-white border-r flex flex-col">
            <div className="p-4 border-b">
              <h3 className="font-medium">Недавние чаты</h3>
            </div>
            <div className="flex-1 p-4 overflow-y-auto">
              <div className="space-y-2">
                {chatSessions.map((session) => (
                  <button
                    key={session.id}
                    onClick={() => loadChatSession(session.id)}
                    className={`w-full text-left p-2 rounded text-sm hover:bg-gray-100 transition-colors ${
                      currentSessionId === session.id ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50'
                    }`}
                  >
                    <div className="font-medium truncate">{session.title}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {session.messageCount} сообщ.
                    </div>
                  </button>
                ))}
                {chatSessions.length === 0 && (
                  <div className="text-sm text-gray-500 text-center py-3">
                    Нет чатов
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Основная область чата */}
        <div className="flex-1 bg-white flex flex-col min-h-0">
          {isLoadingHistory ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                <p className="text-gray-500">Загружаю историю чата...</p>
              </div>
            </div>
          ) : (
            <>
              {/* Сообщения */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-4 max-w-4xl mx-auto">
                  {/* Топ тематики - показываем только если нет сообщений или только приветствие */}
                  {showTopics && (messages.length === 0 || (messages.length === 1 && messages[0].role === 'assistant')) && (
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold mb-4 text-center">Популярные темы для обсуждения</h3>
                      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                        {topTopics.map((topic) => {
                          const IconComponent = topic.icon
                          return (
                            <Card 
                              key={topic.id} 
                              className="cursor-pointer hover:shadow-md transition-shadow border-2 hover:border-blue-300"
                              onClick={() => handleTopicClick(topic.query)}
                            >
                              <CardContent className="p-4">
                                <div className="flex items-start space-x-3">
                                  <div className={`p-2 rounded-lg ${topic.color}`}>
                                    <IconComponent className="h-4 w-4" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-medium text-sm mb-1">{topic.title}</h4>
                                    <p className="text-xs text-gray-600 line-clamp-2">{topic.description}</p>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          )
                        })}
                      </div>
                    </div>
                  )}
                  
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-lg px-4 py-3 ${
                          message.role === 'user'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-900 border'
                        }`}
                      >
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
                      <div className="bg-gray-100 border rounded-lg px-4 py-3 max-w-[70%]">
                        <div className="flex items-center space-x-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="text-sm text-gray-600">Навигатор печатает...</span>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </div>

              {/* Фиксированное поле ввода */}
              <div className="flex-shrink-0 border-t bg-white p-6">
                <div className="max-w-4xl mx-auto">
                  <div className="flex space-x-3">
                    <Input
                      placeholder="Напишите сообщение Навигатору..."
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyPress={handleKeyPress}
                      disabled={isLoading}
                      className="flex-1"
                    />
                    <Button 
                      onClick={sendMessage} 
                      disabled={isLoading || !input.trim()}
                    >
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Уведомление о наградах */}
      <TCoinRewardNotification 
        rewards={rewardInfo}
        onComplete={handleRewardComplete}
      />
    </div>
  )
}
