import express from 'express'
import runGraph from './ai/graph.ai.js'

const app = express()

app.get('/', async (req, res) => {
    try {
        const result = await runGraph("What should we eat during diarrhea?")
        res.json(result)
    } catch (error) {
        console.error("Error running graph:", error)
        res.status(500).json({ error: error instanceof Error ? error.message : String(error) })
    }
})

export default app