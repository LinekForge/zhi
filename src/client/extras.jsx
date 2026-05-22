import React from 'react';
import ReactDOM from 'react-dom';
import { toPng } from 'html-to-image';
import { dateParts, entryId } from './utils.jsx';
import { authorName, authorShort, isSilicon } from './config.js';

// extras.jsx — favorites, hover actions, export-to-image modal, floating compose

/* ─── Favorites hook ───────────────────────────────────────────────── */

const FAV_KEY = 'zhi:favorites';

function useFavorites() {
  const [favs, setFavs] = React.useState(() => {
    try {
      const raw = localStorage.getItem(FAV_KEY);
      return new Set(raw ? JSON.parse(raw) : []);
    } catch { return new Set(); }
  });

  function toggle(stringId, dbId) {
    const adding = !favs.has(stringId);
    setFavs(prev => {
      const next = new Set(prev);
      if (next.has(stringId)) next.delete(stringId);
      else next.add(stringId);
      try { localStorage.setItem(FAV_KEY, JSON.stringify([...next])); } catch {}
      return next;
    });
    if (dbId) {
      fetch(`/api/entries/${dbId}/favorite`, {
        method: adding ? 'POST' : 'DELETE',
      })
        .then(r => { if (!r.ok) throw new Error(r.status); })
        .catch(err => {
          console.error('收藏失败:', err);
          setFavs(prev => {
            const rollback = new Set(prev);
            if (adding) rollback.delete(stringId);
            else rollback.add(stringId);
            try { localStorage.setItem(FAV_KEY, JSON.stringify([...rollback])); } catch {}
            return rollback;
          });
        });
    }
  }

  return [favs, toggle];
}

/* ─── Hover actions on an entry ─────────────────────────────────────── */

function EntryActions({ entry, isFav, onToggleFav, onExport, onToggleHidden, onStartEdit }) {
  return (
    <div
      className="entry-actions"
      onClick={e => e.stopPropagation()}
    >
      <button
        onClick={() => onToggleFav(entryId(entry), entry.id)}
        title={isFav ? '取消收藏' : '收藏'}
        className="entry-action-btn"
        data-active={isFav}
      >
        <svg width="13" height="13" viewBox="0 0 14 14">
          <path d="M7 1.6 L8.8 5.3 L12.8 5.9 L9.9 8.7 L10.6 12.6 L7 10.8 L3.4 12.6 L4.1 8.7 L1.2 5.9 L5.2 5.3 Z"
            fill={isFav ? 'currentColor' : 'none'}
            stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round"/>
        </svg>
      </button>
      {onStartEdit && (
        <button onClick={onStartEdit} title="编辑（保留历史）" className="entry-action-btn">
          <svg width="13" height="13" viewBox="0 0 14 14">
            <path d="M2 12 L3.6 10.4 L9.6 4.4 L11.6 6.4 L5.6 12.4 L2 12.4 Z"
                  fill="currentColor" opacity="0.85"/>
            <path d="M9.6 4.4 L10.6 3.4 L12 4.8 L11.6 6.4 Z" fill="currentColor"/>
          </svg>
        </button>
      )}
      {onToggleHidden && (
        <button onClick={() => { if (confirm(entry.hidden ? '恢复这条日记？' : '隐藏这条日记？可以在设置中恢复。')) onToggleHidden(entry); }} title={entry.hidden ? '恢复' : '隐藏（可恢复）'} className="entry-action-btn">
          <svg width="13" height="13" viewBox="0 0 14 14">
            <path d="M1 7 Q 7 2 13 7 Q 7 12 1 7 Z" stroke="currentColor" strokeWidth="1.1" fill="none"/>
            <circle cx="7" cy="7" r="1.6" fill="currentColor"/>
          </svg>
        </button>
      )}
      <button
        onClick={() => onExport(entry)}
        title="生成分享图"
        className="entry-action-btn"
      >
        <svg width="13" height="13" viewBox="0 0 14 14">
          <rect x="1.5" y="2.5" width="11" height="9" rx="0.5"
                fill="none" stroke="currentColor" strokeWidth="1.1"/>
          <circle cx="4.5" cy="5.5" r="0.9" fill="currentColor"/>
          <path d="M1.5 10 L5 7 L8 9 L12.5 5.5"
                fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round"/>
        </svg>
      </button>
    </div>
  );
}

/* ─── Export modal — styled shareable card with PNG download ───────── */

