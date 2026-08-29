import { ChatGoogle } from '@langchain/google'
import { ChatMistralAI } from '@langchain/mistralai'
import { ChatCohere } from '@langchain/cohere'
import config from '../config/config.js'

export const geminiModel = new ChatGoogle({
    modelName: 'gemini-1.5-flash',
    apiKey: config.GOOGLE_API_KEY,
})

export const mistralAIModel = new ChatMistralAI({
    model: 'mistral-small-latest',
    apiKey: config.MISTRAL_API_KEY,
})

export const cohereModel = new ChatCohere({
    model: 'command-a-03-2025',
    apiKey: config.COHERE_API_KEY,
})






