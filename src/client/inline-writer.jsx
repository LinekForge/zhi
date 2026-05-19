import React from 'react';
import ReactDOM from 'react-dom';
import { Avatar } from './components.jsx';
import { authorName, CARBON, MOD } from './config.js';

// inline-writer.jsx — slide-down quick-write bar anchored under the top nav.
// Press ✎ from any page, write, Enter to send, Esc to dismiss.
// Doesn't navigate; entry is silently added to today's timeline.
// Supports up to 9 image attachments.

const IW_MAX_IMAGES = 9;

function InlineWriter({ open, onClose, onSend, onLongform, today }) {
  const taRef = React.useRef(null);
  const fileRef = React.useRef(null);
  const [value, setValue] = React.useState('');
  const [images, setImages] = React.useState([]);
  const [sent, setSent] = React.useState(false);
  const [forDate, setForDate] = React.useState(today); // YYYY-MM-DD this entry is "for"
  const [showDatePick, setShowDatePick] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    setSent(false);
    setValue('');
    setImages([]);
    setForDate(today);
    setShowDatePick(false);
    setTimeout(() => taRef.current && taRef.current.focus(), 80);

    function onKey(e) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose, today]);

  async function submit() {
    const v = value.trim();
    if (!v && images.length === 0) return;
    // Pass extras: images + writtenAt if backdated
    const extras = {};
    if (images.length) extras.images = images;
    if (forDate !== today) extras.forDate = forDate;
    const ok = await onSend(v, extras);
    if (!ok) return;           // POST failed — keep writer open, content intact
    setValue('');
    setImages([]);
    setSent(true);
    setTimeout(() => onClose(), 900);
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey && !e.metaKey && !e.ctrlKey) {
      e.preventDefault();
      submit();
    }
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      submit();
    }
  }

  function handleFiles(files) {
    const arr = Array.from(files).slice(0, IW_MAX_IMAGES - images.length);
    const reads = arr.map(f => new Promise(res => {
      const fr = new FileReader();
      fr.onload = () => res(fr.result);
      fr.readAsDataURL(f);
    }));
    Promise.all(reads).then(urls => {
      setImages(prev => [...prev, ...urls].slice(0, IW_MAX_IMAGES));
    });
  }

  function removeImage(i) {
    setImages(prev => prev.filter((_, j) => j !== i));
  }

  function gotoLongform() {
    onClose();
    onLongform();
  }

  if (!open) return null;

  return ReactDOM.createPortal(
    <div className="iw-backdrop" onClick={onClose}>
      <div className="iw-shell" onClick={e => e.stopPropagation()}>
        <div className="iw-row">
          <div className="iw-meta">
            <Avatar author={CARBON} size={24}/>
            <span className="iw-label">{authorName(CARBON)} · 写一条</span>
            <button
              type="button"
              className="iw-date-pill"
              data-backdated={forDate !== today}
              onClick={() => setShowDatePick(s => !s)}
              title="回写到过去某天"
            >
              {forDate === today ? (
                <>写于 <b>今天</b></>
              ) : (
                <>回写到 <b>{forDate.slice(5).replace('-', '/')}</b> <span style={{ opacity: 0.55 }}>← 5/15</span></>
              )}
            </button>
            {showDatePick && (
              <div className="iw-date-pop">
                <input
                  type="date"
                  value={forDate}
                  max={today}
                  min={'2025-01-01'}
                  onChange={e => { setForDate(e.target.value || today); }}
                  className="iw-date-input"
                />
                <button onClick={() => { setForDate(today); setShowDatePick(false); }}>今天</button>
                <button onClick={() => setShowDatePick(false)}>好</button>
              </div>
            )}
            <span className="iw-hint">Esc 关闭 · {MOD}K 进长篇</span>
          </div>

          {/* Attached image thumbnails */}
          {images.length > 0 && !sent && (
            <div className="iw-imgs">
              {images.map((src, i) => (
                <div key={i} className="iw-img-thumb">
                  <img src={src} alt=""/>
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    title="移除"
                    className="iw-img-x"
                  >×</button>
                </div>
              ))}
              {images.length < IW_MAX_IMAGES && (
                <button
                  type="button"
                  className="iw-img-add"
                  onClick={() => fileRef.current && fileRef.current.click()}
                  title="再加几张"
                >+</button>
              )}
              <span className="iw-img-count">{images.length}/{IW_MAX_IMAGES}</span>
            </div>
          )}

          <div className="iw-input-wrap" data-sent={sent}>
            {sent ? (
              <div className="iw-sent-state">
                <span style={{ color: 'var(--red)' }}>✓</span> 已写下 · 今日多了一条
              </div>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 16 16" style={{
                  color: 'var(--red)', flexShrink: 0, marginTop: 6,
                }}>
                  <path d="M2 14 L4 12 L11 5 L13 7 L6 14 L2 14 Z" fill="currentColor" opacity="0.7"/>
                  <path d="M11 5 L12 4 L14 6 L13 7 Z" fill="currentColor"/>
                </svg>
                <textarea
                  ref={taRef}
                  value={value}
                  onChange={e => setValue(e.target.value)}
                  onKeyDown={handleKey}
                  placeholder="今天想说点什么…"
                  rows={1}
                  className="iw-textarea"
                />
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={e => { handleFiles(e.target.files); e.target.value = ''; }}
                  style={{ display: 'none' }}
                />
                <button
                  className="iw-icon-btn"
                  onClick={() => fileRef.current && fileRef.current.click()}
                  title={`加图（最多 ${IW_MAX_IMAGES} 张）`}
                  disabled={images.length >= IW_MAX_IMAGES}
                >
                  <svg width="15" height="15" viewBox="0 0 15 15">
                    <rect x="1.5" y="2.5" width="12" height="10" rx="0.5"
                          fill="none" stroke="currentColor" strokeWidth="1.1"/>
                    <circle cx="5" cy="6" r="1.2" fill="currentColor"/>
                    <path d="M1.5 11 L5.5 7.5 L9 9.5 L13.5 5.5"
                          fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round"/>
                  </svg>
                </button>
                <button
                  className="iw-icon-btn"
                  onClick={gotoLongform}
                  title={`长篇 (${MOD}K)`}
                >
                  <svg width="14" height="14" viewBox="0 0 14 14">
                    <path d="M2 2 H 12 M2 5 H 10 M2 8 H 12 M2 11 H 8"
                          stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                  </svg>
                </button>
                <button
                  className="iw-send"
                  onClick={submit}
                  disabled={!value.trim() && images.length === 0}
                  data-disabled={!value.trim() && images.length === 0}
                >
                  写下
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

export { InlineWriter };
