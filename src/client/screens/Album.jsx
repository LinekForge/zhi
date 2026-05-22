import React from 'react';
import ReactDOM from 'react-dom';
import { dateParts } from '../components.jsx';
import { Page, LensBanner } from './shared.jsx';
import { authorName } from '../config.js';

/* ─── Album screen — all images, grouped by month ───────────────────── */

function AlbumScreen({ data, lens, onPickDate }) {
  const allImages = data.allImages;
  const filtered = lens === 'both' || !lens
    ? allImages
    : allImages.filter(img => img.author === lens);

  // Group by year-month
  const byMonth = {};
  for (const img of filtered) {
    const key = img.date.slice(0, 7);
    (byMonth[key] = byMonth[key] || []).push(img);
  }
  const months = Object.keys(byMonth).sort().reverse();

  const [lightboxIdx, setLightboxIdx] = React.useState(null);
  React.useEffect(() => { setLightboxIdx(null); }, [lens]);

  return (
    <Page>
      <header style={{ marginBottom: 28 }}>
        <div className="kicker" style={{ marginBottom: 6 }}>翻 · 相册</div>
        <div style={{
          fontFamily: 'var(--font-display)', fontSize: 38, fontWeight: 500,
          color: 'var(--ink)', letterSpacing: '-0.01em', lineHeight: 1,
          display: 'flex', alignItems: 'baseline', gap: 14,
        }}>
          相册
          <span style={{
            fontFamily: 'var(--font-hand)', fontSize: 17,
            color: 'var(--red)', transform: 'rotate(-2deg)',
            display: 'inline-block', fontWeight: 400,
          }}>· 日记里的所有图</span>
        </div>
        <div style={{
          marginTop: 16,
          fontFamily: 'var(--font-display)', fontSize: 13,
          color: 'var(--ink-soft)', letterSpacing: '0.04em',
        }}>
          共 <b style={{ color: 'var(--ink)', fontWeight: 600 }}>{filtered.length}</b> 张照片 ·
          覆盖 {months.length} 个月。点击看大图，再次点击跳到当天。
        </div>
      </header>

      <LensBanner lens={lens}/>

      {filtered.length === 0 ? (
        <div className="album-empty">
          这里还没有照片。<br/>
          <span style={{ fontSize: 13, color: 'var(--ink-ghost)' }}>
            下次写日记时随手插一张 📷
          </span>
        </div>
      ) : (
        months.map(key => {
          const imgs = byMonth[key];
          const [y, mm] = key.split('-');
          // Group by full date within this month
          const byDay = {};
          for (const img of imgs) {
            (byDay[img.date] = byDay[img.date] || []).push(img);
          }
          const days = Object.keys(byDay).sort().reverse();
          return (
            <section key={key}>
              <div className="album-month-head">
                <div className="album-month-title">{y}年 {parseInt(mm)}月</div>
                <div className="album-month-count">{imgs.length} 张</div>
              </div>
              {days.map(dateStr => {
                const dayImgs = byDay[dateStr];
                const { d, weekday } = dateParts(dateStr);
                return (
                  <div key={dateStr} className="album-day-block">
                    <div className="album-day-head">
                      <span className="album-day-num">{d}日</span>
                      <span className="album-day-weekday">周{weekday}</span>
                      <span className="album-day-count">{dayImgs.length} 张</span>
                    </div>
                    <div className="album-grid">
                      {dayImgs.map((img, i) => {
                        const globalIdx = filtered.indexOf(img);
                        return (
                          <button key={i} className="album-cell"
                            onClick={() => setLightboxIdx(globalIdx)}>
                            <img src={img.src} alt=""/>
                            <div className="album-cell-meta">
                              <span>{img.time} · {authorName(img.author)}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </section>
          );
        })
      )}

      {lightboxIdx !== null && (
        <AlbumLightbox
          images={filtered}
          startIdx={lightboxIdx}
          onClose={() => setLightboxIdx(null)}
          onJumpDay={(date) => { setLightboxIdx(null); onPickDate(date); }}
        />
      )}
    </Page>
  );
}

function AlbumLightbox({ images, startIdx, onClose, onJumpDay }) {
  const [idx, setIdx] = React.useState(startIdx);
  React.useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') setIdx(i => Math.max(0, i - 1));
      if (e.key === 'ArrowRight') setIdx(i => Math.min(images.length - 1, i + 1));
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [images.length, onClose]);

  const cur = images[idx];

  return ReactDOM.createPortal(
    <div className="img-lightbox" onClick={onClose}>
      <button className="img-lightbox-close" onClick={onClose}>×</button>
      <button
        className="img-lightbox-nav img-lightbox-nav-l"
        onClick={(e) => { e.stopPropagation(); setIdx(i => Math.max(0, i - 1)); }}
        disabled={idx === 0}
      >‹</button>
      <img
        src={cur.src}
        alt=""
        className="img-lightbox-img"
        onClick={e => e.stopPropagation()}
      />
      <button
        className="img-lightbox-nav img-lightbox-nav-r"
        onClick={(e) => { e.stopPropagation(); setIdx(i => Math.min(images.length - 1, i + 1)); }}
        disabled={idx === images.length - 1}
      >›</button>
      <div className="img-lightbox-pager" style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <span>{cur.date.slice(5).replace('-', '/')} · {authorName(cur.author)} · {cur.time}</span>
        <span style={{ opacity: 0.5 }}>·</span>
        <button onClick={(e) => { e.stopPropagation(); onJumpDay(cur.date); }}
          style={{
            appearance: 'none', border: 'none', background: 'transparent',
            color: 'rgba(255,255,255,0.85)', cursor: 'pointer',
            fontFamily: 'inherit', fontSize: 'inherit', padding: 0,
            textDecoration: 'underline', textDecorationStyle: 'dashed',
            textUnderlineOffset: 3,
          }}>跳到这一天 →</button>
        <span style={{ opacity: 0.5 }}>·</span>
        <span>{idx + 1} / {images.length}</span>
      </div>
    </div>,
    document.body
  );
}

export { AlbumScreen, AlbumLightbox };
