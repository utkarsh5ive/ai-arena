/* Simple markdown renderer — no external deps */
function renderLine(line, i) {
  // Bold + inline code
  const format = (text) =>
    text
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/`(.+?)`/g, '<code style="background:#2a2a2a;padding:1px 5px;border-radius:4px;font-family:monospace;font-size:12px;color:#a5b4fc">$1</code>');

  if (!line.trim()) return null;
  if (line.startsWith('### ')) return <p key={i} className="text-xs text-white/50 font-semibold uppercase tracking-wider mt-3 mb-1">{line.slice(4)}</p>;
  if (/^---+$/.test(line.trim())) return <hr key={i} className="border-white/10 my-3" />;
  if (line.trimStart().match(/^[-*]\s/)) return (
    <div key={i} className="flex gap-2 text-sm text-white/70">
      <span className="text-white/30 mt-0.5 shrink-0">–</span>
      <span dangerouslySetInnerHTML={{ __html: format(line.replace(/^[\s\-\*]+/, '')) }} />
    </div>
  );
  return <p key={i} className="text-sm text-white/70 leading-relaxed" dangerouslySetInnerHTML={{ __html: format(line) }} />;
}

export default function Markdown({ text }) {
  return <div className="space-y-1.5">{text.split('\n').map(renderLine)}</div>;
}
