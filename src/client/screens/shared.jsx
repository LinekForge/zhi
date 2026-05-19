import { authorName, SILICON } from '../config.js';

/* ─── Page chrome / paper container ─────────────────────────────────── */

function Page({ children, narrow = false, edgeMark }) {
  return (
    <main style={{
      maxWidth: narrow ? 640 : 720,
      margin: '0 auto',
      padding: '48px 28px 160px',
      position: 'relative',
      minHeight: 'calc(100vh - 60px)',
    }}>
      {edgeMark}
      {children}
    </main>
  );
}

/* ─── Lens helpers ──────────────────────────────────────────────────── */

function applyLens(entries, lens) {
  if (lens === 'both' || !lens) return entries;
  return entries.filter(e => e.author === lens);
}

function LensBanner({ lens }) {
  if (!lens || lens === 'both') return null;
  const name = authorName(lens);
  const color = lens === SILICON ? 'var(--silicon)' : 'var(--carbon)';
  return (
    <div style={{
      marginBottom: 24,
      padding: '8px 14px',
      borderLeft: `2px solid ${color}`,
      background: 'color-mix(in srgb, var(--bg-page) 50%, transparent)',
      fontFamily: 'var(--font-display)', fontSize: 13,
      color: 'var(--ink-soft)', letterSpacing: '0.02em',
      display: 'flex', alignItems: 'center', gap: 10,
    }}>
      <span style={{ color }}>○</span>
      <span>正在只看 <b style={{ color, fontWeight: 600 }}>{name}</b> 的日记 · 点顶栏切回全部</span>
    </div>
  );
}

export { Page, applyLens, LensBanner };
