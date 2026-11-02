import { createPortal } from 'react-dom';

const Icon = ({ d, color = '#fff' }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>{d}</svg>
);
const ICONS = {
  adjust: <><path d="M6 2v14a2 2 0 0 0 2 2h14" /><path d="M18 22V8a2 2 0 0 0-2-2H2" /></>,
  replace: <><rect x="3" y="3" width="18" height="18" rx="3" /><circle cx="9" cy="9" r="2" /><path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21" /></>,
  remove: <><path d="M3 6h18" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6M14 11v6M9 6V4h6v2" /></>,
};

/**
 * What to do with an existing photo — one menu for the avatar, the banner and
 * category covers. `preview` is the photo as it looks now (in its own shape).
 */
export default function PhotoMenu({ title, preview, onAdjust, onReplace, onRemove, onClose }) {
  const row = (key, label, onClick, danger) => (
    <button type="button" className="d-btn" onClick={onClick} style={{ justifyContent: 'flex-start', height: 52, padding: '0 16px', gap: 14, color: danger ? '#FF453A' : '#fff' }}>
      <Icon d={ICONS[key]} color={danger ? '#FF453A' : '#fff'} />
      {label}
    </button>
  );
  return createPortal(
    <div onTouchStart={e => e.stopPropagation()} onTouchMove={e => e.stopPropagation()} onTouchEnd={e => e.stopPropagation()} onClick={e => e.stopPropagation()}>
      <div className="sheet-backdrop" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 520, animation: 'fadeIn 0.2s ease' }} onClick={onClose} />
      <div className="glass sheet-panel" style={{
        position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 430,
        borderRadius: '28px 28px 0 0', padding: '14px 22px 32px', zIndex: 521,
        animation: 'slideUp 0.35s cubic-bezier(0.34,1.26,0.64,1)',
      }}>
        <div className="sheet-handle" style={{ width: 36, height: 4, borderRadius: 2, margin: '0 auto 18px' }} />
        {preview && <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>{preview}</div>}
        <div className="d-title" style={{ marginBottom: 18 }}>{title}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {row('adjust', 'Настроить положение и размер', onAdjust)}
          {row('replace', 'Выбрать другое фото', onReplace)}
          {row('remove', 'Удалить фото', onRemove, true)}
          <button type="button" className="d-btn ghost" onClick={onClose}>Отмена</button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
