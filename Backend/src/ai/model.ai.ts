import { ChatGoogle } from '@langchain/google'
import { ChatMistralAI } from '@langchain/mistralai'
import { ChatCohere } from '@langchain/cohere'
import config from '../config/config.js'

export const geminiModel = new ChatGoogle({
    model: 'gemini-2.5-flash',
    apiKey: config.GOOGLE_API_KEY,
})

// Separate judge model with higher temperature so scores vary per question
export const geminiJudgeModel = new ChatGoogle({
    model: 'gemini-2.5-flash',
    apiKey: config.GOOGLE_API_KEY,
    temperature: 0.7,
})

export const mistralAIModel = new ChatMistralAI({
    model: 'mistral-small-latest',
    apiKey: config.MISTRAL_API_KEY,
})

export const cohereModel = new ChatCohere({
    model: 'command-a-03-2025',
    apiKey: config.COHERE_API_KEY,
})
