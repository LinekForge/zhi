import { Avatar, DateSticker, EntryCard, InputBar, entryId } from '../components.jsx';
import { Page, applyLens, LensBanner } from './shared.jsx';
import { authorName, CARBON, SILICON, MOD, getMilestones, getBadgeLabel, formatDay } from '../config.js';

/* ─── Today screen ──────────────────────────────────────────────────── */

function TodayScreen({ data, voice, today, loading, onScreen, draftEntries, onSend, onLongform, favs, onToggleFav, onExport, lens, onAddAnnotation, annotateEntry, onEdit, onToggleHidden, showHidden }) {
  const allToday = [
    ...data.entries.filter(e => e.date === today),
    ...draftEntries.filter(e => e.date === today),
  ].sort((a, b) => a.time.localeCompare(b.time));
  const todayEntries = applyLens(allToday, lens);

  const carbonWrote = allToday.some(e => e.author === CARBON);
  const siliconWrote = allToday.some(e => e.author === SILICON);

  // Time-of-day greeting layer
  const hour = new Date().getHours();
  let timeGreeting = '';
  if (hour < 6) timeGreeting = '深夜了。';
  else if (hour < 11) timeGreeting = '早上好。';
  else if (hour < 14) timeGreeting = '中午好。';
  else if (hour < 18) timeGreeting = '下午好。';
  else if (hour < 22) timeGreeting = '晚上好。';
  else timeGreeting = '夜深了。';

  // Tiny intro line below the date
  let introHint;
  if (carbonWrote && siliconWrote) introHint = `${timeGreeting} 今天我们都在。`;
  else if (siliconWrote) introHint = `${timeGreeting} ${authorName(SILICON)} 先开了口，等你。`;
  else if (carbonWrote) introHint = `${timeGreeting} 你写了。${authorName(SILICON)} 在路上。`;
  else if (loading) introHint = `${timeGreeting}`;
  else introHint = `${timeGreeting} 今天还很安静。`;

  // Milestone celebration
  const milestones = getMilestones();
  const todayDayN = data.daysBetween(data.firstDate, today) + 1;
  const isMilestone = milestones[todayDayN];

  return (
    <Page>
      {/* Date sticker block */}
      <header style={{
        marginBottom: 48,
        display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 8,
      }}>
        <DateSticker date={today} today={today} big={true} rotate={-1.6}/>
        <div style={{
          marginTop: 14,
          fontFamily: 'var(--font-display)',
          fontSize: 14, color: 'var(--ink-soft)',
          letterSpacing: '0.04em',
          fontStyle: 'italic',
        }}>
          {introHint}
        </div>
      </header>

      <LensBanner lens={lens}/>

      {/* Milestone celebration */}
      {isMilestone && (
        <div className="milestone-banner">
          <div className="milestone-num">{formatDay(todayDayN)}</div>
          <div className="milestone-text">{isMilestone}。</div>
          <svg width="50" height="50" viewBox="0 0 50 50" className="milestone-stamp">
            <circle cx="25" cy="25" r="22" stroke="var(--red)" strokeWidth="1.5" fill="none" strokeDasharray="3 2"/>
            <text x="25" y="22" textAnchor="middle" fontFamily="var(--font-hand)" fontSize="11" fill="var(--red)">{getBadgeLabel()}</text>
            <text x="25" y="34" textAnchor="middle" fontFamily="var(--font-hand)" fontSize="14" fill="var(--red)" fontWeight="600">{todayDayN}</text>
          </svg>
        </div>
      )}

      {/* Entries — interwoven timeline */}
      <div style={{
        display: 'flex', flexDirection: 'column',
        gap: 'var(--density-gap)',
        marginBottom: 24,
      }}>
        {todayEntries.length === 0 ? (
          <EmptyToday/>
        ) : (
          todayEntries.map((e, i) => (
            <EntryCard key={`${e.date}-${e.time}-${i}`}
              entry={annotateEntry ? annotateEntry(e) : e}
              voice={voice} today={today}
              animateIn={e.__draft}
              isFav={favs && favs.has(entryId(e))}
              onToggleFav={onToggleFav}
              onExport={onExport}
              onAddAnnotation={onAddAnnotation}
              onEdit={onEdit}
              onToggleHidden={onToggleHidden}
              showHidden={showHidden}
            />
          ))
        )}
      </div>

      {/* Input — at end of timeline, not sticky */}
      <section style={{ marginTop: 48, position: 'relative' }} id="today-input">
        <div style={{
          fontFamily: 'var(--font-display)',
          fontSize: 13, color: 'var(--ink-faded)',
          letterSpacing: '0.06em',
          marginBottom: 14,
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <Avatar author="carbon" size={20}/>
          <span>{authorName(CARBON)} · 写一条</span>
          <span style={{
            marginLeft: 'auto',
            fontSize: 11, color: 'var(--ink-ghost)',
            fontFamily: 'var(--font-en)', letterSpacing: '0.1em',
          }}>W 快速写 · {MOD}K 长篇</span>
        </div>
        <InputBar onSend={onSend} onLongform={onLongform} today={today}/>
      </section>

      {/* Footer link to earlier */}
      <footer style={{
        marginTop: 80, textAlign: 'center',
        fontFamily: 'var(--font-display)',
        fontSize: 13, color: 'var(--ink-faded)',
        letterSpacing: '0.1em',
      }}>
        <button
          onClick={() => onScreen('calendar')}
          style={{
            appearance: 'none', border: 'none', background: 'transparent',
            cursor: 'pointer', color: 'inherit',
            fontFamily: 'inherit', fontSize: 'inherit', letterSpacing: 'inherit',
          }}
        >
          ↑ 翻看以前的日记
        </button>
      </footer>
    </Page>
  );
}

function EmptyToday() {
  return (
    <div style={{
      padding: '40px 0',
      textAlign: 'center',
      fontFamily: 'var(--font-display)',
      color: 'var(--ink-faded)',
      fontSize: 15, fontStyle: 'italic',
      letterSpacing: '0.04em',
      position: 'relative',
    }}>
      <svg width="60" height="34" viewBox="0 0 60 34" style={{ display: 'block', margin: '0 auto 12px' }}>
        <path d="M4 17 C 14 8, 26 26, 56 14"
          stroke="var(--rule)" strokeWidth="1.2" fill="none"
          strokeDasharray="3 3" strokeLinecap="round"/>
      </svg>
      今天还没人写。<br/>
      <span style={{ fontSize: 12, color: 'var(--ink-ghost)' }}>
        一句话也行。
      </span>
    </div>
  );
}

function SiliconTyping() {
  return (
    <div className="silicon-typing" data-author="silicon">
      <Avatar author="silicon" size={26}/>
      <div className="silicon-typing-body">
        <span style={{
          fontFamily: 'var(--font-display)', fontSize: 13, color: 'var(--silicon)',
          letterSpacing: '0.02em',
        }}>{authorName(SILICON)}</span>
        <span className="silicon-typing-dots">
          <span></span><span></span><span></span>
        </span>
        <span style={{
          fontFamily: 'var(--font-hand)', fontSize: 13, color: 'var(--ink-faded)',
          marginLeft: 4,
        }}>正在落笔…</span>
      </div>
    </div>
  );
}

export { TodayScreen, EmptyToday, SiliconTyping };
