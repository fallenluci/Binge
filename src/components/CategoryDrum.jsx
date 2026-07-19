import { useRef, useState } from 'react';

const ITEM_W = 120;

export default function CategoryDrum({ items, selectedIndex, onSelect }) {
  const [offset, setOffset] = useState(-selectedIndex * ITEM_W);
  const cur = useRef(-selectedIndex * ITEM_W);
  const startX = useRef(0);
  const dragging = useRef(false);
  const [dragActive, setDragActive] = useState(false);

  const maxIdx = items.length - 1;
  const clamp = (v) => Math.max(-maxIdx * ITEM_W, Math.min(0, v));

  const snap = (raw) => {
    const idx = Math.max(0, Math.min(maxIdx, Math.round(-raw / ITEM_W)));
    const target = -idx * ITEM_W;
    setOffset(target);
    cur.current = target;
    onSelect(idx);
  };

  const onDown = (x) => { dragging.current = true; setDragActive(true); startX.current = x; };
  const onMove = (x) => {
    if (!dragging.current) return;
    const next = clamp(cur.current + (x - startX.current));
    setOffset(next);
  };
  const onUp = (x) => {
    if (!dragging.current) return;
    dragging.current = false;
    setDragActive(false);
    snap(cur.current + (x - startX.current));
  };

  return (
    <div style={{
      position: 'relative', width: '100%', maxWidth: 340, height: 64,
      overflow: 'hidden', margin: '0 auto',
      animation: 'rand-drum-in 0.4s cubic-bezier(0.34,1.4,0.64,1)',
    }}>
      {/* Center highlight */}
      <div style={{
        position: 'absolute', left: '50%', top: 4, bottom: 4,
        width: ITEM_W - 12, transform: 'translateX(-50%)',
        background: 'rgba(255,255,255,0.08)', borderRadius: 999,
        pointerEvents: 'none',
      }} />

      <div
        style={{
          position: 'relative', height: '100%', cursor: 'grab', userSelect: 'none', touchAction: 'pan-y',
        }}
        onTouchStart={e => onDown(e.touches[0].clientX)}
        onTouchMove={e => onMove(e.touches[0].clientX)}
        onTouchEnd={e => onUp(e.changedTouches[0].clientX)}
        onMouseDown={e => onDown(e.clientX)}
        onMouseMove={e => onMove(e.clientX)}
        onMouseUp={e => onUp(e.clientX)}
        onMouseLeave={() => { if (dragging.current) { dragging.current = false; setDragActive(false); snap(cur.current); } }}
      >
        <div style={{
          position: 'absolute', top: 0, bottom: 0, left: '50%',
          display: 'flex', alignItems: 'center',
          transform: `translateX(calc(-50% + ${offset}px))`,
          transition: dragActive ? 'none' : 'transform 0.35s cubic-bezier(0.25,0.46,0.45,0.94)',
        }}>
          {items.map((item, idx) => {
            const dist = Math.abs(idx * ITEM_W + offset);
            const isCenter = dist < ITEM_W / 2;
            return (
              <div key={item.id ?? idx} style={{
                width: ITEM_W, height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <span style={{
                  fontSize: isCenter ? 16 : 14,
                  fontWeight: isCenter ? 700 : 500,
                  color: isCenter ? (item.color || 'var(--text)') : 'var(--text-dim)',
                  opacity: isCenter ? 1 : 0.5,
                  transition: 'all 0.2s',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  maxWidth: ITEM_W - 16,
                }}>{item.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Edge fade */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'linear-gradient(to right, #000 0%, transparent 15%, transparent 85%, #000 100%)',
      }} />
    </div>
  );
}
