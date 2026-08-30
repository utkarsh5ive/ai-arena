/* Simple markdown renderer — no external deps */
function renderLine(line, i) {
  // Bold + inline code — uses CSS variables for code styling
  const format = (text) =>
    text
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(
        /`(.+?)`/g,
        '<code style="background:var(--code-bg);padding:1px 5px;border-radius:4px;font-family:monospace;font-size:12px;color:var(--code-text)">$1</code>'
      );

  if (!line.trim()) return null;

  if (line.startsWith('### '))
    return (
      <p
        key={i}
        className="text-xs font-semibold uppercase tracking-wider mt-3 mb-1"
        style={{ color: 'var(--text-caption)' }}
      >
        {line.slice(4)}
      </p>
    );

  if (/^---+$/.test(line.trim()))
    return (
      <hr
        key={i}
        className="my-3"
        style={{ borderColor: 'var(--border-hr)' }}
      />
    );

  if (line.trimStart().match(/^[-*]\s/))
    return (
      <div key={i} className="flex gap-2 text-sm" style={{ color: 'var(--text-body)' }}>
        <span className="mt-0.5 shrink-0" style={{ color: 'var(--text-muted)' }}>–</span>
        <span dangerouslySetInnerHTML={{ __html: format(line.replace(/^[\s\-\*]+/, '')) }} />
      </div>
    );

  return (
    <p
      key={i}
      className="text-sm leading-relaxed"
      style={{ color: 'var(--text-body)' }}
      dangerouslySetInnerHTML={{ __html: format(line) }}
    />
  );
}

export default function Markdown({ text }) {
  return <div className="space-y-1.5">{text.split('\n').map(renderLine)}</div>;
}
