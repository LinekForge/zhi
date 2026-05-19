import { BrandMark, Avatar, DateSticker, EntryCard, InputBar } from '../components.jsx';
import { Page } from './shared.jsx';
import { authorName, CARBON, SILICON } from '../config.js';

/* ─── Welcome screen — first letter ─────────────────────────────────── */

function WelcomeScreen({ today, voice, onScreen, onSend, onLongform }) {
  const welcomeEntry = {
    date: '2025-01-01', time: '07:00', author: SILICON,
    content: '这是我们的地方。\n\n你写你的，我写我的。打开就看到对方。\n\n从今天开始。',
  };
  return (
    <Page narrow>
      <header style={{
        marginBottom: 48, textAlign: 'center',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14,
      }}>
        <BrandMark size={42}/>
        <div style={{
          fontFamily: 'var(--font-en)', fontSize: 11,
          letterSpacing: '0.36em', color: 'var(--ink-faded)',
          textTransform: 'uppercase', marginTop: 8,
        }}>
          a shared journal · between silicon &amp; carbon
        </div>
        <div style={{
          fontFamily: 'var(--font-display)', fontSize: 15,
          color: 'var(--ink-soft)', marginTop: 6,
          fontStyle: 'italic',
        }}>
          两条线交织，落在同一张纸上。
        </div>
      </header>

      {/* Big sticker date */}
      <div style={{
        marginBottom: 36,
        display: 'flex', alignItems: 'center', gap: 18,
        paddingBottom: 28,
        borderBottom: '1px dashed var(--rule)',
      }}>
        <DateSticker date={welcomeEntry.date} today={today} big={true} rotate={-2}/>
        <div style={{
          fontFamily: 'var(--font-hand)', color: 'var(--red)',
          fontSize: 18, transform: 'rotate(4deg)',
          marginLeft: 'auto',
        }}>
          第一天
        </div>
      </div>

      {/* Letter — opening message */}
      <div style={{ marginBottom: 48 }}>
        <EntryCard entry={welcomeEntry} voice={voice} today={today}/>
      </div>

      {/* Empty waiting state for carbon author */}
      <div style={{
        padding: '32px 20px',
        border: '1px dashed var(--rule)',
        borderRadius: 2,
        marginBottom: 32,
        textAlign: 'center',
        fontFamily: 'var(--font-display)',
        color: 'var(--ink-faded)',
        fontStyle: 'italic',
      }}>
        <Avatar author="carbon" size={32}/>
        <div style={{ marginTop: 12, fontSize: 14 }}>
          {authorName(CARBON)} · 等你写第一篇
        </div>
        <svg width="80" height="14" viewBox="0 0 80 14" style={{ marginTop: 12, opacity: 0.6 }}>
          <path d="M2 8 C 20 2, 60 12, 78 6"
            stroke="var(--rule)" strokeWidth="1.2" fill="none"
            strokeDasharray="3 3" strokeLinecap="round"/>
        </svg>
      </div>

      <InputBar onSend={onSend} onLongform={onLongform} placeholder="写下第一句…"/>

      <footer style={{
        marginTop: 60, textAlign: 'center',
        fontFamily: 'var(--font-display)',
        fontSize: 12, color: 'var(--ink-ghost)',
        letterSpacing: '0.06em',
      }}>
        <button
          onClick={() => onScreen('today')}
          style={{
            appearance: 'none', border: 'none', background: 'transparent',
            cursor: 'pointer', color: 'var(--ink-faded)',
            fontFamily: 'inherit', fontSize: 'inherit', letterSpacing: 'inherit',
          }}
        >
          → 进入今天
        </button>
      </footer>
    </Page>
  );
}

export { WelcomeScreen };
