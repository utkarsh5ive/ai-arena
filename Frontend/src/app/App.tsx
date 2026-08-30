import { useState, useRef, useEffect, useCallback } from 'react'
import axios from 'axios'
import BattleArena from './BattleArena'
import AuthPage from './auth/AuthPage'
import { useAuth } from './auth/useAuth'

// Use Vite proxy (/api → localhost:3000) to avoid CORS in dev
const API_BASE_URL = '/api'

interface HistoryEntry {
    _id?: string
    question: string
    data: Record<string, unknown>
    winner: 1 | 2
}

/* ── Call Backend API (authenticated) ── */
async function callBattleAPI(question: string, token: string) {
    const response = await axios.post(
        `${API_BASE_URL}/chat/invoke`,
        { input: question },
        { headers: { Authorization: `Bearer ${token}` } }
    )
    const payload = response.data
    return payload.result || payload
}

/* ── Load chat history ── */
async function loadHistory(token: string): Promise<HistoryEntry[]> {
    const res = await axios.get(`${API_BASE_URL}/chat/history`, {
        headers: { Authorization: `Bearer ${token}` }
    })
    return (res.data.history || []).map((c: { question: string; result: Record<string, unknown>; _id?: string }) => {
        const score1 = (c.result as { judge?: { solution_core_1?: number } })?.judge?.solution_core_1 ?? 0
        const score2 = (c.result as { judge?: { solutin_core_2?: number } })?.judge?.solutin_core_2 ?? 0
        return {
            _id: c._id,
            question: c.question,
            data: c.result,
            winner: score1 >= score2 ? 1 : 2
        } as HistoryEntry
    })
}

