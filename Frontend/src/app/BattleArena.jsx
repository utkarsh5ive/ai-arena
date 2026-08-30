import Markdown from './MarkdownContent';

/* ── Solution card ── */
function SolutionCard({ number, content, dotColor }) {
  return (
    <div
      className="rounded-xl p-5 flex flex-col overflow-hidden"
      style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)' }}
    >
      {/* Label */}
      <div className="flex items-center gap-2 mb-3 shrink-0">
        <span className={`w-2 h-2 rounded-full ${dotColor}`} />
        <span
          className="text-[11px] font-semibold tracking-widest uppercase"
          style={{ color: 'var(--text-muted)' }}
        >
          AI Response {number}
        </span>
      </div>
      {/* Scrollable content */}
      <div className="overflow-y-auto scroll flex-1 min-h-0">
        <Markdown text={content} />
      </div>
    </div>
  );
}

/* ── Score card ── */
function ScoreCard({ label, score, reasoning, scoreColor }) {
  return (
    <div
      className="rounded-xl p-4 flex-1"
      style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)' }}
    >
      <div className="flex items-center justify-between mb-2">
        <span
          className="text-sm font-medium"
          style={{ color: 'var(--text-secondary)' }}
        >
          {label}
        </span>
        <span className={`text-2xl font-bold ${scoreColor}`}>{score}/10</span>
      </div>
      <p
        className="text-sm leading-relaxed"
        style={{ color: 'var(--text-muted)' }}
      >
        {reasoning}
      </p>
    </div>
  );
}

/* ── Main BattleArena ── */
export default function BattleArena({ data }) {
  if (!data) return null;
  const { solution_1, solution_2, judge = {} } = data;
  const score1 = judge.solution_core_1 ?? 0;
  const score2 = judge.solution_core_2 ?? judge.solutin_core_2 ?? 0;
  const sol1Wins = score1 >= score2;

  return (
    <div className="flex-1 flex flex-col min-h-0 px-5 pb-4 pt-3 gap-4 overflow-hidden">
      {/* Solutions — two-column grid, cards scroll internally */}
      <div className="grid grid-cols-2 gap-4 flex-1 min-h-0">
        <SolutionCard number={1} content={solution_1 || ''} dotColor="bg-teal-400" />
        <SolutionCard number={2} content={solution_2 || ''} dotColor="bg-purple-400" />
      </div>

      {/* Judge section */}
      <div className="shrink-0">
        <div className="flex items-center gap-2 mb-2.5">
          <span
            className="material-symbols-outlined text-lg"
            style={{ color: 'var(--text-muted)', fontVariationSettings: "'FILL' 1" }}
          >
            emoji_events
          </span>
          <span
            className="text-sm font-semibold"
            style={{ color: 'var(--text-secondary)' }}
          >
            Judge Recommendations
          </span>
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-medium ml-1 ${
              sol1Wins ? 'bg-teal-400/15 text-teal-400' : 'bg-purple-400/15 text-purple-400'
            }`}
          >
            {sol1Wins ? 'Solution 1 wins' : 'Solution 2 wins'}
          </span>
        </div>
        <div className="flex gap-4">
          <ScoreCard
            label="Solution 1 Score"
            score={score1}
            reasoning={judge.solution_1_reasoning || 'No reasoning provided'}
            scoreColor="text-teal-400"
          />
          <ScoreCard
            label="Solution 2 Score"
            score={score2}
            reasoning={judge.solution_2_reasoning || 'No reasoning provided'}
            scoreColor="text-purple-400"
          />
        </div>
      </div>
    </div>
  );
}
