import React from 'react';
import { dateParts } from './utils.jsx';
import { authorName, isSilicon, CARBON } from '../config.js';

/* ─── Annotation list (time footnotes) ─────────────────────────────── */

function AnnotationList({ annotations, align = 'left' }) {
  return (
    <div className="anno-list" data-align={align}>
      {annotations.map((a, i) => (
        <Annotation key={i} anno={a}/>
      ))}
    </div>
  );
}

function AnnotationsSection({ entry, annotations, onAdd, align = 'left' }) {
  const [composing, setComposing] = React.useState(false);
  const [text, setText] = React.useState('');
  const taRef = React.useRef(null);

  React.useEffect(() => {
    if (!composing) return;
    const id = setTimeout(() => taRef.current?.focus(), 60);
    return () => clearTimeout(id);
  }, [composing]);

  function submit() {
    const v = text.trim();
    if (!v || !onAdd) return;
    onAdd(entry, v);
    setText('');
    setComposing(false);
  }

  const has = annotations && annotations.length > 0;
  if (!has && !onAdd) return null;

  return (
    <div className="anno-list" data-align={align}>
      {has && annotations.map((a, i) => <Annotation key={i} anno={a}/>)}

      {onAdd && !composing && (
        <button className="anno-add-btn" onClick={() => setComposing(true)}>
          <svg width="11" height="11" viewBox="0 0 11 11" style={{ marginRight: 4 }}>
            <path d="M5.5 1 V 10 M1 5.5 H 10"
                  stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
          加批注
        </button>
      )}

      {composing && (
        <div className="anno-composer">
          <textarea
            ref={taRef}
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="写一句批注 / 给这一天留个注脚…"
            rows={2}
          />
          <div className="anno-composer-foot">
            <span className="anno-composer-hint">
              将作为「{authorName(CARBON)} · 今日的批注」写下
            </span>
            <div style={{ display: 'flex', gap: 6 }}>
              <button className="anno-cancel" onClick={() => { setComposing(false); setText(''); }}>
                取消
              </button>
              <button className="anno-submit" onClick={submit} disabled={!text.trim()} data-disabled={!text.trim()}>
                写下
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Annotation({ anno }) {
  const { y, m, d } = dateParts(anno.date);
  const isSi = isSilicon(anno.author);
  return (
    <div className="anno-item">
      <div className="anno-marker">
        <svg width="12" height="14" viewBox="0 0 12 14">
          <path d="M6 0 V 14 M2 4 H 10 M2 8 H 10"
                stroke="var(--rule)" strokeWidth="0.8" fill="none"/>
          <circle cx="6" cy="11" r="1.3" fill="var(--red)" opacity="0.6"/>
        </svg>
      </div>
      <div className="anno-body">
        <div className="anno-meta">
          <span style={{ color: isSi ? 'var(--silicon)' : 'var(--carbon)' }}>
            {authorName(anno.author)}
          </span>
          <span style={{ color: 'var(--ink-faded)' }}>
            · {y}年{m}月{d}日的批注
          </span>
        </div>
        <div className="anno-content">{anno.content}</div>
      </div>
    </div>
  );
}

export { AnnotationsSection, AnnotationList, Annotation };
