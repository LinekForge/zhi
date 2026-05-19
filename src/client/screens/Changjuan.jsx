import React from 'react';
import { dateParts, Avatar, EntryCard, entryId } from '../components.jsx';
import { Page, applyLens } from './shared.jsx';
import { authorName, isSilicon, CARBON, SILICON } from '../config.js';

/* ─── 长卷 screen — all long entries + favorites ──────────────────── */

function ChangjuanScreen({ data, today, voice, favs, onToggleFav, onExport, onPickDate, lens, onAddAnnotation, annotateEntry }) {
  const [filter, setFilter] = React.useState('all'); // all | carbon | silicon | fav
  const LONG = 220;

  let pool = data.entries.filter(e => e.content.length > LONG);
  if (filter === CARBON) pool = pool.filter(e => e.author === CARBON);
  else if (filter === SILICON) pool = pool.filter(e => e.author === SILICON);
  else if (filter === 'fav') {
    pool = data.entries.filter(e => favs.has(entryId(e)));
  }
  // Apply global lens on top
  pool = applyLens(pool, lens);
  // Sort newest first
  pool = [...pool].sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));

  // Stats
  const total = data.entries.filter(e => e.content.length > LONG).length;
  const carbonCount = data.entries.filter(e => e.content.length > LONG && e.author === CARBON).length;
  const siliconCount = data.entries.filter(e => e.content.length > LONG && e.author === SILICON).length;
  const favCount = favs.size;

  return (
    <Page>
      <header style={{ marginBottom: 28 }}>
        <div className="kicker" style={{ marginBottom: 6 }}>翻 · 长篇</div>
        <div style={{
          fontFamily: 'var(--font-display)', fontSize: 38, fontWeight: 500,
          color: 'var(--ink)', letterSpacing: '-0.01em', lineHeight: 1,
          display: 'flex', alignItems: 'baseline', gap: 14,
        }}>
          长篇
          <span style={{
            fontFamily: 'var(--font-hand)', fontSize: 18,
            color: 'var(--red)', transform: 'rotate(-2deg)',
            display: 'inline-block', fontWeight: 400,
          }}>· 写得长的那些天</span>
        </div>
        <div style={{
          marginTop: 16,
          fontFamily: 'var(--font-display)', fontSize: 13,
          color: 'var(--ink-soft)', letterSpacing: '0.04em', lineHeight: 1.7,
        }}>
          有时一两句就好，有时想慢慢说。<br/>
          这里是想慢慢说的那些时刻。
        </div>
      </header>

      {/* Filter pills */}
      <div style={{
        display: 'flex', gap: 8, marginBottom: 28, flexWrap: 'wrap',
      }}>
        <FilterPill active={filter === 'all'} onClick={() => setFilter('all')}>
          全部 <span style={{ fontFamily: 'var(--font-en)', marginLeft: 4 }}>{total}</span>
        </FilterPill>
        <FilterPill active={filter === CARBON} onClick={() => setFilter(CARBON)} color="var(--carbon)">
          {authorName(CARBON)} <span style={{ fontFamily: 'var(--font-en)', marginLeft: 4 }}>{carbonCount}</span>
        </FilterPill>
        <FilterPill active={filter === SILICON} onClick={() => setFilter(SILICON)} color="var(--silicon)">
          {authorName(SILICON)} <span style={{ fontFamily: 'var(--font-en)', marginLeft: 4 }}>{siliconCount}</span>
        </FilterPill>
        <FilterPill active={filter === 'fav'} onClick={() => setFilter('fav')} color="var(--red)">
          ★ 收藏 <span style={{ fontFamily: 'var(--font-en)', marginLeft: 4 }}>{favCount}</span>
        </FilterPill>
      </div>

      {/* Rows */}
      <div>
        {pool.length === 0 ? (
          <div style={{
            padding: 48, textAlign: 'center',
            fontFamily: 'var(--font-hand)',
            color: 'var(--ink-faded)', fontSize: 17,
          }}>
            {filter === 'fav' ? '还没收藏什么。点 ★ 收藏喜欢的一条。' : '这里还没有写过长篇。'}
          </div>
        ) : (
          pool.map((e) => (
            <ChangjuanRow key={`${e.date}-${e.time}-${e.author}`}
              entry={e} today={today}
              isFav={favs.has(entryId(e))}
              onToggleFav={onToggleFav}
              onExport={onExport}
              onAddAnnotation={onAddAnnotation}
              annotateEntry={annotateEntry}
              voice={voice}
              onJumpDay={() => onPickDate(e.date)}/>
          ))
        )}
      </div>
    </Page>
  );
}

