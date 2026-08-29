import express from 'express'
import cors from 'cors'
import runGraph from './ai/graph.ai.js'

const app = express()

app.use(cors())
app.use(express.json())

app.get('/', async (req, res) => {
    try {
        const result = await runGraph("What should we eat during diarrhea?")
        res.json(result)
    } catch (error) {
        console.error("Error running graph:", error)
        res.status(500).json({ error: error instanceof Error ? error.message : String(error) })
    }
})

app.post('/invoke', async (req, res) => {
    try {
        const { input } = req.body
        if (!input) {
            return res.status(400).json({
                success: false,
                message: "Input is required."
            })
        }
        const result = await runGraph(input)

        res.status(200).json({
            message: "Graph executed successfully.",
            success: true,
            result
        })
    } catch (error) {
        console.error("Error running graph:", error)
        res.status(500).json({
            success: false,
            message: "Failed to execute graph.",
            error: error instanceof Error ? error.message : String(error)
        })
    }
})

export default app