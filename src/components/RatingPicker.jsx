import { useRef } from 'react';
import { ratingColor } from '../store';
import { useIsDesktop } from '../lib/useIsDesktop';
import { useDrum } from '../lib/useDrum';

const ITEM_H = 74;
const RATINGS = [1,2,3,4,5,6,7,8,9,10];
export default function RatingPicker({ film, onRate, onClose }) {
  const desktop = useIsDesktop();
  // Close on a click that both starts and ends on the free area (not after dragging the drum out)
  const downOnBackdrop = useRef(false);
  const init = film.rating ?? 7;
  // Shared drum physics (same as the Random category drum)
  const { offset, selected: idx, handlers } = useDrum({ count: RATINGS.length, itemH: ITEM_H, initialIndex: init - 1 });
  const selected = RATINGS[idx];

  const color = ratingColor(selected);

  return (
    <div style={{
      // Full-screen blur, same as the Random filter drum
      position: 'fixed', inset: 0,
      zIndex: 500, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
      animation: 'fadeIn 0.2s ease',
    }}
      onPointerDown={e => { downOnBackdrop.current = e.target === e.currentTarget; }}
      onClick={e => { if (downOnBackdrop.current && e.target === e.currentTarget) onClose(); }}
    >
      {!desktop && <button onClick={onClose} className="nav-solid" style={{ position: 'fixed', top: 'calc(60px + var(--top-shift))', right: 'max(22px, calc(50% - 193px))', width: 42, height: 42, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text)', fontSize: 16, border: 'none' }}>✕</button>}

      <div className="d-title" style={{ padding: '0 40px', marginBottom: 32 }}>{film.name}</div>

      <div
        style={{
          position: 'relative', width: 140, height: 220, overflow: 'hidden', cursor: 'grab', userSelect: 'none',
          borderRadius: 70,
          border: `4px solid ${color}`,
          background: `${color}26`,
          boxShadow: `0 0 60px 10px ${color}55`,
          transition: 'border-color 0.25s, background 0.25s, box-shadow 0.25s',
        }}
        {...handlers}
      >
        <div style={{ position: 'relative', transform: `translateY(${offset + ITEM_H}px)`, transition: 'none' }}>
          {RATINGS.map(r => {
            const diff = Math.abs(r - selected);
            const c = diff === 0 ? '#fff' : 'var(--text)';
            return (
              <div key={r} style={{ height: ITEM_H, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: diff === 0 ? 72 : 40, color: c, opacity: diff === 0 ? 1 : diff === 1 ? 0.4 : 0.15, letterSpacing: '-2px' }}>{r}</div>
            );
          })}
        </div>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.35) 0%, transparent 35%, transparent 65%, rgba(0,0,0,0.35) 100%)', pointerEvents: 'none' }}/>
      </div>

      <button className="d-btn primary" onClick={() => onRate(selected)} style={{ marginTop: 44, width: 254.5 }}>Оценить</button>
    </div>
  );
}