/* ── History item ── */
function HistoryItem({ item, isActive, onClick }: { item: HistoryEntry; isActive: boolean; onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm truncate transition-colors ${
                isActive ? 'bg-white/10 text-white' : 'text-white/40 hover:bg-white/5 hover:text-white/60'
            }`}
        >
            {item.question}
        </button>
    )
}

/* ── User badge ── */
function UserBadge({ username, onLogout }: { username: string; onLogout: () => void }) {
    return (
        <div className="flex items-center gap-2 px-2 py-1.5 mt-auto border-t border-white/[0.07] pt-3">
            <div className="w-6 h-6 rounded-full bg-white/[0.1] flex items-center justify-center shrink-0">
                <span className="text-[11px] font-semibold text-white/70 uppercase">{username[0]}</span>
            </div>
            <span className="text-xs text-white/50 truncate flex-1 font-medium">{username}</span>
            <button
                id="logout-btn"
                onClick={onLogout}
                title="Logout"
                className="text-white/25 hover:text-white/60 transition-colors"
            >
                <span className="material-symbols-outlined text-base">logout</span>
            </button>
        </div>
    )
}

/* ── Main App ── */
export default function App() {
    const { user, token, logout, login, signup } = useAuth()
    const [history, setHistory] = useState<HistoryEntry[]>([])
    const [activeIndex, setActiveIndex] = useState<number | null>(null)
    const [input, setInput] = useState('')
    const [loading, setLoading] = useState(false)
    const [historyLoading, setHistoryLoading] = useState(false)
    const [errorMessage, setErrorMessage] = useState<string | null>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    const activeEntry = activeIndex !== null ? history[activeIndex] : null

    // Load history from MongoDB when user logs in
    const fetchHistory = useCallback(async () => {
        if (!token) return
        setHistoryLoading(true)
        try {
            const h = await loadHistory(token)
            setHistory(h)
            if (h.length > 0) setActiveIndex(h.length - 1)
        } catch { /* ignore */ }
        finally { setHistoryLoading(false) }
    }, [token])

    useEffect(() => {
        if (token) fetchHistory()
        else { setHistory([]); setActiveIndex(null) }
    }, [token, fetchHistory])

    async function handleSubmit() {
        const question = input.trim()
        if (!question || loading || !token) return
        setInput('')
        setErrorMessage(null)
        setLoading(true)
        try {
            const data = await callBattleAPI(question, token)
            const score1 = data?.judge?.solution_core_1 ?? 0
            const score2 = data?.judge?.solution_core_2 ?? data?.judge?.solutin_core_2 ?? 0
            const winner: 1 | 2 = score1 >= score2 ? 1 : 2
            setHistory((h) => {
                const next = [...h, { question, data, winner }]
                setActiveIndex(next.length - 1)
                return next
            })
        } catch (error: unknown) {
            const apiErr =
                (error as { response?: { data?: { error?: string; message?: string } } })?.response?.data?.error ||
                (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
                (error instanceof Error ? error.message : 'Failed to connect to backend server.')
            setErrorMessage(apiErr)
        } finally {
            setLoading(false)
        }
    }

    // Not logged in — show auth page
    if (!user || !token) {
        return <AuthPage onSuccess={() => {}} login={login} signup={signup} />
    }

    return (
        <div className="flex h-dvh bg-[#111111] text-white">

            {/* ── Sidebar ── */}
            <aside className="w-56 shrink-0 flex flex-col border-r border-white/[0.07] py-4 px-3">
                <p className="text-xs font-semibold text-white/30 uppercase tracking-widest px-2 mb-3">History</p>

                <button
                    id="new-chat-btn"
                    onClick={() => { setActiveIndex(null); setErrorMessage(null); inputRef.current?.focus() }}
                    className="flex items-center gap-2 text-sm text-white/50 hover:text-white px-2 py-1.5 rounded-lg hover:bg-white/5 transition-colors mb-4"
                >
                    <span className="material-symbols-outlined text-base">add</span>
                    New chat
                </button>

                <div className="flex-1 overflow-y-auto scroll space-y-0.5">
                    {historyLoading
                        ? <p className="text-xs text-white/20 px-2">Loading…</p>
                        : history.length === 0
                            ? <p className="text-xs text-white/20 px-2">No history yet</p>
                            : history.map((entry, i) => (
                                <HistoryItem
                                    key={entry._id || i}
                                    item={entry}
                                    isActive={i === activeIndex && !loading}
                                    onClick={() => { setErrorMessage(null); setActiveIndex(i) }}
                                />
                            ))}
                </div>

                {/* User badge + logout */}
                <UserBadge username={user.username} onLogout={logout} />
            </aside>

            {/* ── Main ── */}
            <div className="flex flex-col flex-1 min-w-0">

                {/* Header */}
                <div className="text-center py-4 border-b border-white/[0.07] shrink-0 relative">
                    <h1 className="text-base font-semibold text-white/80">AI Chat Arena</h1>
                </div>

                {/* Error Alert */}
                {errorMessage && (
                    <div className="mx-5 mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 text-sm flex items-center justify-between shrink-0">
                        <span>{errorMessage}</span>
                        <button
                            onClick={() => setErrorMessage(null)}
                            className="text-red-300/60 hover:text-red-300 text-xs px-2 py-1"
                        >
                            Dismiss
                        </button>
                    </div>
                )}

                {/* Content */}
                {loading ? (
                    <div className="flex flex-col flex-1 items-center justify-center gap-3">
                        <div className="w-8 h-8 border-2 border-white/10 border-t-white/50 rounded-full animate-spin" />
                        <p className="text-sm text-white/30">Generating solutions…</p>
                    </div>
                ) : activeEntry ? (
                    <BattleArena data={activeEntry.data} />
                ) : (
                    <div className="flex flex-col flex-1 items-center justify-center gap-2 text-center">
                        <p className="text-lg font-semibold text-white/60">AI Chat Arena</p>
                        <p className="text-sm text-white/30">Ask a question to see two AI solutions battle it out.</p>
                    </div>
                )}

                {/* Input */}
                <div className="px-5 py-4 border-t border-white/[0.07] shrink-0">
                    <div className="flex items-center gap-2 bg-[#1c1c1c] border border-white/10 rounded-xl px-4 py-2.5 focus-within:border-white/25 transition-colors">
                        <input
                            ref={inputRef}
                            id="chat-input"
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                            placeholder="Ask a question…"
                            disabled={loading}
                            autoFocus
                            className="flex-1 bg-transparent outline-none text-sm text-white placeholder-white/25"
                        />
                        <button
                            id="send-btn"
                            onClick={handleSubmit}
                            disabled={loading || !input.trim()}
                            className="text-white/40 hover:text-white disabled:opacity-20 transition-colors"
                        >
                            <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>send</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
