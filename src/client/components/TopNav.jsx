import React from 'react';
import { BrandMark, DaysTogetherBadge, PersonLens, NavIconBtn } from './atoms.jsx';

/* ─── Top nav ───────────────────────────────────────────────────────── */

function TopNav({ screen, onScreen, daysTogether, onCompose, onSearch, onExport, onSettings, personLens, onLensChange }) {
  const tabs = [
    { id: 'today', label: '今日' },
    { id: 'calendar', label: '日历' },
    { id: 'changjuan', label: '长篇' },
    { id: 'album', label: '相册' },
    { id: 'memory', label: '回忆' },
  ];
  return (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 10,
      background: 'color-mix(in srgb, var(--bg-desk) 88%, transparent)',
      backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
      borderBottom: '1px solid var(--rule-soft)',
    }}>
      <div style={{
        maxWidth: 980, margin: '0 auto',
        padding: '14px 28px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: 16,
      }}>
        <button
          onClick={() => onScreen('today')}
          style={{
            appearance: 'none', border: 'none', background: 'transparent',
            cursor: 'pointer', padding: 0,
          }}
        >
          <BrandMark size={22}/>
        </button>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 22,
          fontFamily: 'var(--font-display)', fontSize: 14,
        }}>
          {tabs.map(t => (
            <button key={t.id}
              onClick={() => onScreen(t.id)}
              style={{
                appearance: 'none', border: 'none', background: 'transparent',
                cursor: 'pointer', padding: '4px 0',
                color: screen === t.id ? 'var(--ink)' : 'var(--ink-faded)',
                fontFamily: 'inherit', fontSize: 'inherit',
                letterSpacing: '0.08em',
                position: 'relative',
              }}
            >
              {t.label}
              {screen === t.id && (
                <svg width="100%" height="5" viewBox="0 0 40 5" style={{
                  position: 'absolute', left: 0, bottom: -6,
                }} preserveAspectRatio="none">
                  <path d="M2 3 C 12 0, 28 5, 38 2"
                    stroke="var(--red)" strokeWidth="1.5" fill="none"
                    strokeLinecap="round"/>
                </svg>
              )}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {onLensChange && <PersonLens value={personLens} onChange={onLensChange}/>}
          {onCompose && (
            <NavIconBtn onClick={onCompose} title="写 (W)" color="var(--red)">
              <svg width="15" height="15" viewBox="0 0 15 15">
                <path d="M2 13 L3.8 11.2 L9.8 5.2 L11.8 7.2 L5.8 13.2 L2 13.2 Z"
                      fill="currentColor" opacity="0.85"/>
                <path d="M9.8 5.2 L11 4 L13 6 L11.8 7.2 Z" fill="currentColor"/>
              </svg>
            </NavIconBtn>
          )}
          {onSearch && (
            <NavIconBtn onClick={onSearch} title="搜索 (/)">
              <svg width="15" height="15" viewBox="0 0 15 15">
                <circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="1.3" fill="none"/>
                <path d="M10 10 L13 13" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
              </svg>
            </NavIconBtn>
          )}
          {onExport && (
            <NavIconBtn onClick={onExport} title="导出">
              <svg width="15" height="15" viewBox="0 0 15 15">
                <path d="M7.5 2 L7.5 10 M4 7 L7.5 10.5 L11 7"
                      stroke="currentColor" strokeWidth="1.3" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2.5 12.5 L12.5 12.5"
                      stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
              </svg>
            </NavIconBtn>
          )}
          {onSettings && (
            <NavIconBtn onClick={onSettings} title="设置">
              <svg width="15" height="15" viewBox="0 0 15 15">
                <circle cx="7.5" cy="7.5" r="2.2" stroke="currentColor" strokeWidth="1.2" fill="none"/>
                <path d="M7.5 1.5 L7.5 3.2 M7.5 11.8 L7.5 13.5 M1.5 7.5 L3.2 7.5 M11.8 7.5 L13.5 7.5 M3.26 3.26 L4.46 4.46 M10.54 10.54 L11.74 11.74 M11.74 3.26 L10.54 4.46 M4.46 10.54 L3.26 11.74"
                      stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
            </NavIconBtn>
          )}
          <DaysTogetherBadge days={daysTogether}/>
        </div>
      </div>
    </nav>
  );
}

export { TopNav };
