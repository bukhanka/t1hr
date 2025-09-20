import OpenAI from 'openai'

export const openai = new OpenAI({
  apiKey: process.env.SCIBOX_API_KEY!,
  baseURL: process.env.SCIBOX_API_BASE_URL || 'https://llm.t1v.scibox.tech/v1',
})

// Модели доступные в SciBox согласно инструкции
export const MODELS = {
  CHAT: 'Qwen2.5-72B-Instruct-AWQ',
  EMBEDDINGS: 'bge-m3',
} as const

export type ChatModel = typeof MODELS.CHAT
export type EmbeddingsModel = typeof MODELS.EMBEDDINGS
