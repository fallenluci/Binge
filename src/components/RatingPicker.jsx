import { useState, useRef, useEffect } from 'react';

const ITEM_H = 76;
const RATINGS = [1,2,3,4,5,6,7,8,9,10];

export default function RatingPicker({ film, onRate, onClose, accentColor }) {
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
    const mv = (e) => { if (!dragging.current) return; setOffset(Math.max(-9*ITEM_H, Math.min(0, cur.current + (e.clientY - startY.current)))); };
    window.addEventListener('mouseup', up); window.addEventListener('mousemove', mv);
    return () => { window.removeEventListener('mouseup', up); window.removeEventListener('mousemove', mv); };
  }, []);

  return (
    <div style={{
      position: 'fixed', inset: 0, maxWidth: 390, left: '50%', marginLeft: -195,
      zIndex: 500, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(13,11,10,0.96)',
    }}>
      <button onClick={onClose} style={{
        position: 'fixed', top: 56, right: 20,
        background: 'var(--card)', border: '1px solid rgba(237,230,214,0.15)', borderRadius: 10,
        width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
        color: 'var(--paper)', fontSize: 16,
      }}>✕</button>

      <div style={{
        fontSize: 16, color: 'var(--paper-dim)', textAlign: 'center', padding: '0 50px', marginBottom: 30,
        fontWeight: 500,
      }}>{film.name}</div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        {selected > 1 && <span style={{ fontFamily: 'var(--mono)', fontSize: 36, color: 'rgba(237,230,214,0.25)', fontWeight: 700 }}>{String(selected-1).padStart(2,'0')}</span>}

        <div style={{ position: 'relative', width: 130, height: 180, overflow: 'hidden', cursor: 'grab', userSelect: 'none' }}
          onTouchStart={e => { startY.current = e.touches[0].clientY; dragging.current = true; }}
          onTouchMove={e => { if (!dragging.current) return; setOffset(Math.max(-9*ITEM_H, Math.min(0, cur.current + (e.touches[0].clientY - startY.current)))); }}
          onTouchEnd={e => { dragging.current = false; snap(cur.current + (e.changedTouches[0].clientY - startY.current)); }}
          onMouseDown={e => { startY.current = e.clientY; dragging.current = true; }}
        >
          <div style={{ position: 'absolute', inset: 0, background: 'var(--card)', borderRadius: 24, border: `2px solid ${accentColor}` }} />
          <div style={{ position: 'relative', transform: `translateY(${offset + ITEM_H}px)`, transition: dragging.current ? 'none' : 'transform 0.3s cubic-bezier(0.25,0.46,0.45,0.94)' }}>
            {RATINGS.map(r => {
              const diff = Math.abs(r - selected);
              return (
                <div key={r} style={{
                  height: ITEM_H, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'var(--mono)', fontWeight: 700,
                  fontSize: diff === 0 ? 80 : 44,
                  color: diff === 0 ? 'var(--amber)' : 'var(--paper)',
                  opacity: diff === 0 ? 1 : diff === 1 ? 0.3 : 0.08,
                }}>{String(r).padStart(2,'0')}</div>
              );
            })}
          </div>
        </div>

        {selected < 10 && <span style={{ fontFamily: 'var(--mono)', fontSize: 36, color: 'rgba(237,230,214,0.25)', fontWeight: 700 }}>{String(selected+1).padStart(2,'0')}</span>}
      </div>

      <button onClick={() => onRate(selected)} style={{
        marginTop: 40, background: accentColor, border: 'none', borderRadius: 10,
        padding: '14px 56px', color: 'white', fontFamily: 'var(--display)', fontSize: 24, letterSpacing: '1.5px',
        cursor: 'pointer',
      }}>RATE</button>
    </div>
  );
}
