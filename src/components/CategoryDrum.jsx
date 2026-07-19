import { useRef, useState, useEffect } from 'react';

// Horizontal drum, mirroring the proven vertical RatingPicker drag/snap logic exactly,
// just rotated onto the X axis.
const ITEM_W = 120;

export default function CategoryDrum({ items, selectedIndex, onSelect }) {
  const [offset, setOffset] = useState(-selectedIndex * ITEM_W);
  const cur = useRef(-selectedIndex * ITEM_W);
  const startX = useRef(0);
  const dragging = useRef(false);
  const [isDragging, setIsDragging] = useState(false);

  const maxIdx = Math.max(0, items.length - 1);
  const clamp = (v) => Math.max(-maxIdx * ITEM_W, Math.min(0, v));

  const snap = (raw) => {
    const idx = Math.max(0, Math.min(maxIdx, Math.round(-raw / ITEM_W)));
    const target = -idx * ITEM_W;
    setOffset(target);
    cur.current = target;
    onSelect(idx);
  };

  const handleStart = (x) => { dragging.current = true; setIsDragging(true); startX.current = x; };
  const handleMove = (x) => {
    if (!dragging.current) return;
    setOffset(clamp(cur.current + (x - startX.current)));
  };
  const handleEnd = (x) => {
    if (!dragging.current) return;
    dragging.current = false;
    setIsDragging(false);
    snap(cur.current + (x - startX.current));
  };

  useEffect(() => {
    const up = (e) => handleEnd(e.clientX);
    const mv = (e) => handleMove(e.clientX);
    window.addEventListener('mouseup', up);
    window.addEventListener('mousemove', mv);
    return () => {
      window.removeEventListener('mouseup', up);
      window.removeEventListener('mousemove', mv);
    };
  }, []);

  return (
    <div style={{ width: '100%', maxWidth: 340, margin: '0 auto' }}>
      <div
        style={{
          position: 'relative', width: '100%', height: 64, overflow: 'hidden',
          cursor: 'grab', userSelect: 'none', touchAction: 'pan-y',
          background: 'rgb(28,28,30)', borderRadius: 20,
        }}
        onTouchStart={e => handleStart(e.touches[0].clientX)}
        onTouchMove={e => handleMove(e.touches[0].clientX)}
        onTouchEnd={e => handleEnd(e.changedTouches[0].clientX)}
        onMouseDown={e => handleStart(e.clientX)}
      >
        {/* Center highlight */}
        <div style={{
          position: 'absolute', top: 6, bottom: 6, left: '50%',
          width: ITEM_W - 16, transform: 'translateX(-50%)',
          background: 'rgba(255,255,255,0.1)', borderRadius: 14,
          pointerEvents: 'none', zIndex: 0,
        }} />

        <div style={{
          position: 'relative', height: '100%', display: 'flex', alignItems: 'center',
          transform: `translateX(calc(50% - ${ITEM_W / 2}px + ${offset}px))`,
          transition: isDragging ? 'none' : 'transform 0.32s cubic-bezier(0.25,0.46,0.45,0.94)',
          zIndex: 1,
        }}>
          {items.map((item, idx) => {
            const isCenter = Math.round(-offset / ITEM_W) === idx;
            return (
              <div key={item.id ?? idx} style={{
                width: ITEM_W, height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <span style={{
                  fontSize: isCenter ? 16 : 14,
                  fontWeight: isCenter ? 700 : 500,
                  color: isCenter ? (item.color || '#fff') : 'var(--text-dim)',
                  opacity: isCenter ? 1 : 0.5,
                  transition: 'color 0.2s, opacity 0.2s',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  maxWidth: ITEM_W - 16, textAlign: 'center',
                }}>{item.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
