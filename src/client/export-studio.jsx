import React from 'react';
import ReactDOM from 'react-dom';
import JSZip from 'jszip';
import { dateParts, entryId } from './components.jsx';
import { authorName, CARBON, SILICON } from './config.js';

// export-studio.jsx — full-screen export workspace for 织
// Composable filters × multiple formats → ZIP download.

const PROD_ENTRY_PREFIX = '织';

function ExportStudio({ open, data, favs, onClose }) {
  const [author, setAuthor] = React.useState('both');     // both | carbon | silicon
  const [timeKind, setTimeKind] = React.useState('all');  // all | day | week | month | year | custom
  const [anchorDate, setAnchorDate] = React.useState(data.today);
  const [customStart, setCustomStart] = React.useState(data.firstDate);
  const [customEnd, setCustomEnd] = React.useState(data.today);
  const [length, setLength] = React.useState('all');      // all | short | long
  const [favOnly, setFavOnly] = React.useState(false);
  const [keyword, setKeyword] = React.useState('');
  const [dateFormat, setDateFormat] = React.useState('cn'); // cn | en

  const [fmtMdTotal, setFmtMdTotal] = React.useState(true);
  const [fmtMdDay, setFmtMdDay] = React.useState(false);
  const [fmtMdAuthor, setFmtMdAuthor] = React.useState(false);
  const [fmtJson, setFmtJson] = React.useState(true);
  const [fmtJsonl, setFmtJsonl] = React.useState(false);

  const [busy, setBusy] = React.useState(false);

  /* ─── filter logic ─── */
  function getRange() {
    if (timeKind === 'all') return null;
    if (timeKind === 'day') return [anchorDate, anchorDate];
    if (timeKind === 'week') {
      const dt = new Date(anchorDate);
      const dow = (dt.getDay() + 6) % 7; // Mon=0
      const mon = new Date(dt); mon.setDate(dt.getDate() - dow);
      const sun = new Date(mon); sun.setDate(mon.getDate() + 6);
      return [isoDate(mon), isoDate(sun)];
    }
    if (timeKind === 'month') {
      const [y, m] = anchorDate.split('-').map(Number);
      const lastDay = new Date(y, m, 0).getDate();
      return [`${y}-${pad2(m)}-01`, `${y}-${pad2(m)}-${pad2(lastDay)}`];
    }
    if (timeKind === 'year') {
      const y = anchorDate.split('-')[0];
      return [`${y}-01-01`, `${y}-12-31`];
    }
    if (timeKind === 'custom') return [customStart, customEnd];
    return null;
  }

  const filtered = React.useMemo(() => {
    let pool = [...data.entries];
    if (author !== 'both') pool = pool.filter(e => e.author === author);
    const range = getRange();
    if (range) {
      pool = pool.filter(e => e.date >= range[0] && e.date <= range[1]);
    }
    if (length === 'short') pool = pool.filter(e => e.content.length <= 220);
    if (length === 'long')  pool = pool.filter(e => e.content.length > 220);
    if (favOnly) pool = pool.filter(e => favs.has(entryId(e)));
    if (keyword.trim()) {
      const k = keyword.trim().toLowerCase();
      pool = pool.filter(e => e.content.toLowerCase().includes(k));
    }
    return pool.sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  }, [author, timeKind, anchorDate, customStart, customEnd, length, favOnly, keyword, favs, data.entries]);

  /* ─── stats ─── */
  const stats = React.useMemo(() => {
    let chars = 0, carbon = 0, silicon = 0, favCount = 0;
    const days = new Set();
    for (const e of filtered) {
      chars += e.content.replace(/\s/g, '').length;
      if (e.author === CARBON) carbon++; else silicon++;
      if (favs.has(entryId(e))) favCount++;
      days.add(e.date);
    }
    return { chars, carbon, silicon, favCount, days: days.size };
  }, [filtered, favs]);

  /* ─── builders ─── */
  function fmtDate(date) {
    const { y, m, d, weekday } = dateParts(date);
    if (dateFormat === 'cn') return `${y}年${m}月${d}日 · 周${weekday}`;
    // en
    const enDow = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][new Date(date).getDay()];
    const enMo = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][m - 1];
    return `${enDow}, ${enMo} ${d}, ${y}`;
  }

  function entryMd(e) {
    const a = authorName(e.author);
    const isFav = favs.has(entryId(e));
    const hdr = `**${a}** · ${e.time}${isFav ? ' · ★' : ''}`;
    return `${hdr}\n\n${e.content}\n`;
  }

  function buildMdTotal() {
    const range = getRange();
    const rangeStr = range
      ? `${range[0]} 至 ${range[1]}`
      : `${data.firstDate} 至 ${data.today}`;
    const lines = [];
    lines.push(`# ${PROD_ENTRY_PREFIX} · 共同日记`);
    lines.push('');
    lines.push(`> 导出时间 ${data.today}（${rangeStr}）`);
    lines.push(`> 共 ${filtered.length} 条 · ${stats.chars} 字 · ${authorName(CARBON)} ${stats.carbon} · ${authorName(SILICON)} ${stats.silicon} · ★ ${stats.favCount}`);
    lines.push('');
    lines.push('---');
    lines.push('');
    const groups = groupBy(filtered, e => e.date);
    for (const date of Object.keys(groups).sort()) {
      lines.push(`## ${fmtDate(date)}`);
      lines.push('');
      for (const e of groups[date]) {
        lines.push(entryMd(e));
      }
    }
    return lines.join('\n');
  }

  function buildMdByDay() {
    const out = {};
    const groups = groupBy(filtered, e => e.date);
    for (const date of Object.keys(groups)) {
      const lines = [`# ${fmtDate(date)}`, ''];
      for (const e of groups[date]) {
        lines.push(entryMd(e));
      }
      out[`${date}.md`] = lines.join('\n');
    }
    return out;
  }

  function buildMdByAuthor() {
    const out = {};
    // Respect 谁 filter — if author is single, only emit that file
    const authors = author === 'both' ? [CARBON, SILICON] : [author];
    for (const a of authors) {
      const list = filtered.filter(e => e.author === a);
      if (!list.length) continue;
      const name = authorName(a);
      const lines = [`# ${name}`, '', `> 共 ${list.length} 条 · ${list.reduce((s, e) => s + e.content.replace(/\s/g,'').length, 0)} 字`, ''];
      const groups = groupBy(list, e => e.date);
      for (const date of Object.keys(groups).sort()) {
        lines.push(`## ${fmtDate(date)}`);
        lines.push('');
        for (const e of groups[date]) {
          const isFav = favs.has(entryId(e));
          lines.push(`**${e.time}**${isFav ? ' · ★' : ''}\n\n${e.content}\n`);
        }
      }
      out[`${name}.md`] = lines.join('\n');
    }
    return out;
  }

  function entryObj(e) {
    return {
      date: e.date,
      time: e.time,
      author: e.author,
      author_name: authorName(e.author),
      content: e.content,
      char_count: e.content.replace(/\s/g, '').length,
      favorite: favs.has(entryId(e)),
    };
  }

  function buildJson() {
    return JSON.stringify({
      product: '织',
      exported_at: data.today,
      total: filtered.length,
      stats,
      entries: filtered.map(entryObj),
    }, null, 2);
  }

  function buildJsonl() {
    return filtered.map(e => JSON.stringify(entryObj(e))).join('\n');
  }

  function buildReadme() {
    const range = getRange();
    const rangeStr = range ? `${range[0]} ~ ${range[1]}` : '全部';
    const filters = [
      `作者: ${author === 'both' ? '两人' : authorName(author)}`,
      `时间: ${timeKindLabel(timeKind)} (${rangeStr})`,
      `长度: ${length === 'all' ? '全部' : length === 'short' ? '仅短篇' : '仅长篇'}`,
      `仅收藏: ${favOnly ? '是' : '否'}`,
      keyword.trim() ? `关键词: ${keyword.trim()}` : null,
    ].filter(Boolean);
    return [
      `# 织 · 导出说明`,
      ``,
      `导出于 ${data.today}`,
      ``,
      `## 筛选条件`,
      ``,
      ...filters.map(f => `- ${f}`),
      ``,
      `## 统计`,
      ``,
      `- 共 ${filtered.length} 条`,
      `- ${stats.chars} 字`,
      `- ${authorName(CARBON)} ${stats.carbon} 条 · ${authorName(SILICON)} ${stats.silicon} 条`,
      `- 涉及 ${stats.days} 天 · ★ 收藏 ${stats.favCount} 条`,
      ``,
      `## 文件`,
      ``,
      fmtMdTotal ? `- \`织-总集.md\` 按日期顺序的完整 Markdown` : '',
      fmtMdDay ? `- \`按天/\` 每天一份 Markdown` : '',
      fmtMdAuthor ? `- \`按人/\` ${authorName(CARBON)} 和 ${authorName(SILICON)} 各一份` : '',
      fmtJson ? `- \`织.json\` JSON 数组（含元数据）` : '',
      fmtJsonl ? `- \`织.jsonl\` 每行一条 JSON` : '',
    ].filter(Boolean).join('\n');
  }

  /* ─── preview text ─── */
  const preview = React.useMemo(() => {
    if (filtered.length === 0) return '— 没有命中任何日记 —';
    // Show top of MD total
    return buildMdTotal().split('\n').slice(0, 24).join('\n') + '\n...';
    // eslint-disable-next-line
  }, [filtered, dateFormat, fmtMdTotal]);

  /* ─── download ─── */
  async function downloadZip() {
    const anyFmt = fmtMdTotal || fmtMdDay || fmtMdAuthor || fmtJson || fmtJsonl;
    if (!anyFmt) { alert('选一种格式吧'); return; }
    if (!filtered.length) { alert('没有命中任何日记'); return; }
    if (!JSZip) { alert('JSZip 未加载，请刷新页面'); return; }
    setBusy(true);
    try {
      const zip = new JSZip();
      if (fmtMdTotal)  zip.file('织-总集.md', buildMdTotal());
      if (fmtMdDay) {
        const fl = zip.folder('按天');
        const files = buildMdByDay();
        for (const [n, c] of Object.entries(files)) fl.file(n, c);
      }
      if (fmtMdAuthor) {
        const fl = zip.folder('按人');
        const files = buildMdByAuthor();
        for (const [n, c] of Object.entries(files)) fl.file(n, c);
      }
      if (fmtJson)  zip.file('织.json', buildJson());
      if (fmtJsonl) zip.file('织.jsonl', buildJsonl());
      zip.file('README.md', buildReadme());

      const blob = await zip.generateAsync({ type: 'blob' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `织·导出·${data.today}.zip`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    } catch (err) {
      console.error(err);
      alert('打包失败: ' + (err.message || err));
    } finally {
      setBusy(false);
    }
  }

  React.useEffect(() => {
    if (!open) return;
    function onKey(e) { if (e.key === 'Escape') onClose(); }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return ReactDOM.createPortal(
    <div className="es-shell" onClick={onClose}>
      <div className="es-body" onClick={e => e.stopPropagation()}>

        <header className="es-head">
          <div>
            <div className="kicker" style={{ color: 'var(--red)' }}>导出 · 工坊</div>
            <h2 style={{
              fontFamily: 'var(--font-display)', fontSize: 24, margin: '6px 0 0',
              fontWeight: 500, color: 'var(--ink)', letterSpacing: '-0.01em',
            }}>把日记装进口袋带走</h2>
          </div>
          <button className="lf-icon-btn" onClick={onClose} title="关闭 (Esc)">
            <svg width="18" height="18" viewBox="0 0 18 18">
              <path d="M4 4 L14 14 M14 4 L4 14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
          </button>
        </header>

        <div className="es-grid">
          {/* Left — filters */}
          <div className="es-col">
            <ESField label="谁">
              <ESPills value={author} options={[
                {v:'both', l:'两人'}, {v:CARBON, l:authorName(CARBON)}, {v:SILICON, l:authorName(SILICON)},
              ]} onChange={setAuthor}/>
            </ESField>

            <ESField label="时间范围">
              <ESPills value={timeKind} options={[
                {v:'all', l:'全部'}, {v:'day', l:'某天'}, {v:'week', l:'某周'},
                {v:'month', l:'某月'}, {v:'year', l:'某年'}, {v:'custom', l:'自定义'},
              ]} onChange={setTimeKind}/>
              {timeKind !== 'all' && timeKind !== 'custom' && (
                <div style={{ marginTop: 10 }}>
                  <ESDateInput
                    value={anchorDate}
                    onChange={setAnchorDate}
                    granularity={timeKind}
                  />
                </div>
              )}
              {timeKind === 'custom' && (
                <div style={{ marginTop: 10, display: 'flex', gap: 8, alignItems: 'center' }}>
                  <ESDateInput value={customStart} onChange={setCustomStart}/>
                  <span style={{ color: 'var(--ink-faded)', fontSize: 13 }}>至</span>
                  <ESDateInput value={customEnd} onChange={setCustomEnd}/>
                </div>
              )}
            </ESField>

            <ESField label="长度">
              <ESPills value={length} options={[
                {v:'all', l:'全部'}, {v:'short', l:'仅短篇'}, {v:'long', l:'仅长篇'},
              ]} onChange={setLength}/>
            </ESField>

            <ESField label="关键词">
              <input
                type="text"
                value={keyword}
                onChange={e => setKeyword(e.target.value)}
                placeholder="搜索全文…"
                className="es-input"
              />
            </ESField>

            <ESField label="">
              <label className="es-check">
                <input type="checkbox" checked={favOnly}
                       onChange={e => setFavOnly(e.target.checked)}/>
                <span>仅看收藏 <span style={{ color: 'var(--red)' }}>★</span></span>
              </label>
            </ESField>

            <ESField label="日期写法">
              <ESPills value={dateFormat} options={[
                {v:'cn', l:`中文 (${fmtDate(data.today)})`}, {v:'en', l:`English (${(() => { const [y,m,d] = data.today.split('-').map(Number); const mo = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][m-1]; return `${mo} ${d}, ${y}`; })()})`},
              ]} onChange={setDateFormat}/>
            </ESField>
          </div>

          {/* Right — formats + stats + preview */}
          <div className="es-col">
            {/* Stats card */}
            <div className="es-stats">
              <div className="es-stat">
                <div className="es-stat-num">{filtered.length}</div>
                <div className="es-stat-label">条</div>
              </div>
              <div className="es-stat">
                <div className="es-stat-num">{stats.chars}</div>
                <div className="es-stat-label">字</div>
              </div>
              <div className="es-stat">
                <div className="es-stat-num">{stats.days}</div>
                <div className="es-stat-label">天</div>
              </div>
              <div className="es-stat">
                <div className="es-stat-num" style={{ color: 'var(--carbon)' }}>{stats.carbon}</div>
                <div className="es-stat-label">{authorName(CARBON)}</div>
              </div>
              <div className="es-stat">
                <div className="es-stat-num" style={{ color: 'var(--silicon)' }}>{stats.silicon}</div>
                <div className="es-stat-label">{authorName(SILICON)}</div>
              </div>
              <div className="es-stat">
                <div className="es-stat-num" style={{ color: 'var(--red)' }}>{stats.favCount}</div>
                <div className="es-stat-label">★</div>
              </div>
            </div>

            <ESField label="格式">
              <div className="es-formats">
                <ESFmtCheck checked={fmtMdTotal}  onChange={setFmtMdTotal}
                  title="Markdown · 总集"
                  desc="一份按日期顺序拼接的 .md"/>
                <ESFmtCheck checked={fmtMdDay}    onChange={setFmtMdDay}
                  title="Markdown · 一天一份"
                  desc={`按 ${data.today}.md 分文件`}/>
                <ESFmtCheck checked={fmtMdAuthor} onChange={setFmtMdAuthor}
                  title="Markdown · 一人一份"
                  desc={
                    author === CARBON ? `只导出 ${authorName(CARBON)}.md` :
                    author === SILICON ? `只导出 ${authorName(SILICON)}.md` :
                    `${authorName(CARBON)}.md · ${authorName(SILICON)}.md`
                  }/>
                <ESFmtCheck checked={fmtJson}     onChange={setFmtJson}
                  title="JSON · 数组"
                  desc="含元数据，适合备份 / 迁移"/>
                <ESFmtCheck checked={fmtJsonl}    onChange={setFmtJsonl}
                  title="JSONL · 一行一条"
                  desc="适合批量喂给语言模型处理"/>
              </div>
            </ESField>

            <ESField label="预览（总集 顶部）">
              <pre className="es-preview">{preview}</pre>
            </ESField>
          </div>
        </div>

        <footer className="es-foot">
          <span style={{
            fontFamily: 'var(--font-display)', fontSize: 13,
            color: 'var(--ink-soft)',
          }}>
            {filtered.length} 条 · 打包 ZIP（含 README）
          </span>
          <button className="exp-download" onClick={downloadZip} disabled={busy || !filtered.length}>
            {busy ? '打包中…' : '↓ 下载 ZIP'}
          </button>
        </footer>
      </div>
    </div>,
    document.body
  );
}

/* ─── Sub-components ────────────────────────────────────────────────── */

function ESField({ label, children }) {
  return (
    <div className="es-field">
      {label && <div className="es-field-label">{label}</div>}
      {children}
    </div>
  );
}

function ESPills({ value, options, onChange }) {
  return (
    <div className="es-pills">
      {options.map(o => (
        <button key={o.v}
          className="es-pill"
          data-active={value === o.v}
          onClick={() => onChange(o.v)}>{o.l}</button>
      ))}
    </div>
  );
}

function ESDateInput({ value, onChange, granularity }) {
  // Granularity-aware native inputs.
  // 'day'   → <input type="date">     value is YYYY-MM-DD
  // 'week'  → <input type="week">     value is YYYY-Www, convert to anchor date (Monday)
  // 'month' → <input type="month">    value is YYYY-MM, convert to YYYY-MM-01
  // 'year'  → year dropdown           value is YYYY, convert to YYYY-01-01

  if (granularity === 'week') {
    const wk = dateToWeek(value);
    return (
      <input
        type="week"
        value={wk}
        onChange={e => {
          const v = e.target.value;
          if (!v) return;
          onChange(weekToDate(v));
        }}
        className="es-input es-date-input"
      />
    );
  }
  if (granularity === 'month') {
    const ym = (value || '').slice(0, 7);
    return (
      <input
        type="month"
        value={ym}
        onChange={e => {
          const v = e.target.value;
          if (!v) return;
          onChange(`${v}-01`);
        }}
        className="es-input es-date-input"
      />
    );
  }
  if (granularity === 'year') {
    const y = (value || '').slice(0, 4);
    const thisY = new Date().getFullYear();
    const years = [];
    for (let yy = thisY; yy >= thisY - 10; yy--) years.push(yy);
    return (
      <select
        value={y}
        onChange={e => onChange(`${e.target.value}-01-01`)}
        className="es-input es-date-input"
      >
        {years.map(yr => <option key={yr} value={yr}>{yr} 年</option>)}
      </select>
    );
  }
  // default: day
  return (
    <input
      type="date"
      value={value}
      onChange={e => onChange(e.target.value)}
      className="es-input es-date-input"
    />
  );
}

function dateToWeek(yyyymmdd) {
  // Returns ISO week string YYYY-Www. Naive but correct enough for our range.
  if (!yyyymmdd) return '';
  const dt = new Date(yyyymmdd);
  // ISO week: Thursday in current week decides year
  const tmp = new Date(Date.UTC(dt.getFullYear(), dt.getMonth(), dt.getDate()));
  const dow = tmp.getUTCDay() || 7;
  tmp.setUTCDate(tmp.getUTCDate() + 4 - dow);
  const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((tmp - yearStart) / 86400000) + 1) / 7);
  return `${tmp.getUTCFullYear()}-W${pad2(week)}`;
}
function weekToDate(wk) {
  // YYYY-Www → date of Monday of that week (returns YYYY-MM-DD)
  const m = /^(\d{4})-W(\d{2})$/.exec(wk);
  if (!m) return '';
  const y = +m[1], w = +m[2];
  // Find Jan 4 of that year — always in week 1
  const jan4 = new Date(Date.UTC(y, 0, 4));
  const jan4Dow = jan4.getUTCDay() || 7;
  const week1Mon = new Date(jan4);
  week1Mon.setUTCDate(jan4.getUTCDate() - jan4Dow + 1);
  const target = new Date(week1Mon);
  target.setUTCDate(week1Mon.getUTCDate() + (w - 1) * 7);
  return `${target.getUTCFullYear()}-${pad2(target.getUTCMonth() + 1)}-${pad2(target.getUTCDate())}`;
}

function ESFmtCheck({ checked, onChange, title, desc }) {
  return (
    <label className="es-fmt" data-on={checked}>
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)}/>
      <div>
        <div className="es-fmt-title">{title}</div>
        <div className="es-fmt-desc">{desc}</div>
      </div>
    </label>
  );
}

/* ─── helpers ───────────────────────────────────────────────────────── */
function pad2(n) { return n < 10 ? '0' + n : '' + n; }
function isoDate(dt) { return `${dt.getFullYear()}-${pad2(dt.getMonth()+1)}-${pad2(dt.getDate())}`; }
function groupBy(arr, keyFn) {
  const out = {};
  for (const x of arr) {
    const k = keyFn(x);
    (out[k] = out[k] || []).push(x);
  }
  return out;
}
function timeKindLabel(k) {
  return ({ all:'全部', day:'某天', week:'某周', month:'某月', year:'某年', custom:'自定义' })[k] || k;
}

export { ExportStudio };
