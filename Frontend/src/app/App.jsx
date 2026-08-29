import { useState, useRef } from 'react';
import axios from 'axios';
import BattleArena from './BattleArena';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

/* ── Call Backend API ── */
async function callBattleAPI(question) {
  const response = await axios.post(`${API_BASE_URL}/invoke`, {
    input: question,
  });

  const payload = response.data;
  return payload.result || payload;
}

/* ── History item ── */
function HistoryItem({ item, isActive, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-3 py-2 rounded-lg text-sm truncate transition-colors ${
        isActive ? 'bg-white/10 text-white' : 'text-white/40 hover:bg-white/5 hover:text-white/60'
      }`}
    >
      {item.question}
    </button>
  );
}

/* ── Main App ── */
export default function App() {
  const [history, setHistory] = useState([]);
  const [activeIndex, setActiveIndex] = useState(null);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const inputRef = useRef(null);

  const activeEntry = activeIndex !== null ? history[activeIndex] : null;

  async function handleSubmit() {
    const question = input.trim();
    if (!question || loading) return;

    setInput('');
    setErrorMessage(null);
    setLoading(true);

    try {
      const data = await callBattleAPI(question);
      const score1 = data?.judge?.solution_core_1 ?? 0;
      const score2 = data?.judge?.solution_core_2 ?? data?.judge?.solutin_core_2 ?? 0;
      const winner = score1 >= score2 ? 1 : 2;

      setHistory((h) => {
        const next = [...h, { question, data, winner }];
        setActiveIndex(next.length - 1);
        return next;
      });
    } catch (error) {
      console.error('Failed to call API:', error);
      const apiErr =
        error.response?.data?.error ||
        error.response?.data?.message ||
        error.message ||
        'Failed to connect to backend server.';
      setErrorMessage(apiErr);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-dvh bg-[#111111] text-white">

      {/* ── Sidebar ── */}
      <aside className="w-56 shrink-0 flex flex-col border-r border-white/8 py-4 px-3">
        <p className="text-xs font-semibold text-white/30 uppercase tracking-widest px-2 mb-3">History</p>

        <button
          onClick={() => { setActiveIndex(null); setErrorMessage(null); inputRef.current?.focus(); }}
          className="flex items-center gap-2 text-sm text-white/50 hover:text-white px-2 py-1.5 rounded-lg hover:bg-white/5 transition-colors mb-4"
        >
          <span className="material-symbols-outlined text-base">add</span>
          New chat
        </button>

        <div className="flex-1 overflow-y-auto scroll space-y-0.5">
          {history.length === 0
            ? <p className="text-xs text-white/20 px-2">No history yet</p>
            : history.map((entry, i) => (
                <HistoryItem
                  key={i}
                  item={entry}
                  isActive={i === activeIndex && !loading}
                  onClick={() => { setErrorMessage(null); setActiveIndex(i); }}
                />
              ))
          }
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="flex flex-col flex-1 min-w-0">

        {/* Header */}
        <div className="text-center py-4 border-b border-white/8 shrink-0">
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
        <div className="px-5 py-4 border-t border-white/8 shrink-0">
          <div className="flex items-center gap-2 bg-[#1c1c1c] border border-white/10 rounded-xl px-4 py-2.5 focus-within:border-white/25 transition-colors">
            <input
              ref={inputRef}
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
  );
}