function ExportModal({ entry, onClose }) {
  const cardRef = React.useRef(null);
  const [downloading, setDownloading] = React.useState(false);
  const [theme, setTheme] = React.useState('cream'); // cream | night
  const [width, setWidth] = React.useState('std'); // narrow | std | wide
  const [editableContent, setEditableContent] = React.useState(entry ? entry.content : '');

  React.useEffect(() => {
    if (entry) setEditableContent(entry.content);
  }, [entry && entry.date + entry.time + entry.author]);

  React.useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose(); }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (!entry) return null;

  const isSi = isSilicon(entry.author);

  // Width presets — height is auto, content always preserved
  const widths = {
    narrow: { w: 800, label: '窄' },
    std:    { w: 1080, label: '中 · 适合社交' },
    wide:   { w: 1200, label: '宽 · 适合屏幕' },
  };
  const sz = widths[width];
  const previewScale = Math.min(1, 480 / sz.w);

  // Color presets for the export card
  const themes = {
    cream: {
      bg: '#F2E9D2', page: '#FAF5E5', ink: '#2C2620', soft: '#6D6557',
      faded: '#A89E8B', red: '#B73E33', carbon: '#7A4F2F', silicon: '#3D5670',
      rule: '#D8C9A8',
    },
    night: {
      bg: '#14110D', page: '#1E1812', ink: '#B8AE96', soft: '#837A68',
      faded: '#5C5448', red: '#B5705F', carbon: '#B08864', silicon: '#889AB0',
      rule: '#2F2A22',
    },
  };
  const c = themes[theme];

  async function download() {
    setDownloading(true);
    try {
      const node = cardRef.current;
      // Measure actual content size
      const actualH = node.scrollHeight;
      const dataUrl = await toPng(node, {
        width: sz.w,
        height: actualH,
        pixelRatio: 2,
        cacheBust: true,
        backgroundColor: c.bg,
      });
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `织·${entry.date}·${authorName(entry.author)}.png`;
      a.click();
    } catch (err) {
      console.error(err);
      alert('生成失败：' + (err && err.message ? err.message : '请右键 → 另存为图像'));
    } finally {
      setDownloading(false);
    }
  }

  function reset() {
    setEditableContent(entry.content);
  }

  const edited = editableContent !== entry.content;

  return ReactDOM.createPortal(
    <div className="exp-shell" onClick={onClose}>
      <div className="exp-body" onClick={e => e.stopPropagation()}>

        <header className="exp-head">
          <div className="exp-head-title">
            <span className="kicker">生成 · 分享图</span>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, color: 'var(--ink)' }}>
              {entry.date} · {authorName(entry.author)}
            </div>
          </div>
          <button className="lf-icon-btn" onClick={onClose} title="关闭 (Esc)">
            <svg width="18" height="18" viewBox="0 0 18 18">
              <path d="M4 4 L14 14 M14 4 L4 14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
          </button>
        </header>

        <div className="exp-controls">
          <div className="exp-control-group">
            <span className="exp-control-label">宽度</span>
            {Object.entries(widths).map(([k, v]) => (
              <button key={k}
                className="exp-pill"
                data-active={width === k}
                onClick={() => setWidth(k)}>{v.label}</button>
            ))}
          </div>
          <div className="exp-control-group">
            <span className="exp-control-label">底色</span>
            <button className="exp-pill" data-active={theme === 'cream'} onClick={() => setTheme('cream')}>纸·米</button>
            <button className="exp-pill" data-active={theme === 'night'} onClick={() => setTheme('night')}>夜·墨</button>
          </div>
          {edited && (
            <button className="exp-pill" onClick={reset} style={{ color: 'var(--red)', borderColor: 'var(--red-soft)' }}>
              ↺ 重置
            </button>
          )}
          <button className="exp-download" onClick={download} disabled={downloading}>
            {downloading ? '生成中…' : '↓ 下载 PNG'}
          </button>
        </div>

        <div style={{
          padding: '8px 24px 0',
          fontFamily: 'var(--font-display)', fontSize: 12,
          color: 'var(--ink-faded)', letterSpacing: '0.04em',
        }}>
          预览区文字可<b style={{ color: 'var(--ink-soft)' }}>直接编辑或删除</b>，导出时保留你最终看到的样子。
        </div>

        {/* Preview frame — auto-height via CSS zoom for preview only.
            html-to-image captures the unscaled cardRef at full resolution. */}
        <div className="exp-preview-frame">
          <div className="exp-card-scaler" style={{ zoom: previewScale }}>
            <ShareCard
              ref={cardRef}
              entry={entry}
              content={editableContent}
              onContentChange={setEditableContent}
              isSi={isSi}
              colors={c}
              width={sz.w}
            />
          </div>
        </div>

        <footer className="exp-foot">
          一张图，一句话。可以右键直接保存，也可以下载 PNG。
        </footer>
      </div>
    </div>,
    document.body
  );
}

