import { useState } from 'react'

type Mode = 'login' | 'signup'

interface AuthPageProps {
    onSuccess: () => void
    login: (email: string, password: string) => Promise<void>
    signup: (username: string, email: string, password: string) => Promise<void>
}

export default function AuthPage({ onSuccess, login, signup }: AuthPageProps) {
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
            const msg =
                (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
                (err instanceof Error ? err.message : 'Something went wrong.')
            setError(msg)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex h-dvh bg-[#0d0d0d] items-center justify-center px-4">

            {/* Ambient glow */}
            <div className="pointer-events-none fixed inset-0 overflow-hidden">
                <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-white/[0.025] blur-3xl" />
            </div>

            <div className="relative w-full max-w-sm">

                {/* Logo / Title */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-white/[0.06] border border-white/[0.08] mb-4">
                        <span className="material-symbols-outlined text-white/70 text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                            emoji_events
                        </span>
                    </div>
                    <h1 className="text-xl font-semibold text-white tracking-tight">AI Chat Arena</h1>
                    <p className="text-sm text-white/30 mt-1">
                        {mode === 'login' ? 'Welcome back.' : 'Create your account.'}
                    </p>
                </div>

                {/* Tab switcher */}
                <div className="flex bg-white/[0.04] border border-white/[0.07] rounded-xl p-1 mb-6">
                    {(['login', 'signup'] as Mode[]).map((m) => (
                        <button
                            key={m}
                            type="button"
                            onClick={() => switchMode(m)}
                            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                                mode === m
                                    ? 'bg-white/[0.1] text-white'
                                    : 'text-white/35 hover:text-white/60'
                            }`}
                        >
                            {m === 'login' ? 'Log in' : 'Sign up'}
                        </button>
                    ))}
                </div>

                {/* Form card */}
                <div className="bg-[#141414] border border-white/[0.08] rounded-2xl p-6">
                    <form onSubmit={handleSubmit} className="space-y-4">

                        {mode === 'signup' && (
                            <div>
                                <label className="block text-xs text-white/40 mb-1.5 font-medium tracking-wide">
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
                                    className="w-full bg-white/[0.04] border border-white/[0.09] rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-white/20 outline-none focus:border-white/25 focus:bg-white/[0.06] transition-all"
                                />
                            </div>
                        )}

                        <div>
                            <label className="block text-xs text-white/40 mb-1.5 font-medium tracking-wide">
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
                                className="w-full bg-white/[0.04] border border-white/[0.09] rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-white/20 outline-none focus:border-white/25 focus:bg-white/[0.06] transition-all"
                            />
                        </div>

                        <div>
                            <label className="block text-xs text-white/40 mb-1.5 font-medium tracking-wide">
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
                                className="w-full bg-white/[0.04] border border-white/[0.09] rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-white/20 outline-none focus:border-white/25 focus:bg-white/[0.06] transition-all"
                            />
                        </div>

                        {/* Error */}
                        {error && (
                            <p className="text-xs text-red-400/90 bg-red-500/[0.08] border border-red-500/15 rounded-lg px-3 py-2">
                                {error}
                            </p>
                        )}

                        <button
                            id="auth-submit"
                            type="submit"
                            disabled={loading}
                            className="w-full bg-white text-black text-sm font-semibold py-2.5 rounded-lg hover:bg-white/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 mt-1"
                        >
                            {loading
                                ? (mode === 'login' ? 'Signing in…' : 'Creating account…')
                                : (mode === 'login' ? 'Sign in' : 'Create account')}
                        </button>
                    </form>
                </div>

                <p className="text-center text-xs text-white/20 mt-5">
                    {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
                    <button
                        type="button"
                        onClick={() => switchMode(mode === 'login' ? 'signup' : 'login')}
                        className="text-white/50 hover:text-white/80 underline underline-offset-2 transition-colors"
                    >
                        {mode === 'login' ? 'Sign up' : 'Log in'}
                    </button>
                </p>

            </div>
        </div>
    )
}
