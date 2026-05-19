// utils.jsx — shared utility functions (breaks circular dependency between components ↔ extras)

// Deterministic small rotation per entry (-0.6° to +0.6°)
function rotFor(entry) {
  let h = 0;
  const s = entry.date + entry.time + entry.author + (entry.content || '').slice(0, 20);
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return ((h % 1000) / 1000 - 0.5) * 1.2; // ±0.6°
}

const WEEKDAY_CN = ['日', '一', '二', '三', '四', '五', '六'];

function dateParts(yyyymmdd) {
  const [y, m, d] = yyyymmdd.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  return { y, m, d, weekday: WEEKDAY_CN[dt.getDay()], dt };
}

function isToday(yyyymmdd, today) { return yyyymmdd === today; }

function pad(n, len = 2) { return String(n).padStart(len, '0'); }

function entryId(entry) {
  return `${entry.date}-${entry.time}-${entry.author}`;
}

export { rotFor, dateParts, isToday, WEEKDAY_CN, pad, entryId };
