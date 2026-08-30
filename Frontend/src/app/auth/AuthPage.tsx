import { useState } from 'react'
import { Sun, Moon } from 'lucide-react'
import { useTheme } from '../theme/ThemeContext'

type Mode = 'login' | 'signup'

interface AuthPageProps {
    onSuccess: () => void
    login: (email: string, password: string) => Promise<void>
    signup: (username: string, email: string, password: string) => Promise<void>
}

export default function AuthPage({ onSuccess, login, signup }: AuthPageProps) {
    const { theme, toggleTheme } = useTheme()
    const [mode, setMode] = useState<Mode>('login')
    const [username, setUsername] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)

    function switchMode(m: Mode) {
        setMode(m)
        setError(null)
        setUsername('')
        setEmail('')
        setPassword('')
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setError(null)
        setLoading(true)
        try {
            if (mode === 'signup') {
                if (!username.trim()) { setError('Username is required.'); setLoading(false); return }
                await signup(username.trim(), email.trim(), password)
            } else {
                await login(email.trim(), password)
            }
            onSuccess()
        } catch (err: unknown) {
            // Toast is already fired by useAuth — show inline error too
            const msg =
                (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
                (err instanceof Error ? err.message : 'Something went wrong.')
            setError(msg)
        } finally {
            setLoading(false)
        }
    }

    const isLight = theme === 'light'

    return (
        <div
            className="flex h-dvh items-center justify-center px-4 transition-colors duration-200"
            style={{ backgroundColor: 'var(--bg-base)' }}
        >
            {/* Theme toggle — top right */}
            <button
                onClick={toggleTheme}
                title={isLight ? 'Switch to dark mode' : 'Switch to light mode'}
                className="fixed top-4 right-4 p-2 rounded-lg transition-colors"
                style={{
                    color: 'var(--text-muted)',
                    backgroundColor: 'var(--bg-surface)',
                    border: '1px solid var(--border)',
                }}
            >
                {isLight ? <Moon size={16} strokeWidth={1.8} /> : <Sun size={16} strokeWidth={1.8} />}
            </button>

            {/* Ambient glow */}
            <div className="pointer-events-none fixed inset-0 overflow-hidden">
                <div
                    className="absolute -top-32 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full blur-3xl"
                    style={{ backgroundColor: 'var(--glow)' }}
                />
            </div>

            <div className="relative w-full max-w-sm">

                {/* Logo / Title */}
                <div className="text-center mb-8">
                    <div
                        className="inline-flex items-center justify-center w-11 h-11 rounded-xl mb-4"
                        style={{
                            backgroundColor: 'var(--bg-surface)',
                            border: '1px solid var(--border)',
                        }}
                    >
                        <span
                            className="material-symbols-outlined text-xl"
                            style={{ color: 'var(--text-secondary)', fontVariationSettings: "'FILL' 1" }}
                        >
                            emoji_events
                        </span>
                    </div>
                    <h1 className="text-xl font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                        AI Chat Arena
                    </h1>
                    <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                        {mode === 'login' ? 'Welcome back.' : 'Create your account.'}
                    </p>
                </div>

                {/* Tab switcher */}
                <div
                    className="flex rounded-xl p-1 mb-6"
                    style={{
                        backgroundColor: 'var(--bg-surface)',
                        border: '1px solid var(--border)',
                    }}
                >
                    {(['login', 'signup'] as Mode[]).map((m) => (
                        <button
                            key={m}
                            type="button"
                            onClick={() => switchMode(m)}
                            className="flex-1 py-2 text-sm font-medium rounded-lg transition-all duration-200"
                            style={{
                                backgroundColor: mode === m ? 'var(--bg-active)' : 'transparent',
                                color: mode === m ? 'var(--text-primary)' : 'var(--text-muted)',
                            }}
                        >
                            {m === 'login' ? 'Log in' : 'Sign up'}
                        </button>
                    ))}
                </div>

                {/* Form card */}
                <div
                    className="rounded-2xl p-6"
                    style={{
                        backgroundColor: 'var(--bg-card)',
                        border: '1px solid var(--border)',
                    }}
                >
                    <form onSubmit={handleSubmit} className="space-y-4">

                        {mode === 'signup' && (
                            <div>
                                <label className="block text-xs mb-1.5 font-medium tracking-wide" style={{ color: 'var(--text-label)' }}>
                                    Username
                                </label>
                                <input
                                    id="auth-username"
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="e.g. john_doe"
                                    required
                                    autoComplete="username"
                                    className="w-full rounded-lg px-3.5 py-2.5 text-sm outline-none transition-all"
                                    style={{
                                        backgroundColor: 'var(--input-bg)',
                                        border: '1px solid var(--border-input)',
                                        color: 'var(--text-primary)',
                                    }}
                                    onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--border-focus)' }}
                                    onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border-input)' }}
                                />
                            </div>
                        )}

                        <div>
                            <label className="block text-xs mb-1.5 font-medium tracking-wide" style={{ color: 'var(--text-label)' }}>
                                Email
                            </label>
                            <input
                                id="auth-email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@example.com"
                                required
                                autoComplete="email"
                                className="w-full rounded-lg px-3.5 py-2.5 text-sm outline-none transition-all"
                                style={{
                                    backgroundColor: 'var(--input-bg)',
                                    border: '1px solid var(--border-input)',
                                    color: 'var(--text-primary)',
                                }}
                                onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--border-focus)' }}
                                onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border-input)' }}
                            />
                        </div>

                        <div>
                            <label className="block text-xs mb-1.5 font-medium tracking-wide" style={{ color: 'var(--text-label)' }}>
                                Password
                            </label>
                            <input
                                id="auth-password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                                minLength={6}
                                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                                className="w-full rounded-lg px-3.5 py-2.5 text-sm outline-none transition-all"
                                style={{
                                    backgroundColor: 'var(--input-bg)',
                                    border: '1px solid var(--border-input)',
                                    color: 'var(--text-primary)',
                                }}
                                onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--border-focus)' }}
                                onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border-input)' }}
                            />
                        </div>

                        {/* Inline error */}
                        {error && (
                            <p className="text-xs text-red-400 bg-red-500/[0.08] border border-red-500/20 rounded-lg px-3 py-2">
                                {error}
                            </p>
                        )}

                        <button
                            id="auth-submit"
                            type="submit"
                            disabled={loading}
                            className="w-full text-sm font-semibold py-2.5 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 mt-1"
                            style={{
                                backgroundColor: isLight ? '#0f0f0f' : '#ffffff',
                                color: isLight ? '#ffffff' : '#000000',
                            }}
                        >
                            {loading
                                ? (mode === 'login' ? 'Signing in…' : 'Creating account…')
                                : (mode === 'login' ? 'Sign in' : 'Create account')}
                        </button>
                    </form>
                </div>

                <p className="text-center text-xs mt-5" style={{ color: 'var(--text-faint)' }}>
                    {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
                    <button
                        type="button"
                        onClick={() => switchMode(mode === 'login' ? 'signup' : 'login')}
                        className="underline underline-offset-2 transition-colors"
                        style={{ color: 'var(--text-secondary)' }}
                    >
                        {mode === 'login' ? 'Sign up' : 'Log in'}
                    </button>
                </p>

            </div>
        </div>
    )
}
