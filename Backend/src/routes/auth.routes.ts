import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import User from '../models/user.model.js'
import config from '../config/config.js'
import type { Request, Response } from 'express'

const router = Router()

/* ── POST /auth/signup ── */
router.post('/signup', async (req: Request, res: Response) => {
    try {
        const { username, email, password } = req.body as {
            username?: string
            email?: string
            password?: string
        }

        if (!username || !email || !password) {
            res.status(400).json({ success: false, message: 'All fields are required.' })
            return
        }

        const existing = await User.findOne({ $or: [{ email }, { username }] })
        if (existing) {
            res.status(409).json({ success: false, message: 'Username or email already taken.' })
            return
        }

        const passwordHash = await bcrypt.hash(password, 10)
        const user = await User.create({ username: username.trim(), email: email.trim().toLowerCase(), passwordHash })

        const secret = String(config.JWT_SECRET)
        const token = jwt.sign(
            { id: user._id.toString(), username: user.username, email: user.email },
            secret,
            { expiresIn: '7d' }
        )

        res.status(201).json({
            success: true,
            token,
            user: { id: user._id.toString(), username: user.username, email: user.email }
        })
    } catch (error) {
        console.error('Signup error:', error)
        res.status(500).json({ success: false, message: 'Server error during signup.' })
    }
})

/* ── POST /auth/login ── */
router.post('/login', async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body as { email?: string; password?: string }

        if (!email || !password) {
            res.status(400).json({ success: false, message: 'Email and password are required.' })
            return
        }

        const user = await User.findOne({ email: email.trim().toLowerCase() })
        if (!user) {
            res.status(401).json({ success: false, message: 'Invalid email or password.' })
            return
        }

        const isMatch = await bcrypt.compare(password, user.passwordHash)
        if (!isMatch) {
            res.status(401).json({ success: false, message: 'Invalid email or password.' })
            return
        }

        const secret = String(config.JWT_SECRET)
        const token = jwt.sign(
            { id: user._id.toString(), username: user.username, email: user.email },
            secret,
            { expiresIn: '7d' }
        )

        res.status(200).json({
            success: true,
            token,
            user: { id: user._id.toString(), username: user.username, email: user.email }
        })
    } catch (error) {
        console.error('Login error:', error)
        res.status(500).json({ success: false, message: 'Server error during login.' })
    }
})

export default router
