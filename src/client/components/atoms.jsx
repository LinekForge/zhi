import React from 'react';
import { dateParts, isToday } from './utils.jsx';
import { authorShort, authorName, isSilicon, isSoloMode, getAvatar, getBadgeLabel, CARBON, SILICON } from '../config.js';

/* ─── Avatar ────────────────────────────────────────────────────────── */

function Avatar({ author, size = 28 }) {
  const si = isSilicon(author);
  const fg = si ? 'var(--silicon)' : 'var(--carbon)';
  const label = authorShort(author);

  const avatarUrl = getAvatar(author);

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={label}
        style={{
          width: size, height: size, borderRadius: '50%',
          objectFit: 'cover', flexShrink: 0,
          border: si ? `1.2px dashed ${fg}` : 'none',
          boxShadow: si ? 'none' : '0 1px 2px rgba(0,0,0,0.08)',
        }}
      />
    );
  }

  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      width: size, height: size, borderRadius: '50%',
      background: si ? 'transparent' : fg,
      border: si ? `1.2px dashed ${fg}` : 'none',
      color: si ? fg : 'var(--bg-page)',
      fontSize: size * 0.5, fontFamily: 'var(--font-display)',
      lineHeight: 1, flexShrink: 0,
      boxShadow: si ? 'none' : '0 1px 2px rgba(0,0,0,0.08)',
    }}>
      {label}
    </span>
  );
}

/* ─── Date sticker — handwritten / red ink ──────────────────────────── */

function DateSticker({ date, today, big = false, showWeekday = true, rotate = -1.2 }) {
  const { y, m, d, weekday } = dateParts(date);
  const isT = isToday(date, today);
  const fontSize = big ? 44 : 28;
  return (
    <div style={{
      display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-start',
      transform: `rotate(${rotate}deg)`,
      position: 'relative',
      padding: '4px 2px',
    }}>
      <div style={{
        fontFamily: 'var(--font-display)',
        fontSize, fontWeight: 500,
        color: 'var(--ink)',
        lineHeight: 1.1,
        letterSpacing: '-0.01em',
      }}>
        <span>{m}月{d}日</span>
        {showWeekday && (
          <span style={{
            fontSize: fontSize * 0.42, marginLeft: 12, color: 'var(--ink-soft)',
            fontWeight: 400,
          }}>· 周{weekday}</span>
        )}
        {isT && (
          <span style={{
            position: 'relative', marginLeft: 14,
            fontFamily: 'var(--font-hand)', fontSize: fontSize * 0.55,
            color: 'var(--red)', fontWeight: 600,
            transform: 'rotate(3deg)', display: 'inline-block',
          }}>
            今天
            <svg width="48" height="14" viewBox="0 0 48 14" style={{
              position: 'absolute', left: -4, bottom: -8, opacity: 0.85,
            }}>
              <path d="M2 9 C 12 4, 28 12, 46 7"
                stroke="var(--red)" strokeWidth="1.4" strokeLinecap="round" fill="none"
                strokeDasharray="3 2"/>
            </svg>
          </span>
        )}
      </div>
      {/* year line */}
      <div style={{
        marginTop: 4, fontFamily: 'var(--font-en)',
        fontSize: big ? 13 : 11, letterSpacing: '0.2em',
        color: 'var(--ink-faded)', textTransform: 'uppercase',
      }}>
        {y} · {weekday === '日' ? 'Sun' : weekday === '一' ? 'Mon' : weekday === '二' ? 'Tue'
          : weekday === '三' ? 'Wed' : weekday === '四' ? 'Thu' : weekday === '五' ? 'Fri' : 'Sat'}
      </div>
    </div>
  );
}

/* ─── Brand mark 「织」 ─────────────────────────────────────────────── */

function BrandMark({ size = 22 }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 8,
      fontFamily: 'var(--font-display)',
    }}>
      <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
        {/* two woven threads */}
        <path d="M4 8 C 12 8, 12 24, 20 24 L 28 24"
              stroke="var(--carbon)" strokeWidth="1.6" fill="none" strokeLinecap="round"/>
        <path d="M4 24 C 12 24, 12 8, 20 8 L 28 8"
              stroke="var(--silicon)" strokeWidth="1.6" fill="none" strokeLinecap="round"/>
        <circle cx="16" cy="16" r="1.6" fill="var(--red)"/>
      </svg>
      <span style={{ fontSize: size * 0.95, fontWeight: 500, color: 'var(--ink)', letterSpacing: '0.05em' }}>织</span>
    </span>
  );
}

