import React from 'react';
import { DateSticker, EntryCard, entryId } from '../components.jsx';
import { Page, applyLens, LensBanner } from './shared.jsx';
import { QuickLink, randomDateWithEntries } from './Calendar.jsx';

/* ─── Memory screen ─────────────────────────────────────────────────── */

function MemoryScreen({ data, today, voice, onScreen, onPickDate, favs, onToggleFav, onExport, lens, onAddAnnotation, annotateEntry }) {
  // "某年今日" — same M-D, different year. If we don't have one, fall back to first entry.
  const [_, mm, dd] = today.split('-');
  // Look for any entry date matching M-D but different year
  let memoryDate = null;
  for (const date of Object.keys(data.byDate)) {
    if (date.slice(5) === `${mm}-${dd}` && date !== today) {
      memoryDate = date; break;
    }
  }
  // Fallback: pick the earliest available date
  if (!memoryDate) {
    const dates = Object.keys(data.byDate).sort();
    memoryDate = dates[0] || null;
  }

  if (!memoryDate) {
    return (
      <Page>
        <header style={{ marginBottom: 40, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div className="kicker" style={{ color: 'var(--red)' }}>翻 · 回忆</div>
        </header>
        <div style={{
          fontFamily: 'var(--font-hand)', color: 'var(--ink-faded)',
          fontSize: 17, textAlign: 'center', padding: '80px 20px',
        }}>
          还没有回忆。写下第一篇日记，回忆就从这里开始。
        </div>
        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <QuickLink onClick={() => onScreen('today')}>→ 回到今天</QuickLink>
        </div>
      </Page>
    );
  }

  const memEntries = applyLens(
    data.entries.filter(e => e.date === memoryDate),
    lens
  ).sort((a, b) => a.time.localeCompare(b.time));

  const daysFromFirst = data.daysBetween(data.firstDate, memoryDate) + 1;

  return (
    <Page>
      <header style={{
        marginBottom: 40,
        position: 'relative',
        display: 'flex', flexDirection: 'column', gap: 6,
      }}>
        <div className="kicker" style={{ color: 'var(--red)' }}>翻 · 回忆</div>
        <div style={{
          fontFamily: 'var(--font-hand)',
          fontSize: 22, color: 'var(--red)',
          transform: 'rotate(-2deg)',
          alignSelf: 'flex-start',
          marginTop: 4,
        }}>
          某年 · 今日
        </div>
        <div style={{ marginTop: 16 }}>
          <DateSticker date={memoryDate} today={today} big={true} rotate={-0.8}/>
        </div>
        <div style={{
          marginTop: 12,
          fontFamily: 'var(--font-display)', fontSize: 13,
          color: 'var(--ink-soft)', letterSpacing: '0.04em',
        }}>
          那时是第 <span style={{ color: 'var(--red)' }}>{daysFromFirst}</span> 天。
        </div>
      </header>

      <LensBanner lens={lens}/>

      {/* Quotation marks decoration */}
      <div style={{
        position: 'relative',
        padding: '56px 28px 32px',
        background: 'var(--bg-page)',
        border: '1px solid var(--rule)',
        borderRadius: 2,
        marginBottom: 32,
      }}>
        <div style={{
          position: 'absolute', top: -22, left: 24,
          background: 'var(--bg-desk)', padding: '0 10px',
          fontFamily: 'var(--font-display)',
          fontSize: 56, lineHeight: 1,
          color: 'var(--red)', opacity: 0.55,
          fontStyle: 'italic',
        }}>"</div>

        <div style={{
          display: 'flex', flexDirection: 'column', gap: 'var(--density-gap)',
        }}>

          {memEntries.length > 0 ? memEntries.map((e, i) => (
            <EntryCard key={i}
              entry={annotateEntry ? annotateEntry(e) : e}
              voice={voice} today={today}
              isFav={favs && favs.has(entryId(e))}
              onToggleFav={onToggleFav} onExport={onExport}
              onAddAnnotation={onAddAnnotation}/>
          )) : (
            <div style={{
              fontFamily: 'var(--font-hand)', color: 'var(--ink-faded)',
              fontSize: 16, textAlign: 'center', padding: 40,
            }}>
              这一天没有日记。
            </div>
          )}
        </div>
      </div>

      <div style={{
        display: 'flex', gap: 14, justifyContent: 'space-between',
        flexWrap: 'wrap',
      }}>
        <QuickLink onClick={() => { const d = randomDateWithEntries(data); if (d) onPickDate(d); }}>
          ⟲ 翻到另一天
        </QuickLink>
        <QuickLink onClick={() => onScreen('today')}>
          → 回到今天
        </QuickLink>
      </div>
    </Page>
  );
}

export { MemoryScreen };
