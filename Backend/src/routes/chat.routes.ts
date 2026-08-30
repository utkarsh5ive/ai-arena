import { Router, type Response } from 'express'
import { verifyToken, type AuthRequest } from '../middleware/auth.middleware.js'
import runGraph from '../ai/graph.ai.js'
import Chat from '../models/chat.model.js'
import mongoose from 'mongoose'

const router = Router()

/* ── POST /chat/invoke (protected) ── */
router.post('/invoke', verifyToken, async (req: AuthRequest, res: Response) => {
    try {
        const { input } = req.body as { input?: string }
        if (!input) {
            res.status(400).json({ success: false, message: 'Input is required.' })
            return
        }

        const result = await runGraph(input)

        // Save to MongoDB
        const chat = await Chat.create({
            userId: new mongoose.Types.ObjectId(req.user!.id),
            question: input,
            result
        })

        res.status(200).json({
            success: true,
            message: 'Graph executed successfully.',
            chatId: chat._id.toString(),
            result
        })
    } catch (error) {
        console.error('Chat invoke error:', error)
        res.status(500).json({ success: false, message: 'Failed to execute graph.', error: error instanceof Error ? error.message : String(error) })
    }
})

/* ── GET /chat/history (protected) ── */
router.get('/history', verifyToken, async (req: AuthRequest, res: Response) => {
    try {
        const chats = await Chat.find(
            { userId: new mongoose.Types.ObjectId(req.user!.id) },
            { question: 1, result: 1, createdAt: 1 }
        ).sort({ createdAt: 1 })

        res.status(200).json({ success: true, history: chats })
    } catch (error) {
        console.error('History fetch error:', error)
        res.status(500).json({ success: false, message: 'Failed to fetch history.' })
    }
})

/* ── DELETE /chat/:id (protected) ── */
router.delete('/:id', verifyToken, async (req: AuthRequest, res: Response) => {
    try {
        const id = String(req.params['id'] ?? '')

        if (!mongoose.Types.ObjectId.isValid(id)) {
            res.status(400).json({ success: false, message: 'Invalid chat ID.' })
            return
        }

        // Only delete if it belongs to the requesting user
        const deleted = await Chat.findOneAndDelete({
            _id: new mongoose.Types.ObjectId(id),
            userId: new mongoose.Types.ObjectId(req.user!.id)
        })

        if (!deleted) {
            res.status(404).json({ success: false, message: 'Chat not found or not yours.' })
            return
        }

        res.status(200).json({ success: true, message: 'Chat deleted.' })
    } catch (error) {
        console.error('Delete chat error:', error)
        res.status(500).json({ success: false, message: 'Failed to delete chat.' })
    }
})

export default router
