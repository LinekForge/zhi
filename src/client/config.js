const AUTHORS = {
  carbon: { id: 'carbon', name: '你' },
  silicon: { id: 'silicon', name: 'AI' },
};

const CARBON = 'carbon';
const SILICON = 'silicon';

function authorName(id) {
  try { const v = localStorage.getItem(`zhi:name:${id}`); if (v) return v; } catch {}
  return AUTHORS[id]?.name ?? id;
}
function authorShort(id) {
  const name = authorName(id);
  return name.slice(0, 2);
}
function setAuthorName(id, name) {
  try { localStorage.setItem(`zhi:name:${id}`, name); } catch {}
}
function isCarbon(author) { return author === CARBON; }
function isSilicon(author) { return author === SILICON; }

function getMode() {
  try { return localStorage.getItem('zhi:mode') || 'duo'; } catch { return 'duo'; }
}
function setMode(mode) {
  try { localStorage.setItem('zhi:mode', mode); } catch {}
}
function isSoloMode() { return getMode() === 'solo'; }
function getAvatar(id) {
  try { return localStorage.getItem(`zhi:avatar:${id}`) || null; } catch { return null; }
}
function setAvatar(id, dataUrl) {
  try { localStorage.setItem(`zhi:avatar:${id}`, dataUrl); } catch {}
}
function clearAvatar(id) {
  try { localStorage.removeItem(`zhi:avatar:${id}`); } catch {}
}

const DEFAULT_MILESTONES = { 10: '十天', 50: '五十天', 100: '一百天', 200: '两百天', 365: '一周年', 730: '两周年', 1000: '一千天' };
const DEFAULT_BADGE_LABEL = 'Day';
const DEFAULT_DAY_FORMAT = (n) => `第 ${n} 天`;

function getMilestones() {
  try { const v = localStorage.getItem('zhi:milestones'); if (v) return JSON.parse(v); } catch {}
  return DEFAULT_MILESTONES;
}
function setMilestones(obj) {
  try { localStorage.setItem('zhi:milestones', JSON.stringify(obj)); } catch {}
}
function getBadgeLabel() {
  try { return localStorage.getItem('zhi:badge-label') || DEFAULT_BADGE_LABEL; } catch { return DEFAULT_BADGE_LABEL; }
}
function setBadgeLabel(label) {
  try { localStorage.setItem('zhi:badge-label', label); } catch {}
}
function formatDay(n) {
  try {
    const v = localStorage.getItem('zhi:day-format');
    if (v && v.includes('{n}')) return v.replace('{n}', n);
  } catch {}
  return DEFAULT_DAY_FORMAT(n);
}
function setDayFormat(template) {
  try { localStorage.setItem('zhi:day-format', template); } catch {}
}

const MOD = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.userAgent) ? '⌘' : 'Ctrl';

export { CARBON, SILICON, authorName, authorShort, setAuthorName, isCarbon, isSilicon, getMode, setMode, isSoloMode, getAvatar, setAvatar, clearAvatar, getMilestones, setMilestones, getBadgeLabel, setBadgeLabel, formatDay, setDayFormat, MOD };
