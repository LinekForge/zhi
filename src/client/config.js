const CARBON = 'carbon';
const SILICON = 'silicon';

let _config = null;
let _persistTimer = null;

function _ls(key) { try { return localStorage.getItem(key); } catch { return null; } }
function _lsSet(key, v) { try { localStorage.setItem(key, v); } catch {} }
function _lsRm(key) { try { localStorage.removeItem(key); } catch {} }

function _defaults() {
  return {
    names: { carbon: '碳基', silicon: '硅基' },
    mode: 'duo',
    badge: 'Day',
    dayFormat: '',
    milestones: { 10: '十天', 50: '五十天', 100: '一百天', 200: '两百天', 365: '一周年', 730: '两周年', 1000: '一千天' },
  };
}

function _cached() {
  try { const v = _ls('zhi:config'); if (v) return JSON.parse(v); } catch {}
  return null;
}

function _get() {
  if (_config) return _config;
  _config = _cached() || _defaults();
  return _config;
}

function _persist(patch) {
  const prev = _get();
  _config = { ...prev, ...patch };
  if (patch.names) _config.names = { ...prev.names, ...patch.names };
  if (patch.milestones !== undefined) _config.milestones = patch.milestones;
  _lsSet('zhi:config', JSON.stringify(_config));
  clearTimeout(_persistTimer);
  _persistTimer = setTimeout(() => {
    fetch('/api/config', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(_config) }).catch(() => {});
  }, 400);
}

async function syncConfig() {
  if (_persistTimer) return;
  try {
    const r = await fetch('/api/config');
    if (!r.ok) return;
    _config = await r.json();
    _lsSet('zhi:config', JSON.stringify(_config));
  } catch {}
}

function authorName(id) { return _get().names?.[id] ?? id; }
function authorShort(id) { return authorName(id).slice(0, 2); }
function setAuthorName(id, name) { _persist({ names: { [id]: name } }); }

function isCarbon(author) { return author === CARBON; }
function isSilicon(author) { return author === SILICON; }

function getMode() { return _get().mode || 'duo'; }
function setMode(mode) { _persist({ mode }); }
function isSoloMode() { return getMode() === 'solo'; }

function getAvatar(id) { return _ls(`zhi:avatar:${id}`); }
function setAvatar(id, dataUrl) { _lsSet(`zhi:avatar:${id}`, dataUrl); }
function clearAvatar(id) { _lsRm(`zhi:avatar:${id}`); }

function getMilestones() { return _get().milestones || {}; }
function setMilestones(obj) { _persist({ milestones: obj }); }

function getBadgeLabel() { return _get().badge || 'Day'; }
function setBadgeLabel(label) { _persist({ badge: label }); }

function getDayFormat() { return _get().dayFormat || ''; }
function formatDayParts(n) {
  const fmt = _get().dayFormat;
  const tpl = (fmt && fmt.includes('{n}')) ? fmt : '第 {n} 天';
  const i = tpl.indexOf('{n}');
  return [tpl.slice(0, i), String(n), tpl.slice(i + 3)];
}
function formatDay(n) { return formatDayParts(n).join(''); }
function setDayFormat(template) { _persist({ dayFormat: template }); }

const MOD = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.userAgent) ? '⌘' : 'Ctrl';

export { CARBON, SILICON, authorName, authorShort, setAuthorName, isCarbon, isSilicon, getMode, setMode, isSoloMode, getAvatar, setAvatar, clearAvatar, getMilestones, setMilestones, getBadgeLabel, setBadgeLabel, getDayFormat, formatDay, formatDayParts, setDayFormat, syncConfig, MOD };
