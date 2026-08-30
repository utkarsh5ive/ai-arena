import { useState, useCallback } from 'react'
import axios from 'axios'

// Use Vite proxy (/api → localhost:3000) to avoid CORS in dev
const API_BASE_URL = '/api'

export interface AuthUser {
    id: string
    username: string
    email: string
}

interface AuthState {
    user: AuthUser | null
    token: string | null
}

function loadAuthState(): AuthState {
    try {
        const token = localStorage.getItem('arena_token')
        const userRaw = localStorage.getItem('arena_user')
        if (token && userRaw) {
            return { token, user: JSON.parse(userRaw) }
        }
    } catch { /* ignore */ }
    return { token: null, user: null }
}

export function useAuth() {
    const [auth, setAuth] = useState<AuthState>(loadAuthState)

    const persist = useCallback((token: string, user: AuthUser) => {
        localStorage.setItem('arena_token', token)
        localStorage.setItem('arena_user', JSON.stringify(user))
        setAuth({ token, user })
    }, [])

    const signup = useCallback(async (username: string, email: string, password: string) => {
        const res = await axios.post(`${API_BASE_URL}/auth/signup`, { username, email, password })
        persist(res.data.token, res.data.user)
    }, [persist])

    const login = useCallback(async (email: string, password: string) => {
        const res = await axios.post(`${API_BASE_URL}/auth/login`, { email, password })
        persist(res.data.token, res.data.user)
    }, [persist])

    const logout = useCallback(() => {
        localStorage.removeItem('arena_token')
        localStorage.removeItem('arena_user')
        setAuth({ token: null, user: null })
    }, [])

    return { user: auth.user, token: auth.token, signup, login, logout }
}
