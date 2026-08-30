import { type Request, type Response, type NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import config from '../config/config.js'

export interface AuthRequest extends Request {
    user?: { id: string; username: string; email: string }
}

export function verifyToken(req: AuthRequest, res: Response, next: NextFunction): void {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ success: false, message: 'No token provided.' })
        return
    }

    const token = authHeader.split(' ')[1]
    const secret: string = config.JWT_SECRET
    try {
        const decoded = jwt.verify(token!, secret) as unknown as { id: string; username: string; email: string }
        req.user = decoded
        next()
    } catch {
        res.status(401).json({ success: false, message: 'Invalid or expired token.' })
    }
}

