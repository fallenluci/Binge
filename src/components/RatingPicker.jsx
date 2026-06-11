import { useState, useRef, useEffect } from 'react';

const ITEM_H = 68;
const RATINGS = [1,2,3,4,5,6,7,8,9,10];

export default function RatingPicker({ film, onRate, onClose, bgColor }) {
  const [selected, setSelected] = useState(film.rating ?? 7);
  const [offset, setOffset] = useState(-(( (film.rating ?? 7) - 1) * ITEM_H));
  const startY = useRef(0);
  const curOffset = useRef(-(( (film.rating ?? 7) - 1) * ITEM_H));
  const dragging = useRef(false);

  const snap = (raw) => {
    const idx = Math.max(0, Math.min(9, Math.round(-raw / ITEM_H)));
    setSelected(RATINGS[idx]);
    const snapped = -(idx * ITEM_H);
    setOffset(snapped);
    curOffset.current = snapped;
  };

  useEffect(() => {
    const up = (e) => {
      if (!dragging.current) return;
      dragging.current = false;
      snap(curOffset.current + (e.clientY - startY.current));
    };
    const move = (e) => {
      if (!dragging.current) return;
      const dy = e.clientY - startY.current;
      const raw = curOffset.current + dy;
      setOffset(Math.max(-(9*ITEM_H), Math.min(0, raw)));
    };
    window.addEventListener('mouseup', up);
    window.addEventListener('mousemove', move);
    return () => { window.removeEventListener('mouseup', up); window.removeEventListener('mousemove', move); };
  }, []);

  const prevNum = selected > 1 ? selected - 1 : null;
  const nextNum = selected < 10 ? selected + 1 : null;

  return (
    <div className="rating-overlay">
      {/* Blurred bg */}
      <div style={{ position: 'absolute', inset: 0, background: bgColor, opacity: 0.97 }} />

      {/* Close */}
      <button className="rating-close" onClick={onClose}>✕</button>

      {/* Film name */}
      <div style={{
        position: 'absolute', top: '18%',
        color: 'rgba(255,255,255,0.8)',
        fontSize: 24, fontWeight: 590,
        textAlign: 'center', padding: '0 40px', zIndex: 1,
        width: '100%',
      }}>{film.name}</div>

      {/* Side numbers + drum */}
      <div style={{ position: 'relative', width: 390, height: 204, zIndex: 1 }}>
        {/* Left num */}
        {prevNum && (
          <span className="rating-side-num" style={{ left: 31, top: '50%', transform: 'translateY(-50%)' }}>
            {prevNum}
          </span>
        )}
        {/* Right num */}
        {nextNum && (
          <span className="rating-side-num" style={{ right: 31, top: '50%', transform: 'translateY(-50%)' }}>
            {nextNum}
          </span>
        )}

        {/* Drum centered */}
        <div style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)' }}>
          <div
            className="rating-drum-wrap"
            onTouchStart={e => { startY.current = e.touches[0].clientY; dragging.current = true; }}
            onTouchMove={e => {
              if (!dragging.current) return;
              const dy = e.touches[0].clientY - startY.current;
              const raw = curOffset.current + dy;
              setOffset(Math.max(-(9*ITEM_H), Math.min(0, raw)));
            }}
            onTouchEnd={e => {
              dragging.current = false;
              snap(curOffset.current + (e.changedTouches[0].clientY - startY.current));
            }}
            onMouseDown={e => { startY.current = e.clientY; dragging.current = true; }}
          >
            <div className="rating-drum-highlight" />
            <div style={{
              transform: `translateY(${offset + 68}px)`,
              transition: dragging.current ? 'none' : 'transform 0.3s cubic-bezier(0.25,0.46,0.45,0.94)',
              position: 'relative', zIndex: 1,
            }}>
              {RATINGS.map(r => {
                const diff = Math.abs(r - selected);
                return (
                  <div key={r} style={{
                    height: ITEM_H,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: diff === 0 ? 128 : 80,
                    fontWeight: 860,
                    color: diff === 0 ? '#34C759' : 'white',
                    opacity: diff === 0 ? 1 : diff === 1 ? 0.4 : 0.1,
                    lineHeight: 1,
                    letterSpacing: '-2px',
                  }}>{r}</div>
                );
              })}
            </div>
            {/* Fade */}
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, transparent 35%, transparent 65%, rgba(0,0,0,0.5) 100%)',
              pointerEvents: 'none', zIndex: 2,
            }}/>
          </div>
        </div>
      </div>

      {/* Rate button */}
      <button className="rating-rate-btn" onClick={() => onRate(selected)}>
        Rate
      </button>
    </div>
  );
}
