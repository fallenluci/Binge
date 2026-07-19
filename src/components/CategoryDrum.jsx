import { useRef, useState, useEffect } from 'react';

// Vertical capsule drum matching the rating-picker visual language:
// dark fill, gray stroke border, bold white selected item, dim gray item below.
const ITEM_H = 64;

export default function CategoryDrum({ items, selectedIndex, onSelect, onDone }) {
  const [offset, setOffset] = useState(-selectedIndex * ITEM_H);
  const cur = useRef(-selectedIndex * ITEM_H);
  const startY = useRef(0);
  const dragging = useRef(false);
  const [isDragging, setIsDragging] = useState(false);
  const [selected, setSelected] = useState(selectedIndex);

  const maxIdx = Math.max(0, items.length - 1);
  const clamp = (v) => Math.max(-maxIdx * ITEM_H, Math.min(0, v));

  const snap = (raw) => {
    const idx = Math.max(0, Math.min(maxIdx, Math.round(-raw / ITEM_H)));
    const target = -idx * ITEM_H;
    setOffset(target);
    cur.current = target;
    setSelected(idx);
    onSelect(idx);
  };

  const handleStart = (y) => { dragging.current = true; setIsDragging(true); startY.current = y; };
  const handleMove = (y) => {
    if (!dragging.current) return;
    setOffset(clamp(cur.current + (y - startY.current)));
  };
  const handleEnd = (y) => {
    if (!dragging.current) return;
    dragging.current = false;
    setIsDragging(false);
    snap(cur.current + (y - startY.current));
  };

  useEffect(() => {
    const up = (e) => handleEnd(e.clientY);
    const mv = (e) => handleMove(e.clientY);
    window.addEventListener('mouseup', up);
    window.addEventListener('mousemove', mv);
    return () => {
      window.removeEventListener('mouseup', up);
      window.removeEventListener('mousemove', mv);
    };
  }, []);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 500,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      gap: 28,
      background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)',
    }}>
      <div
        style={{
          position: 'relative', width: 150, height: 210, overflow: 'hidden',
          cursor: 'grab', userSelect: 'none', touchAction: 'pan-x',
          background: 'rgb(23,23,23)', borderRadius: 105,
          border: '3px solid #8E8E93',
        }}
        onTouchStart={e => handleStart(e.touches[0].clientY)}
        onTouchMove={e => handleMove(e.touches[0].clientY)}
        onTouchEnd={e => handleEnd(e.changedTouches[0].clientY)}
        onMouseDown={e => handleStart(e.clientY)}
      >
        <div style={{
          position: 'relative', transform: `translateY(${offset + ITEM_H}px)`,
          transition: isDragging ? 'none' : 'transform 0.32s cubic-bezier(0.25,0.46,0.45,0.94)',
        }}>
          {items.map((item, idx) => {
            const isCenter = idx === selected;
            return (
              <div key={item.id ?? idx} style={{
                height: ITEM_H, display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <span style={{
                  fontSize: isCenter ? 22 : 16,
                  fontWeight: isCenter ? 700 : 500,
                  color: isCenter ? '#fff' : 'var(--text-dim)',
                  opacity: isCenter ? 1 : 0.6,
                  transition: 'all 0.2s',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  maxWidth: 120, textAlign: 'center',
                }}>{item.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      <button
        type="button"
        onClick={onDone}
        style={{
          background: 'rgb(141,141,146)', border: 'none', borderRadius: 999,
          padding: '14px 44px', color: '#515151', fontSize: 16, fontWeight: 700,
          cursor: 'pointer',
        }}
      >Готово</button>
    </div>
  );
}
