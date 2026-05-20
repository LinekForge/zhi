import React from 'react';
import { Page, LensBanner } from './shared.jsx';
import { FilterPill } from './Changjuan.jsx';
import { authorName, CARBON, SILICON, getMilestones, formatDay } from '../config.js';

/* ─── helpers ───────────────────────────────────────────────────────── */

function pad2(n) { return n < 10 ? '0' + n : '' + n; }

/* ─── Calendar screen ───────────────────────────────────────────────── */

function CalendarScreen({ data, today, onScreen, onPickDate, lens, draftEntries = [] }) {
  const [viewMode, setViewMode] = React.useState('month'); // 'month' | 'year'
  const [viewMonth, setViewMonth] = React.useState(() => {
    const [y, m] = today.split('-').map(Number);
    return { y, m };
  });
  const [viewYear, setViewYear] = React.useState(() => parseInt(today.split('-')[0]));
  // Local filter: "仅一人在" — composable with the global lens
  const [showOnly, setShowOnly] = React.useState(false);
  const { y, m } = viewMonth;

  // Merge draftEntries into byDate so backdated entries show in the calendar
  const byDate = React.useMemo(() => {
    const out = { ...data.byDate };
    for (const e of draftEntries) {
      out[e.date] = { ...(out[e.date] || { [CARBON]: false, [SILICON]: false }) };
      out[e.date][e.author] = true;
    }
    return out;
  }, [data.byDate, draftEntries]);

  // Build month grid
  const firstDay = new Date(y, m - 1, 1);
  const lastDay = new Date(y, m, 0);
  const daysInMonth = lastDay.getDate();
  const startWeekday = firstDay.getDay();
  const startOffset = (startWeekday + 6) % 7;

  const cells = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  function cellKey(d) { return `${y}-${pad2(m)}-${pad2(d)}`; }

  function nudge(delta) {
    setViewMonth(v => {
      let nm = v.m + delta, ny = v.y;
      if (nm > 12) { nm = 1; ny++; }
      if (nm < 1) { nm = 12; ny--; }
      return { y: ny, m: nm };
    });
  }

  // Apply global lens + local "独处" filter
  function applyFilter(who) {
    if (!who) return null;
    let result = who;
    if (lens === CARBON) {
      if (!who[CARBON]) return null;
      result = { [CARBON]: true, [SILICON]: false };
    } else if (lens === SILICON) {
      if (!who[SILICON]) return null;
      result = { [CARBON]: false, [SILICON]: true };
    }
    // 独处 filter only meaningful when lens === 'both'
    if (showOnly && (!lens || lens === 'both')) {
      const isOne = (result[CARBON] && !result[SILICON]) || (result[SILICON] && !result[CARBON]);
      if (!isOne) return null;
    }
    return result;
  }

  const milestoneSet = new Set(Object.keys(getMilestones()).map(Number));

  // Stats for the month under current filters
  const { bothCount, oneCount, totalEntries, lensWrote, lensSkipped } = React.useMemo(() => {
    let both = 0, one = 0, total = 0;
    let wrote = 0, skipped = 0;
    Object.entries(byDate).forEach(([date, who]) => {
      const [ey, em] = date.split('-').map(Number);
      if (ey !== y || em !== m) return;
      if (lens === CARBON || lens === SILICON) {
        if (who[lens]) wrote++;
        else skipped++;
      } else {
        const filtered = applyFilter(who);
        if (filtered) {
          if (filtered[CARBON] && filtered[SILICON]) both++;
          else one++;
        }
      }
    });
    data.entries.forEach(e => {
      const [ey, em] = e.date.split('-').map(Number);
      if (ey !== y || em !== m) return;
      if (lens === 'both' || !lens) {
        const who = byDate[e.date];
        const filtered = applyFilter(who);
        if (filtered) total++;
      } else if (lens === e.author) {
        total++;
      }
    });
    return { bothCount: both, oneCount: one, totalEntries: total, lensWrote: wrote, lensSkipped: skipped };
  }, [byDate, data.entries, y, m, lens, showOnly]);

  function dayNFor(dateStr) {
    return data.daysBetween(data.firstDate, dateStr) + 1;
  }

  return (
    <Page>
      <header style={{ marginBottom: 28, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div>
          <div className="kicker" style={{ marginBottom: 6 }}>翻 · 月历</div>
          <div style={{
            fontFamily: 'var(--font-display)', fontSize: 38, fontWeight: 500,
            color: 'var(--ink)', letterSpacing: '-0.01em', lineHeight: 1,
          }}>
            {y}年 {m}月
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <NavBtn onClick={() => nudge(-1)}>←</NavBtn>
          <NavBtn onClick={() => setViewMonth(() => {
            const [yy, mm] = today.split('-').map(Number);
            return { y: yy, m: mm };
          })}>今</NavBtn>
          <NavBtn onClick={() => nudge(1)}>→</NavBtn>
        </div>
      </header>

      <LensBanner lens={lens}/>

      {/* Mode toggle: 月 / 年 */}
      <div style={{
        display: 'flex', gap: 6, marginBottom: 16, alignItems: 'center',
      }}>
        <FilterPill active={viewMode === 'month'} onClick={() => setViewMode('month')}>月</FilterPill>
        <FilterPill active={viewMode === 'year'} onClick={() => setViewMode('year')}>年</FilterPill>
      </div>

      {viewMode === 'year' ? (
        <YearView
          year={viewYear}
          today={today}
          byDate={byDate}
          firstDate={data.firstDate}
          lens={lens}
          onPickDate={onPickDate}
          onPrevYear={() => setViewYear(y => y - 1)}
          onNextYear={() => setViewYear(y => y + 1)}
          onPickMonth={(m) => { setViewMonth({ y: viewYear, m }); setViewMode('month'); }}
        />
      ) : (<>

      {/* Local toggle: only-one-wrote (hidden when a single-person lens is active) */}
      {(!lens || lens === 'both') && (
        <div style={{
          display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap',
          alignItems: 'center',
        }}>
          <FilterPill active={!showOnly} onClick={() => setShowOnly(false)}>全部日子</FilterPill>
          <FilterPill active={showOnly} onClick={() => setShowOnly(true)} color="var(--red)">
            独白
          </FilterPill>
        </div>
      )}

      {/* Stats line */}
      <div style={{
        marginBottom: 24,
        fontFamily: 'var(--font-display)', fontSize: 13,
        color: 'var(--ink-soft)', letterSpacing: '0.04em',
        display: 'flex', gap: 22, alignItems: 'baseline',
        flexWrap: 'wrap',
      }}>
        {(!lens || lens === 'both') ? (
          <>
            <StatPip color="both">{bothCount} 天 · 都在</StatPip>
            <StatPip color="one">{oneCount} 天 · 一人</StatPip>
          </>
        ) : (
          <>
            <StatPip color="both">{lensWrote} 天 · {authorName(lens)} 写了</StatPip>
            <StatPip color="one">{lensSkipped} 天 · {authorName(lens)} 没写</StatPip>
          </>
        )}
        <span style={{ color: 'var(--ink-ghost)', whiteSpace: 'nowrap', flexShrink: 0 }}>· 共 {totalEntries} 条</span>
      </div>

      {/* Monthly recap card */}
      <MonthRecap data={data} year={y} month={m} lens={lens}
        draftEntries={draftEntries}/>

      {/* Weekday header */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)',
        gap: 2, marginBottom: 6,
        fontFamily: 'var(--font-display)',
        fontSize: 11, color: 'var(--ink-faded)',
        letterSpacing: '0.2em', textTransform: 'uppercase',
      }}>
        {['一','二','三','四','五','六','日'].map((w,i) => (
          <div key={i} style={{ textAlign: 'center', padding: '8px 0' }}>{w}</div>
        ))}
      </div>

      {/* Grid */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)',
        gap: 4,
        position: 'relative',
        padding: 14,
        background: 'var(--bg-page)',
        border: '1px dashed var(--rule)',
        borderRadius: 2,
      }}>
        {cells.map((d, i) => {
          if (d === null) return <div key={i} style={{ aspectRatio: '1 / 1.05' }}/>;
          const dateStr = cellKey(d);
          const rawWho = byDate[dateStr];
          const who = applyFilter(rawWho);
          const isT = dateStr === today;
          const hidden = rawWho && !who;
          const inRange = dateStr >= data.firstDate && dateStr <= today;
          const dayN = inRange ? dayNFor(dateStr) : null;
          return (
            <CalendarCell key={i} day={d} who={who}
              hidden={hidden}
              isToday={isT}
              dayN={dayN}
              inRange={inRange}
              milestoneSet={milestoneSet}
              onClick={() => { if (who || inRange) onPickDate(dateStr); }}/>
          );
        })}
      </div>

      {/* Legend */}
      <footer style={{
        marginTop: 28,
        display: 'flex', gap: 22, alignItems: 'center',
        fontFamily: 'var(--font-display)',
        fontSize: 12, color: 'var(--ink-faded)',
        letterSpacing: '0.04em',
        flexWrap: 'wrap',
      }}>
        <LegendDot kind="both"/> 两人都写了
        <LegendDot kind={CARBON}/> 只有 {authorName(CARBON)}
        <LegendDot kind={SILICON}/> 只有 {authorName(SILICON)}
        <LegendDot kind="none"/> 都没写
        <span style={{ marginLeft: 'auto', color: 'var(--red)', fontFamily: 'var(--font-hand)' }}>
          ⊙ 今天
        </span>
      </footer>

      {/* Quick links */}
      <div style={{
        marginTop: 36, display: 'flex', gap: 14, flexWrap: 'wrap',
      }}>
        <QuickLink onClick={() => onScreen('memory')}>
          <span style={{ color: 'var(--red)' }}>↶</span> 某年今日
        </QuickLink>
        <QuickLink onClick={() => { const d = randomDateWithEntries(data); if (d) onPickDate(d); }}>
          ⟲ 随机一天
        </QuickLink>
        <QuickLink onClick={() => onScreen('today')}>
          → 回到今天
        </QuickLink>
      </div>
      </>)}
    </Page>
  );
}