/* ─── Days-together badge (hidden by default, reveals on tap) ─────── */

function DaysTogetherBadge({ days }) {
  const [open, setOpen] = React.useState(false);
  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        title="日记天数"
        style={{
          appearance: 'none', border: 'none', background: 'transparent',
          cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center',
        }}
      >
        <span style={{
          width: 6, height: 6, borderRadius: '50%',
          background: 'var(--red)', opacity: 0.55,
          boxShadow: '0 0 0 4px rgba(183, 62, 51, 0.06)',
        }}/>
      </button>
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: 'absolute', right: 0, top: 'calc(100% + 10px)',
            background: 'var(--bg-page)',
            border: '1px dashed var(--red-soft)',
            borderRadius: 3,
            padding: '12px 18px',
            transform: 'rotate(-1.5deg)',
            boxShadow: 'var(--shadow-pop)',
            whiteSpace: 'nowrap',
            cursor: 'default',
            zIndex: 20,
            animation: 'badge-pop 0.3s ease',
          }}
        >
          <div style={{
            fontFamily: 'var(--font-en)', fontSize: 10, letterSpacing: '0.2em',
            color: 'var(--ink-faded)', textTransform: 'uppercase',
          }}>{getBadgeLabel()}</div>
          <div style={{
            fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 500,
            color: 'var(--ink)', lineHeight: 1.1, marginTop: 2,
          }}>
            第 <span style={{ color: 'var(--red)' }}>{days}</span> 天
          </div>
          <svg width="84" height="6" viewBox="0 0 84 6" style={{ marginTop: 4 }}>
            <path d="M2 3 C 20 1, 40 5, 82 3"
                  stroke="var(--red)" strokeWidth="1" fill="none"
                  strokeDasharray="3 2" opacity="0.6"/>
          </svg>
        </div>
      )}
    </div>
  );
}

/* ─── Lens avatar (text or custom image) ──────────────────────────── */

function LensAvatar({ id, on, cls }) {
  const url = getAvatar(id);
  if (url) {
    return (
      <span className={`lens-avatar ${cls}`} data-on={on}>
        <img src={url} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
      </span>
    );
  }
  return <span className={`lens-avatar ${cls}`} data-on={on}>{authorShort(id)}</span>;
}

/* ─── Person Lens (global view filter) ─────────────────────────────── */

function PersonLens({ value, onChange }) {
  // value: 'both' | CARBON | SILICON
  if (isSoloMode()) return null;
  function cycle() {
    if (value === 'both') onChange(CARBON);
    else if (value === CARBON) onChange(SILICON);
    else onChange('both');
  }
  const carbonOn = value === 'both' || value === CARBON;
  const siliconOn = value === 'both' || value === SILICON;

  return (
    <button
      onClick={cycle}
      title={`筛选：全部 / ${authorName(CARBON)} / ${authorName(SILICON)}`}
      className="person-lens"
      data-value={value}
    >
      <LensAvatar id={CARBON} on={carbonOn} cls="lens-avatar-carbon" />
      <LensAvatar id={SILICON} on={siliconOn} cls="lens-avatar-silicon" />
      {value !== 'both' && (
        <span className="lens-label">
          只看 {authorName(value)}
        </span>
      )}
    </button>
  );
}

/* ─── NavIconBtn ───────────────────────────────────────────────────── */

function NavIconBtn({ children, onClick, title, color }) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        appearance: 'none', border: 'none', background: 'transparent',
        cursor: 'pointer',
        width: 30, height: 30, borderRadius: 4,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: color || 'var(--ink-faded)',
        transition: 'all 0.15s',
      }}
      onMouseEnter={e => {
        if (!color) e.currentTarget.style.color = 'var(--ink)';
        e.currentTarget.style.background = 'rgba(0,0,0,0.04)';
      }}
      onMouseLeave={e => {
        if (!color) e.currentTarget.style.color = 'var(--ink-faded)';
        e.currentTarget.style.background = 'transparent';
      }}
    >
      {children}
    </button>
  );
}

export { Avatar, DateSticker, BrandMark, DaysTogetherBadge, PersonLens, NavIconBtn };
