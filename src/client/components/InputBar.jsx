import React from 'react';
import { MOD } from '../config.js';

/* ─── Input bar (动笔 vibe) ─────────────────────────────────────────── */

function InputBar({ onSend, onLongform, placeholder = '今天想说点什么…', today }) {
  const [value, setValue] = React.useState('');
  const [focused, setFocused] = React.useState(false);
  const [expanded, setExpanded] = React.useState(false);
  const [images, setImages] = React.useState([]);
  const [forDate, setForDate] = React.useState(today || '');
  const [showDatePick, setShowDatePick] = React.useState(false);
  const [sending, setSending] = React.useState(false);
  const inputRef = React.useRef(null);
  const fileRef = React.useRef(null);
  const MAX = 9;

  React.useEffect(() => { if (today && !forDate) setForDate(today); }, [today]);

  function handleKey(e) {
    if (sending) return;
    if (e.key === 'Enter' && !e.shiftKey && !expanded) {
      e.preventDefault();
      submit();
    }
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submit();
  }
  function submit() {
    const v = value.trim();
    if (!v && images.length === 0) return;
    if (sending) return;
    const extras = {};
    if (images.length) extras.images = images;
    if (today && forDate && forDate !== today) extras.forDate = forDate;
    if (!onSend) return;
    setSending(true);
    const result = onSend(v, extras);
    if (result && typeof result.then === 'function') {
      result.then(ok => {
        setSending(false);
        if (ok !== false) { setValue(''); setImages([]); setForDate(today || ''); }
      }).catch(() => {
        setSending(false);
      });
    } else {
      setSending(false);
      setValue(''); setImages([]); setForDate(today || '');
    }
  }
  function handleFiles(files) {
    const MAX_FILE_BYTES = 5 * 1024 * 1024;
    const arr = Array.from(files).filter(f => f.size <= MAX_FILE_BYTES).slice(0, MAX - images.length);
    Promise.all(arr.map(f => new Promise(res => {
      const fr = new FileReader();
      fr.onload = () => res(fr.result);
      fr.readAsDataURL(f);
    }))).then(urls => setImages(prev => [...prev, ...urls].slice(0, MAX)));
  }

  return (
    <div style={{
      position: 'relative',
      background: 'var(--bg-page-2)',
      border: `1px solid ${focused ? 'var(--red-soft)' : 'var(--rule)'}`,
      borderRadius: 4,
      transition: 'border-color 0.3s',
      boxShadow: focused ? '0 0 0 4px rgba(183, 62, 51, 0.06)' : 'none',
      overflow: 'hidden',
    }}>
      {/* dashed accent line at top */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 1,
        backgroundImage: 'repeating-linear-gradient(90deg, var(--red) 0 6px, transparent 6px 10px)',
        opacity: focused ? 0.4 : 0.15,
        transition: 'opacity 0.3s',
      }}/>

      <div style={{ display: 'flex', alignItems: 'stretch' }}>
        {/* pen icon */}
        <div style={{
          padding: '14px 0 14px 16px',
          display: 'flex', alignItems: focused || expanded ? 'flex-start' : 'center',
          paddingTop: focused || expanded ? 18 : 14,
          color: focused ? 'var(--red)' : 'var(--ink-faded)',
          transition: 'all 0.3s',
        }}>
          <svg width="16" height="16" viewBox="0 0 16 16">
            <path d="M2 14 L4 12 L11 5 L13 7 L6 14 L2 14 Z" fill="currentColor" opacity="0.7"/>
            <path d="M11 5 L12 4 L14 6 L13 7 Z" fill="currentColor"/>
          </svg>
        </div>

        {expanded ? (
          <textarea
            ref={inputRef}
            value={value}
            onChange={e => setValue(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onKeyDown={handleKey}
            placeholder={placeholder}
            rows={6}
            style={{
              flex: 1,
              padding: '14px 14px 14px 12px',
              background: 'transparent',
              border: 'none', outline: 'none',
              resize: 'none',
              fontFamily: 'var(--font-carbon)',
              fontSize: 16.5, lineHeight: 1.8,
              color: 'var(--ink)',
              minHeight: 140,
              caretColor: 'var(--red)',
            }}
          />
        ) : (
          <input
            ref={inputRef}
            value={value}
            onChange={e => setValue(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onKeyDown={handleKey}
            placeholder={placeholder}
            style={{
              flex: 1,
              padding: '14px 14px 14px 12px',
              background: 'transparent',
              border: 'none', outline: 'none',
              fontFamily: 'var(--font-carbon)',
              fontSize: 16.5, lineHeight: 1.8,
              color: 'var(--ink)',
              caretColor: 'var(--red)',
            }}
          />
        )}

        {/* Right actions */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '0 12px',
          flexDirection: expanded ? 'column' : 'row',
          paddingTop: expanded ? 12 : 0,
        }}>
          <input
            ref={fileRef}
            type="file" accept="image/*" multiple
            onChange={e => { handleFiles(e.target.files); e.target.value = ''; }}
            style={{ display: 'none' }}
          />
          <button
            onClick={() => fileRef.current && fileRef.current.click()}
            title="加图（最多 9 张）"
            disabled={images.length >= MAX}
            style={{
              appearance: 'none', border: 'none', background: 'transparent',
              color: images.length >= MAX ? 'var(--ink-ghost)' : 'var(--ink-faded)',
              cursor: images.length >= MAX ? 'default' : 'pointer',
              width: 28, height: 28, borderRadius: 4,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
            onMouseEnter={e => { if (images.length < MAX) e.currentTarget.style.color = 'var(--red)'; }}
            onMouseLeave={e => { if (images.length < MAX) e.currentTarget.style.color = 'var(--ink-faded)'; }}
          >
            <svg width="14" height="14" viewBox="0 0 15 15">
              <rect x="1.5" y="2.5" width="12" height="10" rx="0.5"
                    fill="none" stroke="currentColor" strokeWidth="1.1"/>
              <circle cx="5" cy="6" r="1.2" fill="currentColor"/>
              <path d="M1.5 11 L5.5 7.5 L9 9.5 L13.5 5.5"
                    fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round"/>
            </svg>
          </button>
          {onLongform && (
            <button
              onClick={() => onLongform(value)}
              title="写长篇"
              style={{
                appearance: 'none', border: 'none', background: 'transparent',
                color: 'var(--ink-faded)', cursor: 'pointer',
                width: 28, height: 28, borderRadius: 4,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--red)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--ink-faded)'}
            >
              <svg width="14" height="14" viewBox="0 0 14 14">
                <path d="M2 2 H 12 M2 5 H 10 M2 8 H 12 M2 11 H 8"
                  stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
              </svg>
            </button>
          )}
          <button
            onClick={() => setExpanded(x => !x)}
            title={expanded ? '收起' : '展开'}
            style={{
              appearance: 'none', border: 'none', background: 'transparent',
              color: 'var(--ink-faded)', cursor: 'pointer',
              width: 28, height: 28, borderRadius: 4,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--ink-soft)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--ink-faded)'}
          >
            <svg width="14" height="14" viewBox="0 0 14 14">
              {expanded ? (
                <path d="M3 8 L7 4 L11 8" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round"/>
              ) : (
                <path d="M3 5 L7 9 L11 5" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round"/>
              )}
            </svg>
          </button>
          <button
            onClick={submit}
            disabled={sending || (!value.trim() && images.length === 0)}
            style={{
              appearance: 'none', border: 'none',
              background: sending ? 'var(--ink-faded)' : (value.trim() || images.length) ? 'var(--red)' : 'transparent',
              color: (value.trim() || images.length) ? 'var(--bg-page)' : 'var(--ink-faded)',
              cursor: sending ? 'wait' : (value.trim() || images.length) ? 'pointer' : 'default',
              padding: '6px 14px', borderRadius: 3,
              fontSize: 13, fontFamily: 'var(--font-display)',
              letterSpacing: '0.1em',
              transition: 'all 0.2s',
              opacity: sending ? 0.6 : 1,
            }}
          >
            {sending ? '...' : expanded ? '写下' : '↵'}
          </button>
        </div>
      </div>

      {/* Image thumbnails row */}
      {images.length > 0 && (
        <div className="iw-imgs" style={{ padding: '4px 14px 8px 44px' }}>
          {images.map((src, i) => (
            <div key={i} className="iw-img-thumb">
              <img src={src} alt=""/>
              <button
                type="button"
                onClick={() => setImages(prev => prev.filter((_, j) => j !== i))}
                className="iw-img-x"
              >×</button>
            </div>
          ))}
          <span className="iw-img-count">{images.length}/{MAX}</span>
        </div>
      )}

      {/* hint row when expanded */}
      {expanded && (
        <div style={{
          padding: '8px 14px 12px 44px',
          fontSize: 11, color: 'var(--ink-faded)',
          fontFamily: 'var(--font-en)',
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', gap: 12,
          flexWrap: 'wrap',
        }}>
          <span>支持 **粗体** ・ *斜体* ・ 空行分段</span>
          {today && forDate !== today && (
            <button
              type="button"
              className="iw-date-pill"
              data-backdated="true"
              onClick={() => setShowDatePick(s => !s)}
              title="回写到过去某天"
              style={{ margin: 0 }}
            >
              回写到 <b>{forDate.slice(5).replace('-', '/')}</b>
            </button>
          )}
          {today && forDate === today && (
            <button
              type="button"
              onClick={() => setShowDatePick(s => !s)}
              title="回写到过去某天"
              style={{
                appearance: 'none', border: 'none', background: 'transparent',
                color: 'var(--ink-faded)', cursor: 'pointer',
                fontFamily: 'var(--font-display)', fontSize: 11,
                letterSpacing: '0.04em', padding: 0,
                borderBottom: '1px dashed var(--rule)',
              }}>
              选择日期
            </button>
          )}
          {showDatePick && today && (
            <div className="iw-date-pop" style={{ marginLeft: 0 }}>
              <input
                type="date"
                value={forDate}
                max={today}
                onChange={e => setForDate(e.target.value || today)}
                className="iw-date-input"
              />
              <button onClick={() => { setForDate(today); setShowDatePick(false); }}>今天</button>
              <button onClick={() => setShowDatePick(false)}>好</button>
            </div>
          )}
          {onLongform && (
            <button
              onClick={() => onLongform(value)}
              style={{
                appearance: 'none', border: 'none', background: 'transparent',
                color: 'var(--red)', cursor: 'pointer',
                fontFamily: 'var(--font-display)', fontSize: 12,
                letterSpacing: '0.06em', padding: 0,
                borderBottom: '1px dashed var(--red-soft)',
              }}>
              ✎ 进入长篇模式
            </button>
          )}
          <span>{MOD} + Enter 写下</span>
        </div>
      )}
    </div>
  );
}

export { InputBar };
