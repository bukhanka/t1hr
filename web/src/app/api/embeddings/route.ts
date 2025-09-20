import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { openai, MODELS } from '@/lib/openai'
import { z } from 'zod'

const embeddingRequestSchema = z.object({
  text: z.string().min(1, 'Текст для векторизации не может быть пустым'),
  model: z.string().optional().default(MODELS.EMBEDDINGS)
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Необходима авторизация' }, 
        { status: 401 }
      )
    }

    const body = await request.json()
    const validation = embeddingRequestSchema.safeParse(body)
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Некорректные данные', details: validation.error.errors },
        { status: 400 }
      )
    }

    const { text, model } = validation.data

    // Вызываем SciBox API для получения эмбеддинга
    const embeddingResponse = await openai.embeddings.create({
      model: model,
      input: text,
    })

    const embedding = embeddingResponse.data[0]?.embedding

    if (!embedding) {
      return NextResponse.json(
        { error: 'Не удалось получить эмбеддинг' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      embedding: embedding,
      dimensions: embedding.length,
      model: model,
      usage: embeddingResponse.usage
    })

  } catch (error) {
    console.error('Ошибка при генерации эмбеддинга:', error)
    
    // Более информативная обработка ошибок SciBox API
    if (error instanceof Error && error.message.includes('404')) {
      return NextResponse.json(
        { error: 'Модель эмбеддингов недоступна. Проверьте настройки SciBox API' },
        { status: 503 }
      )
    }

    return NextResponse.json(
      { error: 'Внутренняя ошибка при генерации эмбеддинга' },
      { status: 500 }
    )
  }
}
