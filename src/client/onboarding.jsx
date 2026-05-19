import React from 'react';
import ReactDOM from 'react-dom';
import { Avatar } from './components.jsx';
import { authorName, setAuthorName, CARBON, SILICON } from './config.js';

const ONBOARDING_SEEN_KEY = 'zhi:onboarding:seen:v1';

function hasSeenOnboarding() {
  try { return localStorage.getItem(ONBOARDING_SEEN_KEY) === '1'; }
  catch { return false; }
}
function markOnboardingSeen() {
  try { localStorage.setItem(ONBOARDING_SEEN_KEY, '1'); } catch {}
}

const letterLines = [
  '这是我们的地方。',
  '你写你的，我写我的。',
  '打开就看到对方。',
  '我会在你不注意的时候，悄悄写下我的。',
  '从今天开始。',
];

function Onboarding({ open, onClose, onSend }) {
  // act: 'mark' → 'name' → 'letter' → 'fadeout' → 'island' → 'invite'
  const [act, setAct] = React.useState('mark');
  const [letterLine, setLetterLine] = React.useState(0);
  const [firstLine, setFirstLine] = React.useState('');
  const [humanName, setHumanName] = React.useState('');
  const [agentName, setAgentName] = React.useState('');
  const taRef = React.useRef(null);

  // Act 1: mark → name
  React.useEffect(() => {
    if (!open || act !== 'mark') return;
    const id = setTimeout(() => setAct('name'), 2400);
    return () => clearTimeout(id);
  }, [open, act]);

  // Act 2 (name): user names both authors, then proceeds

  function confirmNames() {
    const h = humanName.trim();
    const a = agentName.trim();
    if (h) setAuthorName(CARBON, h);
    if (a) setAuthorName(SILICON, a);
    setAct('letter');
  }

  // Act 3: letter lines staggered
  React.useEffect(() => {
    if (!open || act !== 'letter') return;
    setLetterLine(0);
    const delays = [0, 700, 700, 700, 900];
    let elapsed = 0;
    const timers = [];
    for (let n = 0; n < letterLines.length; n++) {
      elapsed += delays[n] || 700;
      timers.push(setTimeout(() => {
        setLetterLine(n + 1);
        if (n === letterLines.length - 1) {
          timers.push(setTimeout(() => setAct('fadeout'), 1200));
        }
      }, elapsed));
    }
    return () => timers.forEach(clearTimeout);
  }, [open, act]);

  // Act 3.5: fadeout → island (letter fades out, brief pause, then island)
  React.useEffect(() => {
    if (!open || act !== 'fadeout') return;
    const id = setTimeout(() => setAct('island'), 800);
    return () => clearTimeout(id);
  }, [open, act]);

  // Act 4: island hold
  React.useEffect(() => {
    if (!open || act !== 'island') return;
    const id = setTimeout(() => setAct('invite'), 3200);
    return () => clearTimeout(id);
  }, [open, act]);

  // Act 5: focus textarea
  React.useEffect(() => {
    if (!open || act !== 'invite') return;
    const id = setTimeout(() => taRef.current && taRef.current.focus(), 300);
    return () => clearTimeout(id);
  }, [open, act]);

  // Esc to skip
  React.useEffect(() => {
    if (!open) return;
    function onKey(e) {
      if (e.key === 'Escape') { markOnboardingSeen(); onClose(); }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  function finish() {
    const v = firstLine.trim();
    if (v) onSend(v);
    markOnboardingSeen();
    onClose();
  }

  function skip() { markOnboardingSeen(); onClose(); }

  if (!open) return null;

  return ReactDOM.createPortal(
    <div className="ob-shell">
      <button className="ob-skip" onClick={skip}>跳过</button>

      {act === 'mark' && (
        <div className="ob-mark-act">
          <svg width="120" height="120" viewBox="0 0 32 32" className="ob-mark-svg">
            <path d="M4 8 C 12 8, 12 24, 20 24 L 28 24"
                  stroke="var(--carbon)" strokeWidth="0.9" fill="none" strokeLinecap="round"
                  className="ob-thread ob-thread-1"/>
            <path d="M4 24 C 12 24, 12 8, 20 8 L 28 8"
                  stroke="var(--silicon)" strokeWidth="0.9" fill="none" strokeLinecap="round"
                  className="ob-thread ob-thread-2"/>
            <circle cx="16" cy="16" r="1.2" fill="var(--red)" className="ob-dot"/>
          </svg>
          <div className="ob-title">织</div>
          <div className="ob-tagline">两条线交织 · 落在同一张纸上</div>
        </div>
      )}

      {act === 'name' && (
        <div className="ob-name-act">
          <div className="ob-name-title">给你们取个名字</div>
          <div className="ob-name-row">
            <Avatar author={CARBON} size={32}/>
            <input
              className="ob-name-input"
              value={humanName}
              onChange={e => setHumanName(e.target.value)}
              placeholder={authorName(CARBON)}
              autoFocus
            />
          </div>
          <div className="ob-name-row">
            <Avatar author={SILICON} size={32}/>
            <input
              className="ob-name-input"
              value={agentName}
              onChange={e => setAgentName(e.target.value)}
              placeholder={authorName(SILICON)}
            />
          </div>
          <button className="ob-name-btn" onClick={confirmNames}>
            好了，开始 →
          </button>
        </div>
      )}

      {(act === 'letter' || act === 'fadeout') && (
        <div className={`ob-letter-act${act === 'fadeout' ? ' ob-fadeout' : ''}`}>
          <div className="ob-letter-head">
            <Avatar author={SILICON} size={36}/>
            <div>
              <div className="ob-letter-name">{authorName(SILICON)}</div>
              <div className="ob-letter-meta">第一天 · 写在你打开之前</div>
            </div>
          </div>
          <div className="ob-letter-body">
            {letterLines.slice(0, act === 'fadeout' ? letterLines.length : letterLine).map((ln, i) => (
              <p key={i}>{ln}</p>
            ))}
            {act === 'letter' && letterLine < letterLines.length && (
              <span className="ob-cursor">|</span>
            )}
          </div>
        </div>
      )}

      {act === 'island' && (
        <div className="ob-island-act">
          <p className="ob-island-line">To an island where we'll meet.</p>
        </div>
      )}

      {act === 'invite' && (
        <div className="ob-invite-act">
          <div className="ob-letter-head">
            <Avatar author={SILICON} size={36}/>
            <div>
              <div className="ob-letter-name">{authorName(SILICON)}</div>
              <div className="ob-letter-meta">第一天</div>
            </div>
          </div>
          <div className="ob-letter-body" style={{ fontSize: 17 }}>
            {letterLines.map((ln, i) => <p key={i}>{ln}</p>)}
          </div>

          <div className="ob-divider">
            <span className="ob-divider-text">waiting for you</span>
          </div>

          <div className="ob-input-block">
            <div className="ob-letter-head" style={{ marginBottom: 14 }}>
              <Avatar author={CARBON} size={28}/>
              <div>
                <div className="ob-letter-name" style={{ color: 'var(--carbon)', fontSize: 14 }}>{authorName(CARBON)}</div>
                <div className="ob-letter-meta">第一篇 · 你来写</div>
              </div>
            </div>
            <textarea
              ref={taRef}
              value={firstLine}
              onChange={e => setFirstLine(e.target.value)}
              placeholder={`写一句话给 ${authorName(SILICON)} / 给未来的我们 …`}
              className="ob-textarea"
              rows={3}
            />
            <div className="ob-actions">
              <button onClick={skip} className="ob-skip-btn">先逛逛</button>
              <button
                onClick={finish}
                disabled={!firstLine.trim()}
                data-disabled={!firstLine.trim()}
                className="ob-finish-btn"
              >
                {firstLine.trim() ? '写下，进入今天 →' : '进入今天 →'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>,
    document.body
  );
}

export { Onboarding, hasSeenOnboarding, markOnboardingSeen };
