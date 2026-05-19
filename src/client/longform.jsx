import React from 'react';
import ReactDOM from 'react-dom';
import { dateParts, Avatar } from './components.jsx';
import { authorName, CARBON, MOD } from './config.js';

// longform.jsx — full-screen long-form writer for 织
// Distraction-free. Narrow column. Word count + autosave + Esc.
// Supports image attachments (≤9) + backdate ("回写于…").

const LONG_FORM_DRAFT_KEY = 'zhi:longform:draft';
const LONG_FORM_MAX_IMG = 9;

function LongformEditor({ open, onClose, onSend, today }) {
  const [value, setValue] = React.useState(() => {
    try {
      const d = JSON.parse(localStorage.getItem(LONG_FORM_DRAFT_KEY) || 'null');
      return (d && d.value) || '';
    } catch { return ''; }
  });
  const [images, setImages] = React.useState(() => {
    try {
      const d = JSON.parse(localStorage.getItem(LONG_FORM_DRAFT_KEY) || 'null');
      return (d && Array.isArray(d.images)) ? d.images : [];
    } catch { return []; }
  });
  const [forDate, setForDate] = React.useState(today);
  const [showDatePick, setShowDatePick] = React.useState(false);
  const [savedAt, setSavedAt] = React.useState(null);
  const taRef = React.useRef(null);
  const fileRef = React.useRef(null);

  React.useEffect(() => {
    if (!open) return;
    const id = setTimeout(() => {
      try {
        localStorage.setItem(LONG_FORM_DRAFT_KEY,
          JSON.stringify({ value, images }));
        setSavedAt(new Date());
      } catch {}
    }, 500);
    return () => clearTimeout(id);
  }, [value, images, open]);

  React.useEffect(() => {
    if (!open) return;
    setForDate(today);
    setTimeout(() => taRef.current && taRef.current.focus(), 200);
    function onKey(e) {
      if (e.key === 'Escape') {
        if (showDatePick) { setShowDatePick(false); return; }
        onClose();
      }
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submit();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line
  }, [open, value, images, showDatePick, forDate, today]);

  async function submit() {
    const v = value.trim();
    if (!v && images.length === 0) return;
    const extras = {};
    if (images.length) extras.images = images;
    if (forDate && forDate !== today) extras.forDate = forDate;
    const ok = await onSend(v, extras);
    if (!ok) return;           // POST failed — keep editor open, content intact
    setValue('');
    setImages([]);
    try { localStorage.removeItem(LONG_FORM_DRAFT_KEY); } catch {}
    onClose();
  }

  function discard() {
    if ((value || images.length) && !window.confirm('丢掉这一篇？')) return;
    setValue('');
    setImages([]);
    try { localStorage.removeItem(LONG_FORM_DRAFT_KEY); } catch {}
    onClose();
  }

  function handleFiles(files) {
    const arr = Array.from(files).slice(0, LONG_FORM_MAX_IMG - images.length);
    Promise.all(arr.map(f => new Promise(res => {
      const fr = new FileReader();
      fr.onload = () => res(fr.result);
      fr.readAsDataURL(f);
    }))).then(urls => setImages(prev => [...prev, ...urls].slice(0, LONG_FORM_MAX_IMG)));
  }

  function removeImage(i) {
    setImages(prev => prev.filter((_, j) => j !== i));
  }

  if (!open) return null;

  const charCount = value.replace(/\s/g, '').length;
  const { y, m, d, weekday } = dateParts(forDate);
  const isBackdated = forDate !== today;
  const readingMin = Math.max(1, Math.round(charCount / 300));

  return ReactDOM.createPortal(
    <div className="lf-shell">
      <header className="lf-head">
        <button onClick={discard} className="lf-icon-btn" title="关闭 (Esc)">
          <svg width="18" height="18" viewBox="0 0 18 18">
            <path d="M4 4 L14 14 M14 4 L4 14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
          </svg>
        </button>

        <div className="lf-head-center">
          <div className="lf-head-title">长篇 · {y}/{pad2(m)}/{pad2(d)}{isBackdated ? ' · 回写' : ''}</div>
          <div className="lf-head-saved">
            {savedAt ? `已保存 · ${pad2(savedAt.getHours())}:${pad2(savedAt.getMinutes())}:${pad2(savedAt.getSeconds())}` : '草稿自动保存'}
          </div>
        </div>

        <div className="lf-head-actions">
          <input
            ref={fileRef} type="file" accept="image/*" multiple
            onChange={e => { handleFiles(e.target.files); e.target.value = ''; }}
            style={{ display: 'none' }}
          />
          <button
            onClick={() => fileRef.current && fileRef.current.click()}
            disabled={images.length >= LONG_FORM_MAX_IMG}
            className="lf-icon-btn"
            title={`加图（最多 ${LONG_FORM_MAX_IMG} 张）`}
          >
            <svg width="16" height="16" viewBox="0 0 15 15">
              <rect x="1.5" y="2.5" width="12" height="10" rx="0.5"
                    fill="none" stroke="currentColor" strokeWidth="1.1"/>
              <circle cx="5" cy="6" r="1.2" fill="currentColor"/>
              <path d="M1.5 11 L5.5 7.5 L9 9.5 L13.5 5.5"
                    fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round"/>
            </svg>
          </button>
          <button
            onClick={submit}
            disabled={!value.trim() && images.length === 0}
            className="lf-send-btn"
            data-disabled={!value.trim() && images.length === 0}
          >
            写下
          </button>
        </div>
      </header>

      <div className="lf-paper-wrap">
        <div className="lf-paper">
          <div className="lf-sub-bar">
            <div className="lf-author">
              <Avatar author={CARBON} size={28}/>
              <div>
                <div className="lf-author-name">{authorName(CARBON)}</div>
                <div className="lf-author-meta">{m}月{d}日 · 周{weekday}{isBackdated ? ' · 回写' : ''}</div>
              </div>
            </div>
            <button
              type="button"
              className="iw-date-pill"
              data-backdated={isBackdated}
              onClick={() => setShowDatePick(s => !s)}
              title="回写到过去某天"
            >
              {isBackdated
                ? <>回写到 <b>{forDate.slice(5).replace('-', '/')}</b></>
                : <>写于 <b>今天</b></>}
            </button>
            {showDatePick && (
              <div className="iw-date-pop">
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
          </div>

          <textarea
            ref={taRef}
            value={value}
            onChange={e => setValue(e.target.value)}
            placeholder="今天想慢慢说点什么…"
            className="lf-textarea"
          />

          {images.length > 0 && (
            <div className="lf-imgs">
              {images.map((src, i) => (
                <div key={i} className="lf-img-thumb">
                  <img src={src} alt=""/>
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    title="移除"
                    className="iw-img-x"
                  >×</button>
                </div>
              ))}
              <span className="iw-img-count">{images.length}/{LONG_FORM_MAX_IMG}</span>
            </div>
          )}

          <div className="lf-foot">
            <span><b>{charCount}</b> 字</span>
            <span className="lf-foot-dim">· 约 {readingMin} 分钟阅读</span>
            <span style={{ marginLeft: 'auto' }} className="lf-foot-dim">
              {MOD} + Enter 写下 · Esc 关闭
            </span>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

function pad2(n) { return n < 10 ? '0' + n : '' + n; }

export { LongformEditor };
