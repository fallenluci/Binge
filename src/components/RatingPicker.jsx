import { useState, useRef, useEffect } from 'react';

const ITEM_H = 80;
const RATINGS = [1,2,3,4,5,6,7,8,9,10];

export default function RatingPicker({ film, onRate, onClose, bgColor }) {
  const init = film.rating ?? 7;
  const [selected, setSelected] = useState(init);
  const [offset, setOffset] = useState(-(init - 1) * ITEM_H);
  const cur = useRef(-(init - 1) * ITEM_H);
  const startY = useRef(0);
  const dragging = useRef(false);

  const snap = (raw) => {
    const idx = Math.max(0, Math.min(9, Math.round(-raw / ITEM_H)));
    setSelected(RATINGS[idx]);
    const s = -(idx * ITEM_H);
    setOffset(s); cur.current = s;
  };

  useEffect(() => {
    const up = (e) => { if (!dragging.current) return; dragging.current = false; snap(cur.current + (e.clientY - startY.current)); };
    const mv = (e) => { if (!dragging.current) return; const dy = e.clientY - startY.current; setOffset(Math.max(-9*ITEM_H, Math.min(0, cur.current + dy))); };
    window.addEventListener('mouseup', up); window.addEventListener('mousemove', mv);
    return () => { window.removeEventListener('mouseup', up); window.removeEventListener('mousemove', mv); };
  }, []);

  return (
    <div className="rating-page">
      {/* Blurred background — category page showing through */}
      <div className="rating-bg" style={{ background: bgColor, opacity: 0.88 }} />

      {/* Close X */}
      <button className="rating-close" onClick={onClose}>✕</button>

      {/* Drum area */}
      <div className="rating-drum-area">
        {/* Left number */}
        {selected > 1 && (
          <span className="rating-side" style={{ left: 24 }}>{selected - 1}</span>
        )}
        {/* Capsule + drum */}
        <div style={{ position: 'relative' }}>
          <div className="rating-capsule" />
          <div className="rating-drum"
            onTouchStart={e => { startY.current = e.touches[0].clientY; dragging.current = true; }}
            onTouchMove={e => { if (!dragging.current) return; setOffset(Math.max(-9*ITEM_H, Math.min(0, cur.current + (e.touches[0].clientY - startY.current)))); }}
            onTouchEnd={e => { dragging.current = false; snap(cur.current + (e.changedTouches[0].clientY - startY.current)); }}
            onMouseDown={e => { startY.current = e.clientY; dragging.current = true; }}
          >
            <div style={{
              transform: `translateY(${offset + ITEM_H}px)`,
              transition: dragging.current ? 'none' : 'transform 0.3s cubic-bezier(0.25,0.46,0.45,0.94)',
            }}>
              {RATINGS.map(r => {
                const diff = Math.abs(r - selected);
                return (
                  <div key={r} style={{
                    height: ITEM_H, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: diff === 0 ? 128 : 72, fontWeight: 860,
                    color: diff === 0 ? '#34C759' : 'white',
                    opacity: diff === 0 ? 1 : diff === 1 ? 0.35 : 0.1,
                    lineHeight: 1, letterSpacing: '-3px',
                  }}>{r}</div>
                );
              })}
            </div>
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, transparent 35%, transparent 65%, rgba(0,0,0,0.4) 100%)',
              pointerEvents: 'none',
            }}/>
          </div>
        </div>
        {/* Right number */}
        {selected < 10 && (
          <span className="rating-side" style={{ right: 24 }}>{selected + 1}</span>
        )}
      </div>

      {/* Rate button */}
      <button className="rating-rate-btn" onClick={() => onRate(selected)}>Rate</button>
    </div>
  );
}
