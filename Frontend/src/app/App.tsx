import { useState, useRef, useEffect, useCallback } from 'react'
import axios from 'axios'
import { Sun, Moon } from 'lucide-react'
import { Toaster } from 'react-hot-toast'
import BattleArena from './BattleArena'
import AuthPage from './auth/AuthPage'
import { useAuth } from './auth/useAuth'
import { useTheme } from './theme/ThemeContext'

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
    return { result: payload.result || payload, chatId: payload.chatId as string | undefined }
}

/* ── Delete chat from DB ── */
async function deleteChatAPI(id: string, token: string) {
    await axios.delete(`${API_BASE_URL}/chat/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
    })
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

/* ── History item with delete ── */
function HistoryItem({
    item, isActive, onClick, onDelete, deleting
}: {
    item: HistoryEntry
    isActive: boolean
    onClick: () => void
    onDelete: (e: React.MouseEvent) => void
    deleting: boolean
}) {
    return (
        <div
            className="group flex items-center gap-1 rounded-lg transition-colors"
            style={{ backgroundColor: isActive ? 'var(--bg-active)' : undefined }}
            onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.backgroundColor = 'var(--bg-hover)' }}
            onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.backgroundColor = '' }}
        >
            <button
                onClick={onClick}
                className="flex-1 text-left px-3 py-2 text-sm truncate transition-colors"
                style={{ color: isActive ? 'var(--text-primary)' : 'var(--text-muted)' }}
            >
                {item.question}
            </button>
            <button
                onClick={onDelete}
                disabled={deleting}
                title="Delete chat"
                className="opacity-0 group-hover:opacity-100 shrink-0 mr-1.5 p-1 rounded transition-all disabled:opacity-30 hover:text-red-400 hover:bg-red-500/10"
                style={{ color: 'var(--text-faint)' }}
            >
                {deleting
                    ? <span className="material-symbols-outlined text-sm animate-spin">refresh</span>
                    : <span className="material-symbols-outlined text-sm">delete</span>
                }
            </button>
        </div>
    )
}

/* ── User badge ── */
function UserBadge({ username, onLogout }: { username: string; onLogout: () => void }) {
    return (
        <div
            className="flex items-center gap-2 px-2 py-1.5 mt-auto pt-3"
            style={{ borderTop: '1px solid var(--border)' }}
        >
            <div
                className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
                style={{ backgroundColor: 'var(--bg-active)' }}
            >
                <span className="text-[11px] font-semibold uppercase" style={{ color: 'var(--text-secondary)' }}>
                    {username[0]}
                </span>
            </div>
            <span className="text-xs truncate flex-1 font-medium" style={{ color: 'var(--text-secondary)' }}>
                {username}
            </span>
            <button
                id="logout-btn"
                onClick={onLogout}
                title="Logout"
                className="text-red-400 hover:text-red-500 transition-colors"
            >
                <span className="material-symbols-outlined text-base">logout</span>
            </button>
        </div>
    )
}

/* ── Theme Toggle Button ── */
function ThemeToggle() {
    const { theme, toggleTheme } = useTheme()
    return (
        <button
            id="theme-toggle"
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            className="p-1.5 rounded-lg transition-colors"
            style={{
                color: 'var(--text-muted)',
                backgroundColor: 'transparent',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--text-primary)' }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = ''; e.currentTarget.style.color = 'var(--text-muted)' }}
        >
            {theme === 'dark'
                ? <Sun size={17} strokeWidth={1.8} />
                : <Moon size={17} strokeWidth={1.8} />
            }
        </button>
    )
}

/* ── Main App ── */
export default function App() {
    const { user, token, logout, login, signup } = useAuth()
    const { theme } = useTheme()
    const [sidebarOpen, setSidebarOpen] = useState(true)
    const [history, setHistory] = useState<HistoryEntry[]>([])
    const [activeIndex, setActiveIndex] = useState<number | null>(null)
    const [deletingId, setDeletingId] = useState<string | null>(null)
    const [input, setInput] = useState('')
    const [loading, setLoading] = useState(false)
    const [historyLoading, setHistoryLoading] = useState(false)
    const [errorMessage, setErrorMessage] = useState<string | null>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    const activeEntry = activeIndex !== null ? history[activeIndex] : null

    // Toaster style adapts to current theme
    const toasterOptions = {
        style: {
            background: theme === 'dark' ? '#1c1c1c' : '#ffffff',
            color: theme === 'dark' ? '#ffffff' : '#0f0f0f',
            border: `1px solid ${theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
            fontSize: '13px',
            borderRadius: '10px',
            padding: '10px 14px',
        }
    }

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
            const { result: data, chatId } = await callBattleAPI(question, token)
            const score1 = data?.judge?.solution_core_1 ?? 0
            const score2 = data?.judge?.solution_core_2 ?? data?.judge?.solutin_core_2 ?? 0
            const winner: 1 | 2 = score1 >= score2 ? 1 : 2
            setHistory((h) => {
                const next = [...h, { _id: chatId, question, data, winner }]
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

    async function handleDelete(entry: HistoryEntry, index: number) {
        if (!entry._id || !token) return
        setDeletingId(entry._id)
        try {
            await deleteChatAPI(entry._id, token)
            setHistory((h) => {
                const next = h.filter((_, i) => i !== index)
                setActiveIndex((prev) => {
                    if (prev === null) return null
                    if (prev === index) return next.length > 0 ? Math.min(prev, next.length - 1) : null
                    if (prev > index) return prev - 1
                    return prev
                })
                return next
            })
        } catch {
            setErrorMessage('Failed to delete chat.')
        } finally {
            setDeletingId(null)
        }
    }

    // Not logged in — show auth page
    if (!user || !token) {
        return (
            <>
                <Toaster position="top-right" toastOptions={toasterOptions} />
                <AuthPage onSuccess={() => { }} login={login} signup={signup} />
            </>
        )
    }

    return (
        <div className="flex h-dvh overflow-hidden" style={{ backgroundColor: 'var(--bg-base)', color: 'var(--text-primary)' }}>

            {/* Toaster — theme-aware */}
            <Toaster position="top-right" toastOptions={toasterOptions} />

            {/* ── Sidebar ── */}
            <aside
                className="shrink-0 flex flex-col py-4 px-3 transition-all duration-300 overflow-hidden"
                style={{
                    width: sidebarOpen ? '224px' : '0',
                    padding: sidebarOpen ? undefined : '0',
                    borderRight: sidebarOpen ? `1px solid var(--border)` : 'none',
                    backgroundColor: 'var(--bg-base)',
                }}
            >
                {sidebarOpen && (
                    <>
                        <p className="text-xs font-semibold uppercase tracking-widest px-2 mb-3 whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>
                            History
                        </p>

                        <button
                            id="new-chat-btn"
                            onClick={() => { setActiveIndex(null); setErrorMessage(null); inputRef.current?.focus() }}
                            className="flex items-center gap-2 text-sm px-2 py-1.5 rounded-lg transition-colors mb-4 whitespace-nowrap"
                            style={{ color: 'var(--text-secondary)' }}
                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--text-primary)' }}
                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = ''; e.currentTarget.style.color = 'var(--text-secondary)' }}
                        >
                            <span className="material-symbols-outlined text-base">add</span>
                            New chat
                        </button>

                        <div className="flex-1 overflow-y-auto scroll space-y-0.5">
                            {historyLoading
                                ? <p className="text-xs px-2" style={{ color: 'var(--text-faint)' }}>Loading…</p>
                                : history.length === 0
                                    ? <p className="text-xs px-2" style={{ color: 'var(--text-faint)' }}>No history yet</p>
                                    : history.map((entry, i) => (
                                        <HistoryItem
                                            key={entry._id || i}
                                            item={entry}
                                            isActive={i === activeIndex && !loading}
                                            deleting={deletingId === entry._id}
                                            onClick={() => { setErrorMessage(null); setActiveIndex(i) }}
                                            onDelete={(e) => { e.stopPropagation(); void handleDelete(entry, i) }}
                                        />
                                    ))}
                        </div>

                        <UserBadge username={user.username} onLogout={logout} />
                    </>
                )}
            </aside>

            {/* ── Main ── */}
            <div className="flex flex-col flex-1 min-w-0">

                {/* Header */}
                <div
                    className="flex items-center py-4 shrink-0 px-4 gap-3"
                    style={{ borderBottom: `1px solid var(--border)` }}
                >
                    {/* Sidebar toggle */}
                    <button
                        id="sidebar-toggle"
                        onClick={() => setSidebarOpen((o) => !o)}
                        title={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
                        className="transition-colors shrink-0"
                        style={{ color: 'var(--text-muted)' }}
                        onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-primary)' }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)' }}
                    >
                        <span className="material-symbols-outlined text-xl">
                            {sidebarOpen ? 'menu_open' : 'menu'}
                        </span>
                    </button>

                    <h1 className="text-base font-semibold flex-1 text-center" style={{ color: 'var(--text-secondary)' }}>
                        AI Chat Arena
                    </h1>

                    {/* Theme toggle */}
                    <ThemeToggle />
                </div>

                {/* Error Alert */}
                {errorMessage && (
                    <div className="mx-5 mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center justify-between shrink-0">
                        <span>{errorMessage}</span>
                        <button
                            onClick={() => setErrorMessage(null)}
                            className="text-red-400/60 hover:text-red-400 text-xs px-2 py-1"
                        >
                            Dismiss
                        </button>
                    </div>
                )}

                {/* Content */}
                {loading ? (
                    <div className="flex flex-col flex-1 items-center justify-center gap-3">
                        <div className="w-8 h-8 border-2 border-white/10 border-t-white/50 rounded-full animate-spin" />
                        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Generating solutions…</p>
                    </div>
                ) : activeEntry ? (
                    <BattleArena data={activeEntry.data} />
                ) : (
                    <div className="flex flex-col flex-1 items-center justify-center gap-2 text-center">
                        <p className="text-lg font-semibold" style={{ color: 'var(--text-secondary)' }}>AI Chat Arena</p>
                        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Ask a question to see two AI solutions battle it out.</p>
                    </div>
                )}

                {/* Input */}
                <div className="px-5 py-4 shrink-0" style={{ borderTop: `1px solid var(--border)` }}>
                    <div
                        className="flex items-center gap-2 rounded-xl px-4 py-2.5 transition-colors"
                        style={{
                            backgroundColor: 'var(--bg-surface)',
                            border: `1px solid var(--border-input)`,
                        }}
                        onFocusCapture={(e) => { e.currentTarget.style.borderColor = 'var(--border-focus)' }}
                        onBlurCapture={(e) => { e.currentTarget.style.borderColor = 'var(--border-input)' }}
                    >
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
                            className="flex-1 bg-transparent outline-none text-sm"
                            style={{ color: 'var(--text-primary)' }}
                        />
                        <button
                            id="send-btn"
                            onClick={handleSubmit}
                            disabled={loading || !input.trim()}
                            className="transition-colors disabled:opacity-20"
                            style={{ color: 'var(--text-muted)' }}
                            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-primary)' }}
                            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)' }}
                        >
                            <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>send</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
