import React from 'react';
import { useTweaks, TweaksPanel, TweakSection, TweakRadio, TweakSelect, TweakToggle } from './tweaks-panel.jsx';
import { PaperTexture, TopNav } from './components.jsx';
import { useFavorites, ExportModal } from './extras.jsx';
import { pad } from './utils.jsx';
import { CARBON, SILICON } from './config.js';
import { TodayScreen, CalendarScreen, MemoryScreen, DayDetailScreen, ChangjuanScreen, AlbumScreen } from './screens.jsx';
import { LongformEditor } from './longform.jsx';
import { InlineWriter } from './inline-writer.jsx';
import { SearchPanel } from './search.jsx';
import { ExportStudio } from './export-studio.jsx';
import { Onboarding, hasSeenOnboarding } from './onboarding.jsx';
import { Settings } from './settings.jsx';

// app.jsx — main app shell, tweaks state, screen routing for 织

const EMPTY_DRAFTS = [];

const voiceLabels = { duizuo: '对坐', tonglie: '同列', zhiyi: '纸异' };
const typeLabels = { shujuan: '书卷', xinjian: '信笺', xiandai: '现代', shouzhang: '手帐' };
const densityLabels = { compact: '紧凑', regular: '舒适', comfy: '宽松' };

function daysBetween(a, b) {
  const ms = new Date(b) - new Date(a);
  return Math.round(ms / 86400000);
}

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "theme": "light",
  "voice": "duizuo",
  "type": "xinjian",
  "density": "regular",
  "textured": "on",
  "scrollFade": "on",
  "cardRotation": "on",
  "nightClarify": "on"
}/*EDITMODE-END*/;

