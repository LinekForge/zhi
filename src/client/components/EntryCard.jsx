import React from 'react';
import { EntryActions } from '../extras.jsx';
import { rotFor } from './utils.jsx';
import { Avatar } from './atoms.jsx';
import { ImagesGrid } from './Images.jsx';
import { AnnotationsSection } from './Annotations.jsx';
import { authorName, isSilicon, isCarbon } from '../config.js';

/* ─── Markdown body — bold + paragraphs, gentle ────────────────────── */

function MarkdownBody({ content }) {
  // Split on blank lines into paragraphs, then handle **bold** and *italic*
  const paras = content.split(/\n\n+/);
  return (
    <div className="md">
      {paras.map((p, i) => {
        const parts = [];
        const re = /\*\*(.+?)\*\*|\*(.+?)\*/g;
        let last = 0, m;
        let key = 0;
        while ((m = re.exec(p)) !== null) {
          if (m.index > last) parts.push(<React.Fragment key={key++}>{p.slice(last, m.index)}</React.Fragment>);
          if (m[1]) parts.push(<strong key={key++}>{m[1]}</strong>);
          else if (m[2]) parts.push(<em key={key++}>{m[2]}</em>);
          last = m.index + m[0].length;
        }
        if (last < p.length) parts.push(<React.Fragment key={key++}>{p.slice(last)}</React.Fragment>);
        // Handle single \n within paragraphs as <br>
        const withBreaks = [];
        parts.forEach((part, idx) => {
          if (typeof part === 'object' && part.props && typeof part.props.children === 'string') {
            const lines = part.props.children.split('\n');
            lines.forEach((line, li) => {
              withBreaks.push(<React.Fragment key={`${idx}-${li}`}>{line}</React.Fragment>);
              if (li < lines.length - 1) withBreaks.push(<br key={`${idx}-${li}-br`}/>);
            });
          } else {
            withBreaks.push(part);
          }
        });
        return <p key={i}>{withBreaks}</p>;
      })}
    </div>
  );
}

/* ─── Entry card ────────────────────────────────────────────────────── */

