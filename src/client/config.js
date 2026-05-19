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

const MOD = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.userAgent) ? '⌘' : 'Ctrl';

export { CARBON, SILICON, authorName, authorShort, setAuthorName, isCarbon, isSilicon, getMode, setMode, isSoloMode, getAvatar, setAvatar, clearAvatar, MOD };
