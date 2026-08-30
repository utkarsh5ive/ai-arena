import mongoose from 'mongoose'
import config from '../config/config.js'

let isConnected = false

export async function connectDB(): Promise<void> {
    if (isConnected) return

    if (!config.MONGO_URI) {
        throw new Error('MONGO_URI is not set in environment variables.')
    }

    await mongoose.connect(config.MONGO_URI)
    isConnected = true
    console.log('MongoDB connected.')
}