function apiCall(url, opts, errorLabel) {
  return fetch(url, opts)
    .then(r => {
      if (!r.ok) return r.json().catch(() => ({})).then(body => { throw { status: r.status, body }; });
      return r.json().catch(() => null);
    })
    .catch(err => {
      console.error(`${errorLabel}:`, err);
      alert(`${errorLabel}，请重试`);
      return { __failed: true };
    });
}

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [screen, setScreen] = React.useState('today');
  const [dateStr, setDateStr] = React.useState(null);
  const [longformOpen, setLongformOpen] = React.useState(false);
  const [exportingEntry, setExportingEntry] = React.useState(null);
  const [exportStudioOpen, setExportStudioOpen] = React.useState(false);
  const [inlineWriterOpen, setInlineWriterOpen] = React.useState(false);
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [personLens, setPersonLens] = React.useState('both');
  const [favs, toggleFav] = useFavorites();
  const [showHidden, setShowHidden] = React.useState(false);
  const [apiEntries, setApiEntries] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  // TODO: wire up typing indicator UI — state kept for future use
  const [siliconTyping, setSiliconTyping] = React.useState(false);
  const [onboardingOpen, setOnboardingOpen] = React.useState(() => !hasSeenOnboarding());
  const [settingsOpen, setSettingsOpen] = React.useState(false);

  const fetchEntriesRef = React.useRef(null);
  const addAnnotationRef = React.useRef(null);
  const editEntryRef = React.useRef(null);

  function fetchEntries() {
    const params = showHidden ? '?showHidden=true' : '';
    fetch('/api/entries' + params)
      .then(r => r.json())
      .then(rows => {
        setApiEntries(rows.map(r => {
          const d = new Date(r.createdAt);
          const time = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
          return {
            id: r.id, date: r.date, time, author: r.author, content: r.content,
            writtenAt: r.writtenAt,
            images: r.images && r.images.length ? r.images.map(i => i.path) : undefined,
            annotations: r.annotations && r.annotations.length ? r.annotations.map(a => ({
              date: new Date(a.createdAt).toISOString().slice(0, 10),
              author: a.author, content: a.content,
            })) : undefined,
            editHistory: r.editHistory ? r.editHistory.map(e => {
              const d = new Date(e.editedAt);
              return { at: `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`, prev: e.prevContent };
            }) : [],
            favorited: r.favorited, hidden: r.hidden,
          };
        }));
      })
      .catch(err => console.error('加载日记失败:', err))
      .finally(() => setLoading(false));
  }

  fetchEntriesRef.current = fetchEntries;
  addAnnotationRef.current = addAnnotation;
  editEntryRef.current = editEntry;

  React.useEffect(() => { fetchEntries(); }, [showHidden]);

  // 轮询 pulse：AI 通过 MCP 写入后自动刷新
  React.useEffect(() => {
    let lastTs = 0;
    let timer;

    async function poll() {
      try {
        const r = await fetch('/api/pulse');
        const { ts } = await r.json();
        if (ts > lastTs && lastTs > 0) {
          fetchEntriesRef.current?.();
        }
        lastTs = ts;
      } catch {}
      timer = setTimeout(poll, 5000);
    }

    function onVisChange() {
      if (document.hidden) {
        clearTimeout(timer);
      } else {
        poll();
      }
    }

    poll();
    document.addEventListener('visibilitychange', onVisChange);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisChange);
    };
  }, []);

  function calcToday() {
    const d = new Date();
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }
  const [todayStr, setTodayStr] = React.useState(calcToday);

  React.useEffect(() => {
    function check() { const t = calcToday(); setTodayStr(prev => prev !== t ? t : prev); }
    document.addEventListener('visibilitychange', check);
    const id = setInterval(check, 60_000);
    return () => { document.removeEventListener('visibilitychange', check); clearInterval(id); };
  }, []);

  const { byDate, firstDate, imageList } = React.useMemo(() => {
    const byDate = {};
    for (const e of apiEntries) {
      byDate[e.date] = byDate[e.date] || { [CARBON]: false, [SILICON]: false };
      byDate[e.date][e.author] = true;
    }
    const sortedDates = Object.keys(byDate).sort();
    const firstDate = sortedDates.length ? sortedDates[0] : todayStr;

    const imageList = [];
    for (const e of apiEntries) {
      if (!e.images) continue;
      for (let i = 0; i < e.images.length; i++) {
        imageList.push({
          src: e.images[i], date: e.date, time: e.time,
          author: e.author, entryId: `${e.date}-${e.time}-${e.author}`, idx: i,
        });
      }
    }
    imageList.sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));

    return { byDate, firstDate, imageList };
  }, [apiEntries, todayStr]);

  const data = React.useMemo(() => ({
    entries: apiEntries,
    byDate,
    firstDate,
    today: todayStr,
    daysTogether: daysBetween(firstDate, todayStr) + 1,
    daysBetween,
    allImages: imageList,
  }), [apiEntries, byDate, firstDate, todayStr, imageList]);

  const today = todayStr;

  function addAnnotation(entry, content, author = CARBON) {
    if (!entry.id) return;
    apiCall(`/api/entries/${entry.id}/annotations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ author, content }),
    }, '批注失败').then(r => r && !r.__failed && fetchEntries());
  }

  function editEntry(entry, newContent) {
    if (!entry.id) return;
    apiCall(`/api/entries/${entry.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ author: entry.author, content: newContent }),
    }, '编辑失败').then(r => r && !r.__failed && fetchEntries());
  }

  function toggleHidden(entry) {
    if (!entry.id) return;
    const endpoint = entry.hidden
      ? `/api/entries/${entry.id}/unhide`
      : `/api/entries/${entry.id}`;
    const method = entry.hidden ? 'POST' : 'DELETE';
    apiCall(endpoint, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ author: entry.author }),
    }, '隐藏/恢复失败').then(r => r && !r.__failed && fetchEntries());
  }

  function handleSend(content, extras) {
    let images, forDate;
    if (Array.isArray(extras)) {
      images = extras;
    } else if (extras && typeof extras === 'object') {
      images = extras.images;
      forDate = extras.forDate;
    }
    const date = forDate || today;
    const writtenAt = forDate ? today : undefined;

    return apiCall('/api/entries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ author: CARBON, content, date, writtenAt, images }),
    }, '日记没有保存成功').then(r => {
      if (r && !r.__failed) { fetchEntries(); return true; }
      return false;
    });
  }

  React.useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', t.theme);
    root.setAttribute('data-voice', t.voice);
    root.setAttribute('data-type', t.type);
    root.setAttribute('data-density', t.density);
    root.setAttribute('data-textured', t.textured);
    root.setAttribute('data-scroll-fade', t.scrollFade);
    root.setAttribute('data-card-rotate', t.cardRotation);
    root.setAttribute('data-night-clarify', t.nightClarify);
  }, [t]);

  React.useEffect(() => {
    function onKey(e) {
      const tag = (e.target.tagName || '').toLowerCase();
      const inField = tag === 'input' || tag === 'textarea' || e.target.isContentEditable;
      if (inField) return;

      if (e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        setInlineWriterOpen(true);
      }
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setLongformOpen(true);
      }
      if (e.key === '/' ) {
        e.preventDefault();
        setSearchOpen(true);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  React.useEffect(() => {
    window.zhi = window.zhi || {};
    window.zhi.siliconWrote = (entry) => {
      setSiliconTyping(false);
      apiCall('/api/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ author: SILICON, content: entry.content, date: entry.date, writtenAt: entry.writtenAt }),
      }, 'siliconWrote 失败').then(r => r && !r.__failed && fetchEntriesRef.current?.());
    };
    // TODO: wire up typing indicator UI
    window.zhi.siliconStartTyping = () => setSiliconTyping(true);
    window.zhi.siliconStopTyping = () => setSiliconTyping(false);
    window.zhi.siliconAnnotate = (targetEntry, content) => {
      addAnnotationRef.current?.(targetEntry, content, SILICON);
    };
    window.zhi.siliconEdit = (targetEntry, newContent) => {
      if (targetEntry.author !== SILICON) return;
      editEntryRef.current?.(targetEntry, newContent);
    };
  }, []);

  function goScreen(s) { setScreen(s); setDateStr(null); }
  function pickDate(d) { setDateStr(d); setScreen('detail'); }

  const entryProps = {
    favs, onToggleFav: toggleFav, onExport: setExportingEntry,
    lens: personLens,
    onAddAnnotation: addAnnotation,
    onEdit: editEntry,
    onToggleHidden: toggleHidden,
    showHidden,
    annotateEntry: e => e,
  };

  let body;
  if (screen === 'today') {
    body = <TodayScreen data={data} voice={t.voice} today={today}
      loading={loading} onScreen={goScreen} draftEntries={EMPTY_DRAFTS} onSend={handleSend}
      onLongform={() => setLongformOpen(true)}
      {...entryProps}/>;
  } else if (screen === 'calendar') {
    body = <CalendarScreen data={data} today={today}
      lens={personLens} draftEntries={EMPTY_DRAFTS}
      onScreen={goScreen} onPickDate={pickDate}/>;
  } else if (screen === 'changjuan') {
    body = <ChangjuanScreen data={data} today={today} voice={t.voice}
      onPickDate={pickDate} {...entryProps}/>;
  } else if (screen === 'album') {
    body = <AlbumScreen data={data} lens={personLens}
      onPickDate={pickDate}/>;
  } else if (screen === 'memory') {
    body = <MemoryScreen data={data} today={today} voice={t.voice}
      onScreen={goScreen} onPickDate={pickDate} {...entryProps}/>;
  } else if (screen === 'detail') {
    body = <DayDetailScreen data={data} dateStr={dateStr || today}
      today={today} voice={t.voice} onScreen={goScreen}
      draftEntries={EMPTY_DRAFTS} {...entryProps}/>;
  }

  return (
    <div style={{ position: 'relative', minHeight: '100vh' }}>
      <PaperTexture/>
      <BackgroundDecor/>

      <TopNav
        screen={screen}
        onScreen={goScreen}
        daysTogether={data.daysTogether}
        onCompose={() => setInlineWriterOpen(true)}
        onSearch={() => setSearchOpen(true)}
        onExport={() => setExportStudioOpen(true)}
        onSettings={() => setSettingsOpen(true)}
        personLens={personLens}
        onLensChange={setPersonLens}
      />
      {body}

      <InlineWriter
        open={inlineWriterOpen} today={today}
        onClose={() => setInlineWriterOpen(false)}
        onSend={handleSend}
        onLongform={() => setLongformOpen(true)}
      />

      <SearchPanel
        open={searchOpen} data={data} favs={favs}
        onClose={() => setSearchOpen(false)}
        onPickDate={pickDate}
      />

      <LongformEditor
        open={longformOpen} today={today}
        onClose={() => setLongformOpen(false)}
        onSend={handleSend}
      />

      <ExportModal
        entry={exportingEntry} today={today}
        onClose={() => setExportingEntry(null)}
      />

      <ExportStudio
        open={exportStudioOpen} data={data} favs={favs}
        onClose={() => setExportStudioOpen(false)}
      />

      <Settings
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />

      <Onboarding
        open={onboardingOpen}
        onClose={() => setOnboardingOpen(false)}
        onSend={handleSend}
      />

      <TweaksPanel title="Tweaks · 织">
        <TweakSection label="基底"/>
        <TweakRadio label="深浅" value={t.theme}
          options={[{ value: 'light', label: '浅 · 纸' }, { value: 'dark', label: '深 · 夜' }]}
          onChange={v => setTweak('theme', v)}/>
        <TweakSelect label="字体" value={t.type}
          options={Object.entries(typeLabels).map(([v,l]) => ({ value: v, label: l }))}
          onChange={v => setTweak('type', v)}/>
        <TweakRadio label="密度" value={t.density}
          options={Object.entries(densityLabels).map(([v,l]) => ({ value: v, label: l }))}
          onChange={v => setTweak('density', v)}/>
        <TweakSection label="两个人的声音"/>
        <TweakSelect label="布局" value={t.voice}
          options={Object.entries(voiceLabels).map(([v,l]) => ({ value: v, label: l + ' · ' + voiceHint(v) }))}
          onChange={v => setTweak('voice', v)}/>
        <TweakSection label="纸面装饰"/>
        <TweakToggle label="纸质纤维" value={t.textured === 'on'} onChange={v => setTweak('textured', v ? 'on' : 'off')}/>
        <TweakToggle label="滚动渐淡（时间感）" value={t.scrollFade === 'on'} onChange={v => setTweak('scrollFade', v ? 'on' : 'off')}/>
        <TweakToggle label="卡片微旋转" value={t.cardRotation === 'on'} onChange={v => setTweak('cardRotation', v ? 'on' : 'off')}/>
        <TweakToggle label="夜间字体更清晰" value={t.nightClarify === 'on'} onChange={v => setTweak('nightClarify', v ? 'on' : 'off')}/>
        <TweakToggle label="显示已隐藏的日记" value={showHidden} onChange={v => setShowHidden(v)}/>
        <TweakSection label="切换页面"/>
        <TweakRadio label="屏幕" value={screen === 'detail' ? 'calendar' : screen}
          options={[
            { value: 'today', label: '今日' }, { value: 'calendar', label: '日历' },
            { value: 'changjuan', label: '长卷' }, { value: 'album', label: '相册' },
            { value: 'memory', label: '回忆' },
          ]}
          onChange={v => goScreen(v)}/>
        <TweakSelect label="设计预览" value=""
          options={[
            { value: '', label: '— 选择 —' },
            { value: 'longform', label: '长篇写作' },
            { value: 'export', label: '导出工坊' },
            { value: 'onboarding', label: '第一天引导' },
          ]}
          onChange={v => {
            if (v === 'longform') setLongformOpen(true);
            else if (v === 'export') setExportStudioOpen(true);
            else if (v === 'onboarding') setOnboardingOpen(true);
          }}/>
      </TweaksPanel>
    </div>
  );
}

function voiceHint(v) {
  switch (v) {
    case 'duizuo': return '左右对坐';
    case 'tonglie': return '同列共流';
    case 'zhiyi': return '纸面色差';
    default: return '';
  }
}

function BackgroundDecor() {
  return (
    <div aria-hidden="true" style={{
      position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse at 50% 0%, transparent 0%, transparent 50%, rgba(0,0,0,0.04) 100%)',
      }}/>
    </div>
  );
}

export { App };
