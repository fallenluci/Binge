import { useState, useRef, useEffect } from 'react';

const ITEM_H = 74;
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
      position: 'fixed', inset: 0, maxWidth: 430, left: '50%', marginLeft: -215,
      zIndex: 500, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      background: `radial-gradient(ellipse at 50% 40%, ${accentColor}44 0%, rgba(0,0,0,0.92) 65%)`,
      backdropFilter: 'blur(40px)',
    }}>
      <button onClick={onClose} className="glass" style={{
        position: 'fixed', top: 60, right: 22, borderRadius: 16,
        width: 42, height: 42, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
        color: 'var(--text)', fontSize: 16, border: '1px solid rgba(255,255,255,0.15)',
      }}>✕</button>

      <div style={{ fontSize: 17, color: 'var(--text-dim)', textAlign: 'center', padding: '0 50px', marginBottom: 32, fontWeight: 500 }}>{film.name}</div>

      <div className="glass" style={{
        position: 'relative', width: 140, height: 200, overflow: 'hidden', cursor: 'grab', userSelect: 'none',
        borderRadius: 40, border: `1.5px solid ${accentColor}66`,
      }}
        onTouchStart={e => { startY.current = e.touches[0].clientY; dragging.current = true; }}
        onTouchMove={e => { if (!dragging.current) return; setOffset(Math.max(-9*ITEM_H, Math.min(0, cur.current + (e.touches[0].clientY - startY.current)))); }}
        onTouchEnd={e => { dragging.current = false; snap(cur.current + (e.changedTouches[0].clientY - startY.current)); }}
        onMouseDown={e => { startY.current = e.clientY; dragging.current = true; }}
      >
        <div style={{ position: 'relative', transform: `translateY(${offset + ITEM_H}px)`, transition: dragging.current ? 'none' : 'transform 0.32s cubic-bezier(0.25,0.46,0.45,0.94)' }}>
          {RATINGS.map(r => {
            const diff = Math.abs(r - selected);
            return (
              <div key={r} style={{
                height: ITEM_H, display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, fontSize: diff === 0 ? 72 : 40,
                color: diff === 0 ? accentColor : 'var(--text)',
                opacity: diff === 0 ? 1 : diff === 1 ? 0.35 : 0.1,
                letterSpacing: '-2px',
              }}>{r}</div>
            );
          })}
        </div>
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, transparent 35%, transparent 65%, rgba(0,0,0,0.5) 100%)',
          pointerEvents: 'none',
        }}/>
      </div>

      <button onClick={() => onRate(selected)} style={{
        marginTop: 44, background: accentColor, border: 'none', borderRadius: 100,
        padding: '16px 60px', color: 'white', fontSize: 18, fontWeight: 700,
        cursor: 'pointer', boxShadow: `0 8px 30px ${accentColor}66`,
      }}>Оценить</button>
    </div>
  );
}
