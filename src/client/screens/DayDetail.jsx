import { DateSticker, EntryCard, entryId } from '../components.jsx';
import { Page, applyLens, LensBanner } from './shared.jsx';
import { authorName, CARBON, SILICON } from '../config.js';

/* ─── Day Detail (when picking a date from calendar/memory) ─────────── */

function DayDetailScreen({ data, dateStr, today, voice, onScreen, favs, onToggleFav, onExport, lens, onAddAnnotation, annotateEntry, draftEntries = [], onEdit, onToggleHidden, showHidden }) {
  const entries = applyLens(
    [
      ...data.entries.filter(e => e.date === dateStr),
      ...draftEntries.filter(e => e.date === dateStr),
    ],
    lens
  ).sort((a, b) => a.time.localeCompare(b.time));

  const daysFromFirst = Math.max(1, data.daysBetween(data.firstDate, dateStr) + 1);
  const carbonWrote = entries.some(e => e.author === CARBON);
  const siliconWrote = entries.some(e => e.author === SILICON);

  let hint;
  if (carbonWrote && siliconWrote) hint = '这一天我们都写了。';
  else if (carbonWrote) hint = `这一天只有 ${authorName(CARBON)} 写了。`;
  else if (siliconWrote) hint = `这一天只有 ${authorName(SILICON)} 写了。`;
  else hint = '这一天空着。';

  return (
    <Page>
      <header style={{ marginBottom: 40 }}>
        <button
          onClick={() => onScreen('calendar')}
          style={{
            display: 'block',
            appearance: 'none', border: 'none', background: 'transparent',
            cursor: 'pointer', color: 'var(--ink-faded)',
            fontFamily: 'var(--font-display)', fontSize: 13,
            letterSpacing: '0.06em', marginBottom: 20, padding: 0,
          }}
        >
          ← 回到月历
        </button>
        <DateSticker date={dateStr} today={today} big={true} rotate={-1.2}/>
        <div style={{
          marginTop: 12,
          fontFamily: 'var(--font-display)', fontSize: 13,
          color: 'var(--ink-soft)', letterSpacing: '0.04em',
        }}>
          {hint} · 第 <span style={{ color: 'var(--red)' }}>{daysFromFirst}</span> 天
        </div>
      </header>

      <LensBanner lens={lens}/>

      <div style={{
        display: 'flex', flexDirection: 'column',
        gap: 'var(--density-gap)',
      }}>
        {entries.length > 0 ? entries.map((e, i) => (
          <EntryCard key={i}
            entry={annotateEntry ? annotateEntry(e) : e}
            voice={voice} today={today}
            isFav={favs && favs.has(entryId(e))}
            onToggleFav={onToggleFav} onExport={onExport}
            onAddAnnotation={onAddAnnotation}
            onEdit={onEdit}
            onToggleHidden={onToggleHidden}
            showHidden={showHidden}/>
        )) : (
          <div style={{
            fontFamily: 'var(--font-hand)', color: 'var(--ink-faded)',
            fontSize: 22, textAlign: 'center', padding: 80,
            lineHeight: 1.8,
          }}>
            这一天的纸是空的。<br/>
            <span style={{ fontSize: 14, color: 'var(--ink-ghost)' }}>
              想补一句话吗？
            </span>
            <div style={{ marginTop: 24 }}>
              <button
                onClick={() => { /* user can use ✎ to backdate */ }}
                style={{
                  fontFamily: 'var(--font-display)', fontSize: 12,
                  color: 'var(--red)', letterSpacing: '0.06em',
                  appearance: 'none', border: '1px dashed var(--red-soft)',
                  background: 'transparent',
                  padding: '6px 14px', borderRadius: 999,
                  cursor: 'default',
                }}>
                顶栏 ✎ 可以回写到这一天
              </button>
            </div>
          </div>
        )}
      </div>
    </Page>
  );
}

export { DayDetailScreen };