/* ─── ShareCard — auto-height, editable content, full preservation */

const ShareCard = React.forwardRef(function ShareCard({ entry, content, onContentChange, isSi, colors: c, width }, ref) {
  const { y, m, d, weekday } = dateParts(entry.date);
  const pad = width * 0.08;
  const editRef = React.useRef(null);

  function handleInput(e) {
    onContentChange(e.currentTarget.innerText);
  }

  // Reset editable content when content prop changes externally (e.g. reset button)
  React.useEffect(() => {
    if (editRef.current && editRef.current.innerText !== content) {
      editRef.current.innerText = content;
    }
  }, [content]);

  return (
    <div ref={ref} style={{
      width,
      background: c.bg,
      position: 'relative',
      overflow: 'hidden',
      fontFamily: 'var(--font-body)',
      color: c.ink,
      padding: pad,
      boxSizing: 'border-box',
    }}>
      {/* Top: 织 brand + date */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        marginBottom: 36,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <svg width="44" height="44" viewBox="0 0 32 32">
            <path d="M4 8 C 12 8, 12 24, 20 24 L 28 24"
                  stroke={c.carbon} strokeWidth="1.8" fill="none" strokeLinecap="round"/>
            <path d="M4 24 C 12 24, 12 8, 20 8 L 28 8"
                  stroke={c.silicon} strokeWidth="1.8" fill="none" strokeLinecap="round"/>
            <circle cx="16" cy="16" r="2" fill={c.red}/>
          </svg>
          <span style={{
            fontFamily: 'var(--font-display)', fontSize: 32, color: c.ink,
            letterSpacing: '0.06em',
          }}>织</span>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, color: c.ink, lineHeight: 1.2 }}>
            {m}月{d}日 <span style={{ fontSize: 18, color: c.soft }}>· 周{weekday}</span>
          </div>
          <div style={{
            fontFamily: 'var(--font-en)', fontSize: 14, color: c.faded,
            letterSpacing: '0.2em', textTransform: 'uppercase', marginTop: 4,
          }}>{y}</div>
        </div>
      </div>

      {/* Big quote mark */}
      <div style={{
        fontFamily: 'var(--font-display)',
        fontSize: 120, color: c.red, opacity: 0.4,
        lineHeight: 0.5, marginBottom: 24, fontStyle: 'italic',
      }}>"</div>

      {/* The text — editable */}
      <div
        ref={editRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        spellCheck={false}
        style={{
          fontSize: width * 0.035,
          lineHeight: 1.85,
          color: c.ink,
          outline: 'none',
          whiteSpace: 'pre-wrap',
          minHeight: '1.5em',
          caretColor: c.red,
        }}
      >{content}</div>

      {/* Footer: author */}
      <div style={{
        marginTop: 36, paddingTop: 24,
        borderTop: `1px dashed ${c.rule}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 44, height: 44, borderRadius: '50%',
            background: isSi ? 'transparent' : c.carbon,
            border: isSi ? `1.4px dashed ${c.silicon}` : 'none',
            color: isSi ? c.silicon : c.bg,
            fontFamily: 'var(--font-display)', fontSize: 22,
          }}>{authorShort(entry.author)}</span>
          <span style={{
            fontFamily: 'var(--font-display)', fontSize: 22,
            color: isSi ? c.silicon : c.carbon,
            letterSpacing: '0.02em',
          }}>
            {authorName(entry.author)} · <span style={{ color: c.faded, fontFamily: 'var(--font-en)', fontSize: 16, letterSpacing: '0.04em' }}>{entry.time}</span>
          </span>
        </div>
        <div style={{
          fontFamily: 'var(--font-en)', fontSize: 13, color: c.faded,
          letterSpacing: '0.2em', textTransform: 'uppercase',
        }}>
          织 · a shared journal
        </div>
      </div>
    </div>
  );
});

/* ─── Floating compose button (FAB) ─────────────────────────────────── */

function FloatingCompose({ onClick, hint = '写' }) {
  return (
    <button
      onClick={onClick}
      className="fab-compose"
      title={`${hint} (W)`}
    >
      <svg width="20" height="20" viewBox="0 0 20 20">
        <path d="M2 18 L4 14 L13 5 L17 9 L8 18 L2 18 Z"
              fill="currentColor" opacity="0.85"/>
        <path d="M13 5 L15 3 L17 5 L15 7 Z" fill="currentColor"/>
      </svg>
    </button>
  );
}

export { useFavorites, EntryActions, ExportModal, ShareCard, FloatingCompose };