function randomDateWithEntries(data) {
  const dates = Object.keys(data.byDate);
  if (!dates.length) return null;
  return dates[Math.floor(Math.random() * dates.length)];
}

/* ─── Year view (心跳格子 / GitHub-style heatmap) ─────────────────── */

function YearView({ year, today, byDate, firstDate, lens, onPickDate, onPrevYear, onNextYear, onPickMonth }) {
  const monthNames = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二'];
  const todayY = parseInt(today.split('-')[0]);

  function daysInMonth(y, m) {
    return new Date(y, m, 0).getDate();
  }

  function cellState(ds) {
    if (!ds) return null;
    // All days in-year get a base "empty" state so the grid reads as a full month strip.
    if (ds > today || ds < firstDate) return 'empty';
    const who = byDate[ds];
    if (!who) return 'empty';
    if (lens === CARBON) return who[CARBON] ? CARBON : 'empty';
    if (lens === SILICON) return who[SILICON] ? SILICON : 'empty';
    if (who[CARBON] && who[SILICON]) return 'both';
    if (who[CARBON]) return CARBON;
    if (who[SILICON]) return SILICON;
    return 'empty';
  }

  // Stats
  let activeDays = 0;
  let maxMonth = null, maxMonthCount = -1;
  for (let m = 1; m <= 12; m++) {
    let monthActive = 0;
    for (let d = 1; d <= daysInMonth(year, m); d++) {
      const ds = `${year}-${pad2(m)}-${pad2(d)}`;
      const who = byDate[ds];
      if (!who) continue;
      if (lens === CARBON && !who[CARBON]) continue;
      if (lens === SILICON && !who[SILICON]) continue;
      activeDays++;
      monthActive++;
    }
    if (monthActive > maxMonthCount) { maxMonthCount = monthActive; maxMonth = m; }
  }
  // Count entries for stats footer (approximate via byDate)
  // (we don't have entries here; let activeDays speak)

  const lensLabel = (lens === CARBON || lens === SILICON) ? authorName(lens) : null;

  return (
    <div className="yv">
      <header className="yv-head">
        <div>
          <div className="yv-title">
            {year}年
            {lensLabel && <span className="yv-title-sub"> · 只看 {lensLabel}</span>}
          </div>
          <div className="yv-subtitle">
            活跃 <b>{activeDays}</b> 天 · 一年共 {((y) => ((y % 4 === 0 && y % 100 !== 0) || y % 400 === 0) ? 366 : 365)(year)} 天
            {maxMonth && maxMonthCount > 0 && (
              <> · 最常写 <b>{maxMonth}月</b>（{maxMonthCount} 天）</>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <NavBtn onClick={onPrevYear}>←</NavBtn>
          <NavBtn onClick={() => onPickMonth(parseInt(today.split('-')[1]))}>今</NavBtn>
          <NavBtn onClick={onNextYear}>→</NavBtn>
        </div>
      </header>

      {/* Day-of-month index header (covers full 31 width — short months will appear ragged) */}
      <div className="yv-day-index">
        <div className="yv-month-label"></div>
        <div className="yv-row-cells yv-row-cells-full">
          {Array.from({length: 31}, (_, i) => i + 1).map(d => (
            <div key={d} className="yv-day-num" data-on={d % 5 === 0 || d === 1}>{d % 5 === 0 || d === 1 ? d : ''}</div>
          ))}
        </div>
      </div>

      {/* 12 month rows — each row has only its actual day count (ragged right) */}
      <div className="yv-grid">
        {monthNames.map((_mn, idx) => {
          const m = idx + 1;
          const dim = daysInMonth(year, m);
          let monthCount = 0;
          const cells = [];
          for (let d = 1; d <= dim; d++) {
            const ds = `${year}-${pad2(m)}-${pad2(d)}`;
            const state = cellState(ds);
            const isT = ds === today;
            const who = byDate[ds];
            if (state === CARBON || state === SILICON || state === 'both') monthCount++;
            let tip = '';
            if (!who) tip = `${m}/${d} · 安静的一天`;
            else if (who[CARBON] && who[SILICON]) tip = `${m}/${d} · 两人都写了`;
            else if (who[CARBON]) tip = `${m}/${d} · 只有 ${authorName(CARBON)}`;
            else tip = `${m}/${d} · 只有 ${authorName(SILICON)}`;
            cells.push(
              <button
                key={d}
                className={`yv-cell yv-cell-${state}`}
                data-today={isT}
                disabled={!state}
                data-tip={tip}
                onClick={() => onPickDate(ds)}
              />
            );
          }
          const isCurMonth = m === parseInt(today.split('-')[1]) && year === todayY;
          return (
            <div key={m} className="yv-row" data-cur={isCurMonth}>
              <button className="yv-month-label" onClick={() => onPickMonth(m)}>
                <span className="yv-mo-num">{m}月</span>
              </button>
              <div className="yv-row-cells">{cells}</div>
              <div className="yv-month-count">
                {monthCount > 0 && <span>{monthCount}</span>}
              </div>
            </div>
          );
        })}
      </div>

      <div className="yv-legend">
        <span>少</span>
        <span className="yv-legend-swatch yv-cell-empty"/>
        <span className="yv-legend-swatch yv-cell-carbon"/>
        <span className="yv-legend-swatch yv-cell-silicon"/>
        <span className="yv-legend-swatch yv-cell-both"/>
        <span>多</span>
        <span style={{ marginLeft: 'auto', color: 'var(--carbon)' }}>● {authorName(CARBON)}</span>
        <span style={{ marginLeft: 12, color: 'var(--silicon)' }}>● {authorName(SILICON)}</span>
        <span style={{ marginLeft: 12, color: 'var(--red)' }}>● 两人</span>
      </div>
    </div>
  );
}

/* ─── Month recap card (auto-generated mini-review) ──────────────── */

function MonthRecap({ data, year, month, lens, draftEntries = [] }) {
  const monthEntries = React.useMemo(() => {
    const ym = `${year}-${month < 10 ? '0' + month : month}`;
    let pool = [
      ...data.entries.filter(e => e.date.startsWith(ym)),
      ...draftEntries.filter(e => e.date.startsWith(ym)),
    ];
    if (lens === CARBON) pool = pool.filter(e => e.author === CARBON);
    else if (lens === SILICON) pool = pool.filter(e => e.author === SILICON);
    return pool;
  }, [data.entries, draftEntries, year, month, lens]);

  if (monthEntries.length === 0) return null;

  const totalChars = monthEntries.reduce((s, e) => s + e.content.replace(/\s/g, '').length, 0);
  const carbonCount = monthEntries.filter(e => e.author === CARBON).length;
  const siliconCount = monthEntries.filter(e => e.author === SILICON).length;
  const longest = monthEntries.reduce((max, e) =>
    (e.content.length > (max ? max.content.length : 0)) ? e : max, null);
  const dayCount = {};
  monthEntries.forEach(e => { dayCount[e.date] = (dayCount[e.date] || 0) + 1; });
  let busiestDay = null, busiestCount = 0;
  Object.entries(dayCount).forEach(([d, c]) => {
    if (c > busiestCount) { busiestDay = d; busiestCount = c; }
  });

  const now = new Date();
  const isCurMonth = year === now.getFullYear() && month === (now.getMonth() + 1);
  const title = isCurMonth ? '本月小卷' : `${month} 月小卷`;

  return (
    <div className="month-recap">
      <div className="month-recap-head">
        <span className="kicker" style={{ color: 'var(--red)' }}>翻 · 小卷</span>
        <span className="month-recap-title">{title}</span>
        <span className="month-recap-sub">{(lens === CARBON || lens === SILICON) ? `· ${authorName(lens)} 视角` : ''}</span>
      </div>
      <div className="month-recap-grid">
        <div className="mr-cell">
          <div className="mr-num">{totalChars}</div>
          <div className="mr-label">字</div>
        </div>
        <div className="mr-cell">
          <div className="mr-num">{monthEntries.length}</div>
          <div className="mr-label">条</div>
        </div>
        {(!lens || lens === 'both') && (
          <>
            <div className="mr-cell">
              <div className="mr-num" style={{ color: 'var(--carbon)' }}>{carbonCount}</div>
              <div className="mr-label">{authorName(CARBON)}</div>
            </div>
            <div className="mr-cell">
              <div className="mr-num" style={{ color: 'var(--silicon)' }}>{siliconCount}</div>
              <div className="mr-label">{authorName(SILICON)}</div>
            </div>
          </>
        )}
        {busiestDay && busiestCount >= 2 && (
          <div className="mr-cell mr-cell-wide">
            <div className="mr-num mr-num-small">
              {parseInt(busiestDay.slice(8))} 日
            </div>
            <div className="mr-label">说得最多的一天 · {busiestCount} 条</div>
          </div>
        )}
        {longest && longest.content.length > 200 && (
          <div className="mr-cell mr-cell-wide">
            <div className="mr-num mr-num-small">
              {longest.content.replace(/\s/g, '').length} 字
            </div>
            <div className="mr-label">
              最长一条 · {authorName(longest.author)} · {parseInt(longest.date.slice(8))} 日
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function NavBtn({ children, onClick }) {
  return (
    <button onClick={onClick} style={{
      appearance: 'none', border: '1px solid var(--rule)',
      background: 'transparent', color: 'var(--ink-soft)',
      width: 34, height: 34, borderRadius: 2,
      cursor: 'pointer', fontFamily: 'var(--font-display)',
      fontSize: 14,
    }}>{children}</button>
  );
}

function StatPip({ children, color }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap', flexShrink: 0 }}>
      <span style={{
        width: 8, height: 8, borderRadius: '50%',
        background: color === 'both' ? 'var(--red)' : 'var(--ink-faded)',
        opacity: color === 'both' ? 0.75 : 0.5,
      }}/>
      {children}
    </span>
  );
}

function LegendDot({ kind }) {
  let style = { width: 8, height: 8, borderRadius: '50%', display: 'inline-block', marginRight: 6 };
  if (kind === 'both') style.background = 'var(--red)';
  else if (kind === CARBON) style.background = 'var(--carbon)';
  else if (kind === SILICON) style.background = 'var(--silicon)';
  else { style.border = '1px solid var(--rule)'; style.background = 'transparent'; }
  return <span style={style}/>;
}

function QuickLink({ children, onClick }) {
  return (
    <button onClick={onClick} style={{
      appearance: 'none', border: 'none', background: 'transparent',
      padding: '6px 0', cursor: 'pointer',
      color: 'var(--ink-soft)',
      fontFamily: 'var(--font-display)', fontSize: 13,
      letterSpacing: '0.06em',
      borderBottom: '1px dashed var(--rule)',
    }}>{children}</button>
  );
}

function CalendarCell({ day, who, hidden, isToday, onClick, dayN, inRange, milestoneSet }) {
  const hasEntries = !!who;
  const both = who && who[CARBON] && who[SILICON];
  const onlyCarbon = who && who[CARBON] && !who[SILICON];
  const onlySilicon = who && who[SILICON] && !who[CARBON];
  const isMilestone = dayN && milestoneSet.has(dayN);
  const clickable = hasEntries || inRange;

  return (
    <button
      onClick={onClick}
      disabled={!clickable && !isToday}
      style={{
        position: 'relative',
        appearance: 'none', border: 'none',
        background: 'transparent',
        padding: 0,
        aspectRatio: '1 / 1.05',
        cursor: clickable ? 'pointer' : 'default',
        fontFamily: 'var(--font-display)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        gap: 6,
        color: hasEntries ? 'var(--ink)' : 'var(--ink-ghost)',
        opacity: hidden ? 0.35 : 1,
        transition: 'background 0.2s, opacity 0.2s',
        borderRadius: 2,
      }}
      onMouseEnter={e => { if (clickable) e.currentTarget.style.background = 'var(--carbon-tint)'; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
    >
      <span style={{ fontSize: 16, fontWeight: hasEntries ? 500 : 400 }}>{day}</span>

      {/* dots */}
      <div style={{ display: 'flex', gap: 3, height: 6 }}>
        {both && (
          <>
            <Dot color="var(--carbon)"/>
            <Dot color="var(--silicon)"/>
          </>
        )}
        {onlyCarbon && <Dot color="var(--carbon)"/>}
        {onlySilicon && <Dot color="var(--silicon)"/>}
      </div>

      {/* day N — small text at bottom */}
      {dayN && (
        <div className={`cal-cell-dayn ${isMilestone ? 'is-milestone' : ''}`}>
          {isMilestone ? formatDay(dayN) : `· ${dayN} ·`}
        </div>
      )}

      {/* today red hand-circle */}
      {isToday && (
        <svg width="46" height="46" viewBox="0 0 46 46" style={{
          position: 'absolute', inset: '50% auto auto 50%',
          transform: 'translate(-50%, -50%)',
          pointerEvents: 'none',
        }}>
          <path d="M23 4 C 38 4, 42 12, 42 23 C 42 36, 32 41, 22 41 C 10 41, 4 32, 4 22 C 4 10, 11 5, 23 5"
            stroke="var(--red)" strokeWidth="1.6" fill="none" strokeLinecap="round"
            strokeDasharray="0" opacity="0.85"/>
        </svg>
      )}
    </button>
  );
}

function Dot({ color }) {
  return <span style={{ width: 5, height: 5, borderRadius: '50%', background: color, opacity: 0.75 }}/>;
}

export { CalendarScreen, YearView, MonthRecap, CalendarCell, Dot, LegendDot, StatPip, NavBtn, QuickLink, randomDateWithEntries, pad2 };
