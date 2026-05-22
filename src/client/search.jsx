import React from 'react';
import ReactDOM from 'react-dom';
import { dateParts, Avatar, entryId } from './components.jsx';
import { authorName, isSilicon } from './config.js';

// search.jsx — global search overlay for 织
// Click 🔍 in top nav → centered modal with input + live results.
// Click a result → jumps to that day.

function SearchPanel({ open, data, favs, onClose, onPickDate }) {
  const [q, setQ] = React.useState('');
  const [activeIdx, setActiveIdx] = React.useState(0);
  const inputRef = React.useRef(null);

  React.useEffect(() => {
    if (!open) return;
    setQ('');
    setActiveIdx(0);
    setTimeout(() => inputRef.current && inputRef.current.focus(), 80);
    function onKey(e) { if (e.key === 'Escape') onClose(); }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  React.useEffect(() => { setActiveIdx(0); }, [q]);

  const results = React.useMemo(() => {
    if (!q.trim()) return null;
    const k = q.trim().toLowerCase();
    function matches(e) {
      if (e.content.toLowerCase().includes(k)) return true;
      if (e.annotations) {
        for (const a of e.annotations) {
          if (a.content.toLowerCase().includes(k)) return true;
        }
      }
      return false;
    }
    return data.entries
      .filter(matches)
      .sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));
  }, [q, data]);

  // Suggestions: only show when there are entries to search
  const suggestions = React.useMemo(() => {
    if (!data.entries.length) return [];
    return [
      { hint: '试试', words: ['今天', '昨天', '第一天', '开心', '安静', '咖啡', '雨'] },
    ];
  }, [data.entries.length]);

  if (!open) return null;

  function highlight(text, k) {
    if (!k) return text;
    const lower = text.toLowerCase();
    const klower = k.toLowerCase();
    const parts = [];
    let last = 0;
    let idx = lower.indexOf(klower, last);
    let n = 0;
    while (idx !== -1) {
      if (idx > last) parts.push(<React.Fragment key={n++}>{text.slice(last, idx)}</React.Fragment>);
      parts.push(<mark key={n++}>{text.slice(idx, idx + k.length)}</mark>);
      last = idx + k.length;
      idx = lower.indexOf(klower, last);
    }
    if (last < text.length) parts.push(<React.Fragment key={n++}>{text.slice(last)}</React.Fragment>);
    return parts;
  }

  function snippet(content, k, ctx = 30) {
    const lower = content.toLowerCase();
    const idx = lower.indexOf(k.toLowerCase());
    if (idx === -1) return content.slice(0, 80);
    const start = Math.max(0, idx - ctx);
    const end = Math.min(content.length, idx + k.length + ctx);
    return (start > 0 ? '…' : '') + content.slice(start, end) + (end < content.length ? '…' : '');
  }

  function pickSnippet(entry, k) {
    if (entry.content.toLowerCase().includes(k.toLowerCase())) {
      return { text: snippet(entry.content, k), source: null };
    }
    if (entry.annotations) {
      for (const a of entry.annotations) {
        if (a.content.toLowerCase().includes(k.toLowerCase())) {
          return { text: snippet(a.content, k), source: `${a.date} 的批注` };
        }
      }
    }
    return { text: entry.content.slice(0, 80), source: null };
  }

  function handleResultClick(entry) {
    onClose();
    onPickDate(entry.date);
  }

  return ReactDOM.createPortal(
    <div className="srch-backdrop" onClick={onClose}>
      <div className="srch-shell" onClick={e => e.stopPropagation()}>
        <div className="srch-input-row">
          <svg width="16" height="16" viewBox="0 0 16 16" style={{ color: 'var(--ink-faded)', flexShrink: 0 }}>
            <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.4" fill="none"/>
            <path d="M11 11 L14 14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="搜索日记…"
            className="srch-input"
            onKeyDown={(e) => {
              if (!results || results.length === 0) return;
              if (e.key === 'ArrowDown') {
                e.preventDefault();
                setActiveIdx(i => Math.min(results.length - 1, i + 1));
              } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setActiveIdx(i => Math.max(0, i - 1));
              } else if (e.key === 'Enter') {
                e.preventDefault();
                if (results[activeIdx]) handleResultClick(results[activeIdx]);
              }
            }}
          />
          <kbd className="srch-esc">Esc</kbd>
        </div>

        <div className="srch-body">
          {!q.trim() && suggestions.length > 0 && (
            <div className="srch-suggest">
              <div className="kicker" style={{ marginBottom: 14 }}>从哪里开始</div>
              <div className="srch-suggest-list">
                {suggestions[0].words.map(w => (
                  <button key={w} className="srch-chip" onClick={() => setQ(w)}>
                    {w}
                  </button>
                ))}
              </div>
              <div className="srch-tip">
                可以搜词、搜名字、搜半句话。<br/>
                整本日记 {data.entries.length} 条都在范围里。
              </div>
            </div>
          )}
          {!q.trim() && suggestions.length === 0 && (
            <div className="srch-suggest">
              <div style={{
                fontFamily: 'var(--font-hand)', color: 'var(--ink-faded)',
                fontSize: 16, textAlign: 'center', padding: '40px 20px',
              }}>
                写了日记之后，这里就能搜了。
              </div>
            </div>
          )}

          {q.trim() && results && results.length === 0 && (
            <div className="srch-empty">
              <div style={{
                fontFamily: 'var(--font-hand)',
                fontSize: 22, color: 'var(--ink-faded)',
              }}>「{q.trim()}」没翻到。</div>
              <div style={{
                marginTop: 8, fontSize: 13, color: 'var(--ink-ghost)',
                fontFamily: 'var(--font-display)',
              }}>换个词试试？</div>
            </div>
          )}

          {q.trim() && results && results.length > 0 && (
            <>
              <div className="srch-results-head">
                共 <b>{results.length}</b> 条匹配
              </div>
              <div className="srch-results">
                {results.map((e, i) => {
                  const isSi = isSilicon(e.author);
                  const isFav = favs && favs.has(entryId(e));
                  const { y, m, d, weekday } = dateParts(e.date);
                  return (
                    <button
                      key={`${e.date}-${e.time}-${e.author}-${i}`}
                      className="srch-result"
                      data-active={i === activeIdx}
                      onMouseEnter={() => setActiveIdx(i)}
                      onClick={() => handleResultClick(e)}
                    >
                      <div className="srch-result-meta">
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 6,
                          color: isSi ? 'var(--silicon)' : 'var(--carbon)',
                          fontWeight: 500,
                        }}>
                          <Avatar author={e.author} size={16}/>
                          {authorName(e.author)}
                        </span>
                        <span style={{ color: 'var(--ink-faded)' }}>
                          {y}年 {m}月{d}日 · 周{weekday} · {e.time}
                        </span>
                        {isFav && (
                          <span style={{ color: 'var(--red)' }}>
                            <svg width="11" height="11" viewBox="0 0 14 14">
                              <path d="M7 1.6 L8.8 5.3 L12.8 5.9 L9.9 8.7 L10.6 12.6 L7 10.8 L3.4 12.6 L4.1 8.7 L1.2 5.9 L5.2 5.3 Z"
                                fill="currentColor"/>
                            </svg>
                          </span>
                        )}
                      </div>
                      <div className="srch-result-snippet" style={{
                        fontFamily: isSi ? 'var(--font-silicon)' : 'var(--font-carbon)',
                      }}>
                        {(() => {
                          const p = pickSnippet(e, q.trim());
                          return (
                            <>
                              {p.source && (
                                <span style={{
                                  fontFamily: 'var(--font-display)',
                                  fontSize: 10, color: 'var(--red)',
                                  letterSpacing: '0.04em', marginRight: 6,
                                  border: '1px dashed var(--red-soft)',
                                  borderRadius: 999, padding: '1px 6px',
                                }}>{p.source}</span>
                              )}
                              {highlight(p.text, q.trim())}
                            </>
                          );
                        })()}
                      </div>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

export { SearchPanel };
