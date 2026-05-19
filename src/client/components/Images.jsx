import React from 'react';
import ReactDOM from 'react-dom';

/* ─── Images grid (inside an entry) ────────────────────────────────── */

function ImagesGrid({ images, align = 'left' }) {
  const [openIdx, setOpenIdx] = React.useState(null);
  const n = images.length;
  let cols;
  if (n === 1) cols = 1;
  else if (n === 2 || n === 4) cols = 2;
  else cols = 3;

  return (
    <>
      <div
        className="img-grid"
        data-n={n}
        style={{
          marginTop: 16,
          display: 'grid',
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gap: 4,
          justifyContent: align === 'right' ? 'flex-end' : 'flex-start',
        }}
      >
        {images.slice(0, 9).map((src, i) => (
          <button
            key={i}
            className="img-tile"
            onClick={() => setOpenIdx(i)}
            style={{
              appearance: 'none', border: 'none', padding: 0,
              cursor: 'zoom-in',
              background: 'transparent',
              aspectRatio: n === 1 ? '4 / 3' : '1 / 1',
              overflow: 'hidden',
              borderRadius: 2,
              position: 'relative',
            }}
          >
            <img src={src} alt={`图 ${i + 1}`} style={{
              width: '100%', height: '100%', objectFit: 'cover',
              display: 'block',
              filter: 'contrast(0.96) saturate(0.95)',
            }}/>
          </button>
        ))}
      </div>
      {openIdx !== null && (
        <ImageLightbox
          images={images}
          startIdx={openIdx}
          onClose={() => setOpenIdx(null)}
        />
      )}
    </>
  );
}

function ImageLightbox({ images, startIdx, onClose }) {
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

  return ReactDOM.createPortal(
    <div className="img-lightbox" onClick={onClose}>
      <button className="img-lightbox-close" onClick={onClose}>×</button>
      <button
        className="img-lightbox-nav img-lightbox-nav-l"
        onClick={(e) => { e.stopPropagation(); setIdx(i => Math.max(0, i - 1)); }}
        disabled={idx === 0}
      >‹</button>
      <img
        src={images[idx]}
        alt=""
        className="img-lightbox-img"
        onClick={e => e.stopPropagation()}
      />
      <button
        className="img-lightbox-nav img-lightbox-nav-r"
        onClick={(e) => { e.stopPropagation(); setIdx(i => Math.min(images.length - 1, i + 1)); }}
        disabled={idx === images.length - 1}
      >›</button>
      <div className="img-lightbox-pager">{idx + 1} / {images.length}</div>
    </div>,
    document.body
  );
}

export { ImagesGrid, ImageLightbox };
