import React from 'react';

// Re-export shared utilities from the parent utils.jsx
export { rotFor, dateParts, isToday, WEEKDAY_CN, pad, entryId } from '../utils.jsx';

/* ─── Paper texture (SVG noise + grain) ────────────────────────────── */

function PaperTexture() {
  // Lightweight grain via SVG turbulence; we set it once on body and lean on CSS.
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
      <defs>
        <filter id="paper-noise">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="3" stitchTiles="stitch"/>
          <feColorMatrix values="0 0 0 0 0.18  0 0 0 0 0.14  0 0 0 0 0.09  0 0 0 0.07 0"/>
        </filter>
        <filter id="ink-bleed">
          <feGaussianBlur stdDeviation="0.4"/>
        </filter>
        <pattern id="paper-fiber" x="0" y="0" width="220" height="220" patternUnits="userSpaceOnUse">
          <rect width="220" height="220" filter="url(#paper-noise)" opacity="0.5"/>
        </pattern>
      </defs>
    </svg>
  );
}

export { PaperTexture };