function EntryCard({ entry, voice, showDate = false, animateIn = false, alwaysExpanded = false, isFav = false, onToggleFav, onExport, onAddAnnotation, onEdit, onToggleHidden, showHidden }) {
  const isSi = isSilicon(entry.author);
  const rot = rotFor(entry);
  const isDuizuo = voice === 'duizuo';
  const isZhiyi = voice === 'zhiyi';

  // ALL hooks must come before any conditional return (Rules of Hooks).
  const [editing, setEditing] = React.useState(false);
  const [editText, setEditText] = React.useState(entry.content);
  React.useEffect(() => { if (!editing) setEditText(entry.content); }, [entry.content, editing]);
  const [showHistoryPop, setShowHistoryPop] = React.useState(false);
  const [expanded, setExpanded] = React.useState(false);

  // Long entry detection
  const LONG_THRESHOLD = 220;
  const isLong = entry.content.length > LONG_THRESHOLD && !alwaysExpanded;
  const showTruncate = isLong && !expanded;

  // Hidden state — early-return AFTER all hooks
  const isHidden = entry.hidden && !showHidden;
  if (isHidden) {
    return (
      <div className="entry-row">
        <button
          className="entry-hidden-stub"
          onClick={() => onToggleHidden && onToggleHidden(entry)}
          title="点击恢复显示"
        >
          一条 {authorName(entry.author)} 的日记被隐藏了 · {entry.time}
        </button>
      </div>
    );
  }

  // Layout for 对坐: alternate sides; carbon left, silicon right
  const align = isDuizuo
    ? (isSi ? 'flex-end' : 'flex-start')
    : 'stretch';
  const maxWidth = isDuizuo ? '88%' : '100%';

  // Card paper / tint
  let cardBg, cardBorder;
  if (isZhiyi) {
    cardBg = isSi ? 'var(--silicon-paper)' : 'var(--carbon-paper)';
    cardBorder = isSi ? 'rgba(61, 86, 112, 0.18)' : 'rgba(122, 79, 47, 0.18)';
  } else {
    cardBg = 'var(--bg-page)';
    cardBorder = isSi ? 'rgba(61, 86, 112, 0.14)' : 'rgba(122, 79, 47, 0.14)';
  }

  // Body alignment: duizuo+silicon mirrors to right
  const bodyAlign = isDuizuo && isSi ? 'right' : 'left';

  return (
    <div
      className="entry-row"
      style={{
        display: 'flex', justifyContent: align, width: '100%',
      }}
    >
      <article
        className={`entry-card ${animateIn ? 'entry-animate-in' : ''} ${isFav ? 'is-favorited' : ''}`}
        data-author={entry.author}
        data-mirror={isDuizuo && isSi ? 'true' : 'false'}
        style={{
          maxWidth,
          width: isDuizuo ? 'fit-content' : '100%',
          minWidth: isDuizuo ? 280 : 'auto',
          transform: `rotate(${rot}deg)`,
          background: cardBg,
          border: `1px solid ${cardBorder}`,
          borderRadius: 4,
          padding: 'calc(var(--density-pad) * 0.7) var(--density-pad)',
          boxShadow: 'var(--shadow-card)',
          position: 'relative',
          fontFamily: isSi ? 'var(--font-silicon)' : 'var(--font-carbon)',
          letterSpacing: isSi ? 'var(--silicon-tracking)' : 'var(--carbon-tracking)',
          color: 'var(--ink)',
          transition: 'transform 0.3s ease',
        }}
      >
        {/* Hover actions — float above the card, top-right corner */}
        {(onToggleFav || onExport) && (
          <EntryActions
            entry={entry}
            isFav={isFav}
            onToggleFav={onToggleFav}
            onExport={onExport}
            onStartEdit={(onEdit && isCarbon(entry.author)) ? () => { setEditText(entry.content); setEditing(true); } : undefined}
            onToggleHidden={isCarbon(entry.author) ? onToggleHidden : undefined}
          />
        )}

        {/* Header — uniform layout: avatar | name | time */}
        <header style={{
          display: 'flex', alignItems: 'center', gap: 10,
          marginBottom: 12,
          flexDirection: (isDuizuo && isSi) ? 'row-reverse' : 'row',
        }}>
          <Avatar author={entry.author} size={26}/>
          <div style={{
            display: 'flex', flexDirection: 'column', gap: 0, lineHeight: 1.2,
            alignItems: (isDuizuo && isSi) ? 'flex-end' : 'flex-start',
          }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              fontFamily: 'var(--font-display)',
              fontSize: 14, fontWeight: 500,
              color: isSi ? 'var(--silicon)' : 'var(--carbon)',
              letterSpacing: '0.02em',
            }}>
              {isFav && (
                <svg width="11" height="11" viewBox="0 0 14 14" style={{ color: 'var(--red)', flexShrink: 0 }}>
                  <path d="M7 1.6 L8.8 5.3 L12.8 5.9 L9.9 8.7 L10.6 12.6 L7 10.8 L3.4 12.6 L4.1 8.7 L1.2 5.9 L5.2 5.3 Z"
                        fill="currentColor"/>
                </svg>
              )}
              {authorName(entry.author)}
            </span>
            <span style={{
              fontFamily: isSi ? 'var(--font-mono)' : 'var(--font-en)',
              fontSize: 11, color: 'var(--ink-faded)', marginTop: 2,
              letterSpacing: isSi ? '0.05em' : '0.02em',
            }}>
              {entry.time}
              {showDate && <span style={{ marginLeft: 8 }}>· {entry.date.slice(5).replace('-', '/')}</span>}
              {entry.writtenAt && entry.writtenAt !== entry.date && (
                <span style={{
                  marginLeft: 8,
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  padding: '1px 6px',
                  border: '1px dashed var(--red-soft)',
                  borderRadius: 999,
                  color: 'var(--red)',
                  fontFamily: 'var(--font-hand)', fontSize: 11,
                  letterSpacing: 0,
                }}>
                  ← 回写于 {entry.writtenAt.slice(5).replace('-', '/')}
                </span>
              )}
            </span>
          </div>
        </header>

        {/* Body — editable or display */}
        {editing ? (
          <div className="entry-edit-mode">
            <textarea
              value={editText}
              onChange={e => setEditText(e.target.value)}
              className="entry-edit-textarea"
              autoFocus
            />
            <div className="entry-edit-foot">
              <span className="entry-edit-hint">编辑会保留历史记录，不可永久删除</span>
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => { setEditing(false); setEditText(entry.content); }} className="entry-edit-cancel">取消</button>
                <button
                  onClick={async () => {
                    try {
                      if (editText !== entry.content) {
                        const ok = await onEdit(entry, editText);
                        if (ok === false) return;
                      }
                      setEditing(false);
                    } catch {
                      // 保持编辑态，让用户重试
                    }
                  }}
                  disabled={editText.trim() === ''}
                  data-disabled={editText.trim() === ''}
                  className="entry-edit-save"
                >保存</button>
              </div>
            </div>
          </div>
        ) : (
        <div style={{
          fontSize: 16.5, lineHeight: 1.8,
          color: 'var(--ink)',
          textAlign: bodyAlign,
        }}>
          <div className={showTruncate ? 'entry-truncated' : ''}>
            <MarkdownBody content={entry.content}/>
          </div>
          {isLong && (
            <div style={{
              display: 'flex',
              justifyContent: bodyAlign === 'right' ? 'flex-end' : 'flex-start',
            }}>
              <button className="expand-btn" onClick={() => setExpanded(x => !x)}>
                {expanded ? '收起 ↑' : <>继续读 <span>↓</span></>}
              </button>
            </div>
          )}
          {isLong && !expanded && (
            <div style={{
              marginTop: 4,
              fontSize: 11, color: 'var(--ink-faded)',
              fontFamily: 'var(--font-en)', letterSpacing: '0.08em',
              textAlign: bodyAlign,
            }}>
              {entry.content.replace(/\s/g, '').length} 字 · 约 {Math.max(1, Math.round(entry.content.replace(/\s/g, '').length / 300))} 分钟
            </div>
          )}
          {entry.editHistory && entry.editHistory.length > 0 && (
            <div style={{
              marginTop: 8,
              fontFamily: 'var(--font-display)', fontSize: 11,
              color: 'var(--ink-faded)', letterSpacing: '0.04em',
              textAlign: bodyAlign,
              position: 'relative',
            }}>
              <button
                onClick={() => setShowHistoryPop(s => !s)}
                style={{
                  appearance: 'none', border: 'none', background: 'transparent',
                  color: 'var(--ink-faded)', cursor: 'pointer',
                  fontFamily: 'inherit', fontSize: 'inherit',
                  borderBottom: '1px dashed var(--rule)',
                  padding: 0,
                }}>
                已编辑 {entry.editHistory.length} 次 · 看历史
              </button>
              {showHistoryPop && (() => {
                // Build version list (newest to oldest). Each version has savedAt + content.
                // editHistory[i].prev was active from prevSaveTime to editHistory[i].at
                // Current version's savedAt = editHistory[last].at
                // editHistory[0].prev's savedAt = original creation time = `${entry.date} ${entry.time}:00`
                const versions = [];
                const N = entry.editHistory.length;
                const originalAt = `${entry.date} ${entry.time}:00`;
                // Current (latest)
                versions.push({
                  vNum: N + 1,
                  label: '现版',
                  savedAt: entry.editHistory[N - 1].at,
                  isCurrent: true,
                });
                // Intermediate versions (v2, v3, ..., vN) — newest first
                for (let i = N - 1; i >= 0; i--) {
                  const savedAt = (i === 0) ? originalAt : entry.editHistory[i - 1].at;
                  versions.push({
                    vNum: i + 1,
                    label: i === 0 ? '原版' : `v${i + 1}`,
                    savedAt,
                    content: entry.editHistory[i].prev,
                    isCurrent: false,
                  });
                }
                return (
                  <div className="edit-history-pop"
                    data-align={bodyAlign}
                    onClick={e => e.stopPropagation()}>
                    <div className="edit-history-head">编辑历史 · 共 {N + 1} 版</div>
                    {versions.map((v, i) => (
                      <div key={i} className="edit-history-item" data-current={v.isCurrent}>
                        <div className="edit-history-when">
                          <span style={{ color: v.isCurrent ? 'var(--red)' : 'var(--ink-soft)' }}>
                            {v.label}
                          </span>
                          <span style={{ marginLeft: 6 }}>
                            · {v.isCurrent ? '改于' : (v.label === '原版' ? '写于' : '改于')} {v.savedAt}
                          </span>
                        </div>
                        {v.isCurrent ? null : (
                          <div className="edit-history-text">{v.content}</div>
                        )}
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          )}
        </div>
        )}

        {/* Images */}
        {entry.images && entry.images.length > 0 && (
          <ImagesGrid images={entry.images} align={bodyAlign}/>
        )}

        {/* Annotations — time footnotes (existing + add UI) */}
        <AnnotationsSection
          entry={entry}
          annotations={entry.annotations}
          onAdd={onAddAnnotation}
          align={bodyAlign}
        />
      </article>
    </div>
  );
}

export { EntryCard, MarkdownBody };
