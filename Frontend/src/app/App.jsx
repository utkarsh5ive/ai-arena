import { useState, useRef } from 'react';
import BattleArena from './BattleArena';

/* ── Mock API — swap with real fetch() ── */
async function callBattleAPI(question) {
  await new Promise((r) => setTimeout(r, 1800));
  return {
    problem: question,
    solution_1: `### Overview\nHere is a structured answer to: **"${question}"**\n\nThis solution takes a practical, evidence-based approach.\n\n### Key Points\n- Start simple and build up gradually\n- Validate each step before moving on\n- Prefer clarity over cleverness\n\n### Explanation\nThe core idea is to break the problem into smaller parts. Address each independently. Use \`proven tools\` where available.\n\n### Summary\nFocus on **correctness** first, then optimize.`,

    solution_2: `### Approach\nA different take on **"${question}"**.\n\n### Steps\n- Identify the root cause before acting\n- Evaluate multiple options with clear criteria\n- Implement incrementally\n\n### Trade-offs\n- Speed vs. maintainability\n- Simplicity vs. flexibility\n\n### Recommendation\nDeliver a minimal working version first, then iterate based on real-world feedback.`,

    judge: {
      solution_core_1: 9.1,
      solutin_core_2: 8.4,
      solution_1_reasoning: 'Solution 1 is thorough and well-structured with concrete examples and clear reasoning.',
      solution_2_reasoning: 'Solution 2 is concise and practical but lacks depth compared to Solution 1.',
    },
  };
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
  const inputRef = useRef(null);

  const activeEntry = activeIndex !== null ? history[activeIndex] : null;

  async function handleSubmit() {
    const question = input.trim();
    if (!question || loading) return;
    setInput('');
    setLoading(true);
    const nextIndex = history.length;
    setActiveIndex(nextIndex);
    try {
      const data = await callBattleAPI(question);
      const winner = data.judge.solution_core_1 >= data.judge.solutin_core_2 ? 1 : 2;
      setHistory((h) => [...h, { question, data, winner }]);
      setActiveIndex(nextIndex);
    } catch {
      setActiveIndex(history.length > 0 ? history.length - 1 : null);
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
          onClick={() => { setActiveIndex(null); inputRef.current?.focus(); }}
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
                  onClick={() => setActiveIndex(i)}
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
