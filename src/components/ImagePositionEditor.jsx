import { useRef } from 'react';

// Drag-to-reposition + scale editor.
// position = {x, y, scale} — x/y are CSS background-position percentages,
// scale is background-size percentage (100 = cover, more = zoomed in).
export default function ImagePositionEditor({ image, position, onChange }) {
  const startPos = useRef({ x: 50, y: 50 });
  const startPoint = useRef({ x: 0, y: 0 });
  const dragging = useRef(false);

  const BOX_W = 342;
  const BOX_H = 160;
  const scale = position.scale ?? 100;

  const onDown = (clientX, clientY) => {
    dragging.current = true;
    startPoint.current = { x: clientX, y: clientY };
    startPos.current = { x: position.x, y: position.y };
  };
  const onMove = (clientX, clientY) => {
    if (!dragging.current) return;
    const dx = clientX - startPoint.current.x;
    const dy = clientY - startPoint.current.y;
    const nx = Math.max(0, Math.min(100, startPos.current.x - (dx / BOX_W) * 100));
    const ny = Math.max(0, Math.min(100, startPos.current.y - (dy / BOX_H) * 100));
    onChange({ ...position, x: nx, y: ny });
  };
  const onUp = () => { dragging.current = false; };

  return (
    <div>
      <div
        style={{
          width: '100%', height: BOX_H, borderRadius: 16, overflow: 'hidden',
          position: 'relative', cursor: 'grab', userSelect: 'none',
          background: image ? `url(${image}) ${position.x}% ${position.y}%/${scale}% no-repeat` : '#222',
          border: '1px solid rgba(255,255,255,0.15)', touchAction: 'none',
        }}
        onMouseDown={e => onDown(e.clientX, e.clientY)}
        onMouseMove={e => onMove(e.clientX, e.clientY)}
        onMouseUp={onUp}
        onMouseLeave={onUp}
        onTouchStart={e => onDown(e.touches[0].clientX, e.touches[0].clientY)}
        onTouchMove={e => onMove(e.touches[0].clientX, e.touches[0].clientY)}
        onTouchEnd={onUp}
      >
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)',
          backgroundSize: '33.3% 33.3%',
        }} />
        <div style={{
          position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(0,0,0,0.55)', color: 'white', fontSize: 11, fontWeight: 600,
          padding: '4px 10px', borderRadius: 20, pointerEvents: 'none',
        }}>Перетащи, чтобы подогнать</div>
      </div>

      {/* Scale slider */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 12 }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-dim)" strokeWidth="2.5" strokeLinecap="round"><circle cx="11" cy="11" r="7"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
        <input
          type="range" min="100" max="300" step="1" value={scale}
          onChange={e => onChange({ ...position, scale: Number(e.target.value) })}
          style={{ flex: 1, accentColor: 'var(--accent)' }}
        />
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-dim)" strokeWidth="2.5" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
      </div>
    </div>
  );
}