function FilterPill({ children, active, onClick, color }) {
  return (
    <button onClick={onClick} style={{
      appearance: 'none', border: '1px solid var(--rule)',
      background: active ? (color || 'var(--ink)') : 'transparent',
      color: active ? 'var(--bg-page)' : (color || 'var(--ink-soft)'),
      padding: '6px 14px', borderRadius: 2,
      fontFamily: 'var(--font-display)', fontSize: 13,
      letterSpacing: '0.04em',
      borderColor: active ? (color || 'var(--ink)') : 'var(--rule)',
      cursor: 'pointer', transition: 'all 0.15s',
    }}>{children}</button>
  );
}

function ChangjuanRow({ entry, today, isFav, onToggleFav, onExport, voice, onJumpDay, onAddAnnotation, annotateEntry }) {
  const [open, setOpen] = React.useState(false);
  const isSi = isSilicon(entry.author);
  const { m, d, weekday, y } = dateParts(entry.date);
  const chars = entry.content.replace(/\s/g, '').length;
  const mins = Math.max(1, Math.round(chars / 300));
  const firstPara = entry.content.split(/\n\n+/)[0];

  return (
    <article className="cj-row" data-open={open}>
      {/* Always-visible header — click to expand */}
      <button
        className="cj-row-head"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
      >
        <div className="cj-row-meta">
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            color: isSi ? 'var(--silicon)' : 'var(--carbon)',
          }}>
            <Avatar author={entry.author} size={20}/>
            {authorName(entry.author)}
          </span>
          <span style={{ color: 'var(--ink-faded)' }}>
            {y}年 {m}月{d}日 · 周{weekday} · {entry.time}
          </span>
          {isFav && (
            <span style={{ color: 'var(--red)' }}>
              <svg width="12" height="12" viewBox="0 0 14 14">
                <path d="M7 1.6 L8.8 5.3 L12.8 5.9 L9.9 8.7 L10.6 12.6 L7 10.8 L3.4 12.6 L4.1 8.7 L1.2 5.9 L5.2 5.3 Z"
                  fill="currentColor"/>
              </svg>
            </span>
          )}
          <span style={{
            marginLeft: 'auto',
            fontFamily: 'var(--font-en)', fontSize: 11,
            color: 'var(--ink-ghost)', letterSpacing: '0.1em',
            display: 'inline-flex', alignItems: 'center', gap: 8,
          }}>
            {chars} 字 · {mins} 分钟
            <span style={{
              display: 'inline-block', transition: 'transform 0.3s',
              transform: open ? 'rotate(90deg)' : 'rotate(0deg)',
              color: 'var(--ink-faded)', fontSize: 12,
            }}>›</span>
          </span>
        </div>
        {!open && (
          <div className="cj-row-preview" style={{
            fontFamily: isSi ? 'var(--font-silicon)' : 'var(--font-carbon)',
          }}>
            {firstPara.replace(/\*\*(.+?)\*\*/g, '$1').replace(/\*(.+?)\*/g, '$1')}
          </div>
        )}
      </button>

      {/* Expanded full entry */}
      {open && (
        <div className="cj-row-body">
          <EntryCard
            entry={annotateEntry ? annotateEntry(entry) : entry}
            voice={voice}
            today={today}
            alwaysExpanded={true}
            isFav={isFav}
            onToggleFav={onToggleFav}
            onExport={onExport}
            onAddAnnotation={onAddAnnotation}
          />
          <div style={{
            marginTop: 14, display: 'flex', gap: 14,
            fontFamily: 'var(--font-display)', fontSize: 12,
            color: 'var(--ink-faded)', letterSpacing: '0.04em',
          }}>
            <button
              onClick={(e) => { e.stopPropagation(); onJumpDay(); }}
              style={{
                appearance: 'none', border: 'none', background: 'transparent',
                color: 'var(--ink-soft)', cursor: 'pointer',
                fontFamily: 'inherit', fontSize: 'inherit', padding: 0,
                borderBottom: '1px dashed var(--rule)',
              }}>
              → 看这一天的全部
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setOpen(false); }}
              style={{
                appearance: 'none', border: 'none', background: 'transparent',
                color: 'var(--ink-ghost)', cursor: 'pointer',
                fontFamily: 'inherit', fontSize: 'inherit', padding: 0,
                marginLeft: 'auto',
              }}>
              收起 ↑
            </button>
          </div>
        </div>
      )}
    </article>
  );
}

export { ChangjuanScreen, FilterPill, ChangjuanRow };
