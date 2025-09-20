import OpenAI from 'openai'

// Модели доступные в SciBox согласно инструкции
export const MODELS = {
  CHAT: 'Qwen2.5-72B-Instruct-AWQ',
  EMBEDDINGS: 'bge-m3',
} as const

export type ChatModel = typeof MODELS.CHAT
export type EmbeddingsModel = typeof MODELS.EMBEDDINGS

// Lazy initialization to avoid issues during build time
let _openai: OpenAI | null = null

export function getOpenAI(): OpenAI {
  if (!_openai) {
    const apiKey = process.env.SCIBOX_API_KEY
    if (!apiKey) {
      throw new Error('Missing credentials. Please pass an `apiKey`, or set the `SCIBOX_API_KEY` environment variable.')
    }
    
    _openai = new OpenAI({
      apiKey,
      baseURL: process.env.SCIBOX_API_BASE_URL || 'https://llm.t1v.scibox.tech/v1',
    })
  }
  return _openai
}

// For backward compatibility
export const openai = {
  get chat() {
    return getOpenAI().chat
  },
  get embeddings() {
    return getOpenAI().embeddings
  }
}
