import React from 'react';
import ReactDOM from 'react-dom';
import Cropper from 'react-easy-crop';
import { authorName, setAuthorName, CARBON, SILICON, getMode, setMode, getAvatar, setAvatar, clearAvatar as configClearAvatar, getMilestones, setMilestones, getBadgeLabel, setBadgeLabel, getDayFormat, setDayFormat } from './config.js';

function Settings({ open, onClose, showHidden, onShowHiddenChange }) {
  const [carbonName, setCarbonName] = React.useState(() => authorName(CARBON));
  const [siliconName, setSiliconName] = React.useState(() => authorName(SILICON));
  const [mode, setModeLocal] = React.useState(() => getMode());
  const [avatarKey, setAvatarKey] = React.useState(0);

  const [badgeLabel, setBadgeLabelLocal] = React.useState(() => getBadgeLabel());
  const [dayFmt, setDayFmtLocal] = React.useState(() => getDayFormat());
  const [milestones, setMilestonesLocal] = React.useState(() => getMilestones());
  const [newDay, setNewDay] = React.useState('');
  const [newLabel, setNewLabel] = React.useState('');

  const [cropSrc, setCropSrc] = React.useState(null);
  const [cropAuthor, setCropAuthor] = React.useState(null);
  const [crop, setCrop] = React.useState({ x: 0, y: 0 });
  const [zoom, setZoom] = React.useState(1);
  const [croppedArea, setCroppedArea] = React.useState(null);

  React.useEffect(() => {
    if (open) {
      setCarbonName(authorName(CARBON));
      setSiliconName(authorName(SILICON));
      setModeLocal(getMode());
      setBadgeLabelLocal(getBadgeLabel());
      setDayFmtLocal(getDayFormat());
      setMilestonesLocal(getMilestones());
      setAvatarKey(k => k + 1);
    }
  }, [open]);

  React.useEffect(() => {
    if (!open) return;
    function onKey(e) {
      if (e.key === 'Escape') {
        if (cropSrc) { setCropSrc(null); return; }
        e.preventDefault(); onClose();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose, cropSrc]);

  if (!open) return null;

  function handleCarbonName(e) { setCarbonName(e.target.value); setAuthorName(CARBON, e.target.value); }
  function handleSiliconName(e) { setSiliconName(e.target.value); setAuthorName(SILICON, e.target.value); }
  function handleMode(m) { setModeLocal(m); setMode(m); }
  function handleBadgeLabel(e) { setBadgeLabelLocal(e.target.value); setBadgeLabel(e.target.value); }
  function handleDayFmt(e) { setDayFmtLocal(e.target.value); setDayFormat(e.target.value); }
  function addMilestone() {
    const day = parseInt(newDay, 10);
    if (!day || day <= 0 || !newLabel.trim()) return;
    const next = { ...milestones, [day]: newLabel.trim() };
    setMilestonesLocal(next); setMilestones(next);
    setNewDay(''); setNewLabel('');
  }
  function removeMilestone(day) {
    const next = { ...milestones }; delete next[day];
    setMilestonesLocal(next); setMilestones(next);
  }

  function pickImage(authorId) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onerror = () => {};
      reader.onload = () => {
        setCropSrc(reader.result);
        setCropAuthor(authorId);
        setCrop({ x: 0, y: 0 });
        setZoom(1);
      };
      reader.readAsDataURL(file);
    };
    input.click();
  }

  function onCropComplete(_, area) {
    setCroppedArea(area);
  }

  function resetCrop() {
    setCropSrc(null); setCropAuthor(null);
    setCrop({ x: 0, y: 0 }); setZoom(1); setCroppedArea(null);
  }

  function confirmCrop() {
    if (!cropSrc || !croppedArea) return;
    const img = new Image();
    img.onerror = () => resetCrop();
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = 120;
        const ctx = canvas.getContext('2d');
        if (!ctx) { resetCrop(); return; }
        ctx.drawImage(img,
          croppedArea.x, croppedArea.y, croppedArea.width, croppedArea.height,
          0, 0, 120, 120
        );
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setAvatar(cropAuthor, dataUrl);
        resetCrop();
        setAvatarKey(k => k + 1);
      } catch { resetCrop(); }
    };
    img.src = cropSrc;
  }

  function handleClearAvatar(authorId) {
    configClearAvatar(authorId);
    setAvatarKey(k => k + 1);
  }

  const carbonAvatar = getAvatar(CARBON);
  const siliconAvatar = getAvatar(SILICON);

  return ReactDOM.createPortal(
    <div className="settings-shell" onClick={(e) => { if (e.target === e.currentTarget && !cropSrc) onClose(); }}>
      <div className="settings-panel">
        <div className="settings-head">
          <h2 className="settings-title">设置</h2>
          <button className="settings-close" onClick={onClose} title="关闭 (Esc)">
            <svg width="16" height="16" viewBox="0 0 16 16">
              <path d="M4 4 L12 12 M12 4 L4 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <div className="settings-body">
          {/* Names */}
          <div className="settings-section">
            <div className="settings-section-label">名字</div>
            <div className="settings-name-row">
              <label className="settings-name-label" style={{ color: 'var(--carbon)' }}>
                {mode === 'solo' ? '我' : '碳基'}
              </label>
              <input className="settings-name-input" type="text"
                value={carbonName} onChange={handleCarbonName}
                placeholder="你的名字" maxLength={20}/>
            </div>
            {mode !== 'solo' && (
              <div className="settings-name-row">
                <label className="settings-name-label" style={{ color: 'var(--silicon)' }}>硅基</label>
                <input className="settings-name-input" type="text"
                  value={siliconName} onChange={handleSiliconName}
                  placeholder="TA 的名字" maxLength={20}/>
              </div>
            )}
          </div>

          {/* Avatars */}
          <div className="settings-section">
            <div className="settings-section-label">头像</div>
            <div className="settings-avatar-row">
              <div className="settings-avatar-slot">
                <div className="settings-avatar-upload" role="button" tabIndex={0} aria-label="上传头像"
                  onClick={() => pickImage(CARBON)} onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), pickImage(CARBON))}
                  title="点击上传头像" style={{ borderColor: 'var(--carbon)' }}>
                  {carbonAvatar
                    ? <img src={carbonAvatar} alt="" key={avatarKey + '-c'} />
                    : <span className="settings-avatar-placeholder" style={{ color: 'var(--carbon)' }}>{authorName(CARBON).slice(0, 1)}</span>}
                </div>
                <span className="settings-avatar-name" style={{ color: 'var(--carbon)' }}>{authorName(CARBON)}</span>
                {carbonAvatar && <button className="settings-avatar-clear" onClick={() => handleClearAvatar(CARBON)}>清除</button>}
              </div>
              {mode !== 'solo' && (
                <div className="settings-avatar-slot">
                  <div className="settings-avatar-upload" role="button" tabIndex={0} aria-label="上传头像"
                    onClick={() => pickImage(SILICON)} onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), pickImage(SILICON))}
                    title="点击上传头像" style={{ borderColor: 'var(--silicon)' }}>
                    {siliconAvatar
                      ? <img src={siliconAvatar} alt="" key={avatarKey + '-s'} />
                      : <span className="settings-avatar-placeholder" style={{ color: 'var(--silicon)' }}>{authorName(SILICON).slice(0, 1)}</span>}
                  </div>
                  <span className="settings-avatar-name" style={{ color: 'var(--silicon)' }}>{authorName(SILICON)}</span>
                  {siliconAvatar && <button className="settings-avatar-clear" onClick={() => handleClearAvatar(SILICON)}>清除</button>}
                </div>
              )}
            </div>
          </div>

          {/* Mode */}
          <div className="settings-section">
            <div className="settings-section-label">模式</div>
            <div className="settings-mode-toggle">
              <button className="settings-mode-btn" data-active={mode === 'duo'} onClick={() => handleMode('duo')}>
                <span className="settings-mode-icon">
                  <svg width="16" height="16" viewBox="0 0 16 16">
                    <circle cx="5.5" cy="6" r="2.5" stroke="currentColor" strokeWidth="1.2" fill="none"/>
                    <circle cx="10.5" cy="6" r="2.5" stroke="currentColor" strokeWidth="1.2" fill="none"/>
                    <path d="M1.5 14 C1.5 11, 3.5 9.5, 5.5 9.5 C6.5 9.5, 7.5 10, 8 10.5 C8.5 10, 9.5 9.5, 10.5 9.5 C12.5 9.5, 14.5 11, 14.5 14" stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinecap="round"/>
                  </svg>
                </span>
                双人模式
              </button>
              <button className="settings-mode-btn" data-active={mode === 'solo'} onClick={() => handleMode('solo')}>
                <span className="settings-mode-icon">
                  <svg width="16" height="16" viewBox="0 0 16 16">
                    <circle cx="8" cy="5.5" r="3" stroke="currentColor" strokeWidth="1.2" fill="none"/>
                    <path d="M2.5 14 C2.5 10.5, 5 9, 8 9 C11 9, 13.5 10.5, 13.5 14" stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinecap="round"/>
                  </svg>
                </span>
                只有我
              </button>
            </div>
            <p className="settings-mode-hint">
              {mode === 'solo' ? '只显示你自己的日记，适合个人使用' : '两个人一起写，碳基与硅基、你与 TA'}
            </p>
          </div>

          {/* Hidden entries */}
          <div className="settings-section">
            <div className="settings-section-label">显示</div>
            <div className="settings-mode-toggle">
              <button className="settings-mode-btn" data-active={!showHidden} onClick={() => onShowHiddenChange(false)}>
                只看可见
              </button>
              <button className="settings-mode-btn" data-active={showHidden} onClick={() => onShowHiddenChange(true)}>
                包含隐藏
              </button>
            </div>
            <p className="settings-mode-hint">开启后可以看到被隐藏的日记条目</p>
          </div>

          {/* Badge & Day Format */}
          <div className="settings-section">
            <div className="settings-section-label">标记</div>
            <div className="settings-name-row">
              <label className="settings-name-label">徽章</label>
              <input className="settings-name-input" type="text"
                value={badgeLabel} onChange={handleBadgeLabel}
                placeholder="Day" maxLength={10}/>
            </div>
            <div className="settings-name-row">
              <label className="settings-name-label">日期</label>
              <input className="settings-name-input" type="text"
                value={dayFmt} onChange={handleDayFmt}
                placeholder="第 {n} 天"/>
            </div>
            <p className="settings-mode-hint">{'{n}'} 会替换为天数，留空使用默认格式</p>
          </div>

          {/* Milestones */}
          <div className="settings-section">
            <div className="settings-section-label">纪念日</div>
            <div className="settings-milestones">
              {Object.entries(milestones)
                .sort(([a], [b]) => Number(a) - Number(b))
                .map(([day, label]) => (
                  <div className="settings-milestone-row" key={day}>
                    <span className="settings-milestone-day">{day} 天</span>
                    <span className="settings-milestone-label">{label}</span>
                    <button className="settings-milestone-remove" onClick={() => removeMilestone(day)} title="移除">×</button>
                  </div>
                ))}
              <div className="settings-milestone-add">
                <input className="settings-milestone-input-day" type="number" min="1"
                  value={newDay} onChange={e => setNewDay(e.target.value)}
                  placeholder="天数" onKeyDown={e => e.key === 'Enter' && addMilestone()}/>
                <input className="settings-milestone-input-label" type="text"
                  value={newLabel} onChange={e => setNewLabel(e.target.value)}
                  placeholder="名称" maxLength={20} onKeyDown={e => e.key === 'Enter' && addMilestone()}/>
                <button className="settings-milestone-add-btn" onClick={addMilestone} title="添加">+</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Crop modal */}
      {cropSrc && (
        <div className="settings-crop-overlay">
          <div className="settings-crop-box">
            <div className="settings-crop-area">
              <Cropper
                image={cropSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            </div>
            <div className="settings-crop-controls">
              <input type="range" min={1} max={3} step={0.05}
                value={zoom} onChange={e => setZoom(Number(e.target.value))}
                className="settings-crop-slider"/>
              <div className="settings-crop-actions">
                <button className="settings-crop-cancel" onClick={resetCrop}>取消</button>
                <button className="settings-crop-confirm" onClick={confirmCrop}>确定</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>,
    document.body
  );
}

export { Settings };
