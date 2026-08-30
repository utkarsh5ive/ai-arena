import express from 'express'
import cors from 'cors'
import { connectDB } from './db/db.js'
import authRoutes from './routes/auth.routes.js'
import chatRoutes from './routes/chat.routes.js'

const app = express()

// CORS — allow Vite dev server and direct access
const corsOptions = {
    origin: true, // reflect origin (allows any origin in dev)
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}

app.use(cors(corsOptions))
app.use(express.json())

// Connect to MongoDB
connectDB().catch((err) => {
    console.error('Failed to connect to MongoDB:', err.message)
})

// Routes
app.use('/auth', authRoutes)
app.use('/chat', chatRoutes)

export default app