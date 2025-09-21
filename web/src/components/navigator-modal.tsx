"use client"

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Send, Loader2, Bot, History } from 'lucide-react'
import { useSession } from 'next-auth/react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

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

interface NavigatorModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  triggerSource?: string // Откуда был вызван Навигатор
}

export function NavigatorModal({ isOpen, onOpenChange, triggerSource }: NavigatorModalProps) {
  const { data: session } = useSession()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Инициализация при открытии модального окна
  useEffect(() => {
    if (isOpen && !isInitialized) {
      initializeChat()
      setIsInitialized(true)
    }
  }, [isOpen, isInitialized])

  const initializeChat = async () => {
    // Загружаем последние сессии чата
    await loadChatSessions()
    
    // Проверяем, есть ли активная сессия в localStorage
    const savedSessionId = localStorage.getItem('navigator_session_id')
    if (savedSessionId) {
      await loadChatSession(savedSessionId)
    } else {
      // Начинаем с приветственного сообщения
      startWelcomeChat()
    }
  }

  const loadChatSessions = async () => {
    try {
      const response = await fetch('/api/ai/chat/sessions')
      if (response.ok) {
        const sessions = await response.json()
        setChatSessions(sessions.slice(0, 5)) // Последние 5 сессий
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
    const welcomeMessage = getContextualWelcome()
    
    setMessages([{
      id: '1',
      role: 'assistant',
      content: welcomeMessage,
      timestamp: new Date()
    }])
    setCurrentSessionId(null)
  }

  const getContextualWelcome = () => {
    const name = session?.user?.name ? session.user.name.split(' ')[0] : ''
    const greeting = `Привет${name ? `, ${name}` : ''}!`
    
    const contextMessages = {
      'profile': 'Могу помочь улучшить ваш профиль.',
      'dashboard': 'Готов помочь с карьерным развитием.',
      'projects': 'Могу подсказать подходящие проекты.',
      default: 'Готов ответить на ваши вопросы.'
    }

    const contextMessage = contextMessages[triggerSource as keyof typeof contextMessages] || contextMessages.default

    return `${greeting} Я Навигатор - ваш ИИ-консультант по карьере.

${contextMessage}

О чем хотели бы поговорить?`
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

    try {
      const requestBody: any = {
        message: userMessage.content,
        context: {
          triggerSource,
          timestamp: new Date().toISOString()
        }
      }
      
      // Добавляем sessionId только если он не null
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
                  // Обновляем список сессий
                  await loadChatSessions()
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
    startWelcomeChat()
  }

  const quickActions = [
    {
      label: 'Подходящие проекты',
      query: 'Какие проекты сейчас подходят для моих навыков и целей развития?',
      icon: '🎯'
    },
    {
      label: 'Улучшить профиль',
      query: 'Как улучшить мой профиль, чтобы получить больше XP и привлечь внимание к своим навыкам?',
      icon: '📈'
    },
    {
      label: 'План развития',
      query: 'Составь персональный план развития на полгода с учетом моих целей',
      icon: '🗺️'
    },
    {
      label: 'Карьерные возможности',
      query: 'Какие карьерные возможности открываются с моими текущими навыками?',
      icon: '🚀'
    }
  ]

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[85vh] p-0">
        <DialogHeader className="p-4 pb-0 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Bot className="h-5 w-5 text-blue-600" />
              <DialogTitle className="text-base font-medium">
                Навигатор
              </DialogTitle>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setShowHistory(!showHistory)}
                className="text-xs"
              >
                <History className="w-4 h-4 mr-1" />
                История
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={startNewChat}
                className="text-xs"
              >
                Новый чат
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => {
                  // Сохраняем текущую сессию и переходим на полноэкранную страницу
                  if (currentSessionId) {
                    localStorage.setItem('navigator_session_id', currentSessionId)
                  }
                  onOpenChange(false) // Закрываем модальное окно
                  window.open('/chat', '_blank') // Открываем в новой вкладке
                }}
                className="text-xs"
                title="Открыть в полном экране"
              >
                ⛶
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar с историей */}
          {showHistory && (
            <div className="w-56 border-r bg-gray-50/50 p-3">
              <h3 className="text-sm font-medium mb-2 text-gray-600">Недавние чаты</h3>
              <div className="space-y-1">
                {chatSessions.map((session) => (
                  <button
                    key={session.id}
                    onClick={() => loadChatSession(session.id)}
                    className={`w-full text-left p-2 rounded text-xs hover:bg-gray-100 transition-colors ${
                      currentSessionId === session.id ? 'bg-blue-50 border border-blue-200' : 'bg-white'
                    }`}
                  >
                    <div className="font-medium truncate">{session.title}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {session.messageCount} сообщ.
                    </div>
                  </button>
                ))}
                {chatSessions.length === 0 && (
                  <div className="text-xs text-gray-500 text-center py-3">
                    Нет чатов
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Основная область чата */}
          <div className="flex-1 flex flex-col">
            {isLoadingHistory ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                  <p className="text-muted-foreground">Загружаю историю чата...</p>
                </div>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto p-4">
                  <div className="space-y-3">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[75%] rounded-lg px-3 py-2 ${
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
                        <div className="bg-gray-100 border rounded-lg px-3 py-2 max-w-[75%]">
                          <div className="flex items-center space-x-2">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            <span className="text-sm text-gray-600">печатает...</span>
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                </div>

                {/* Быстрые действия - показываем только в начале диалога */}
                {messages.length <= 1 && !isLoading && (
                  <div className="px-4 pb-3">
                    <div className="grid grid-cols-2 gap-2">
                      {quickActions.slice(0, 4).map((action) => (
                        <Button
                          key={action.label}
                          variant="outline"
                          size="sm"
                          onClick={() => setInput(action.query)}
                          disabled={isLoading}
                          className="justify-start h-8 text-xs"
                        >
                          <span className="mr-1 text-xs">{action.icon}</span>
                          <span className="truncate">{action.label}</span>
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Фиксированное поле ввода */}
                <div className="flex-shrink-0 border-t p-4 bg-white">
                  <div className="flex space-x-2">
                    <Input
                      placeholder="Напишите сообщение..."
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
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
