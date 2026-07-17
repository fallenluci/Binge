import { useState, useRef, useEffect } from 'react';
import { ratingColor } from '../store';

const ITEM_H = 74;
const RATINGS = [1,2,3,4,5,6,7,8,9,10];
const FRICTION = 0.94; // per-frame velocity decay
const MIN_VELOCITY = 0.02; // px/ms below which we stop and snap

export default function RatingPicker({ film, onRate, onClose }) {
  const init = film.rating ?? 7;
  const [selected, setSelected] = useState(init);
  const [offset, setOffset] = useState(-(init - 1) * ITEM_H);
  const [isAnimating, setIsAnimating] = useState(false);

  const cur = useRef(-(init - 1) * ITEM_H);
  const startY = useRef(0);
  const startOffset = useRef(0);
  const dragging = useRef(false);
  const lastMove = useRef({ y: 0, t: 0 });
  const velocity = useRef(0); // px per ms
  const momentumFrame = useRef(null);

  const clamp = (v) => Math.max(-9 * ITEM_H, Math.min(0, v));

  const updateSelectedFromOffset = (o) => {
    const idx = Math.max(0, Math.min(9, Math.round(-o / ITEM_H)));
    setSelected(RATINGS[idx]);
  };

  const snapTo = (o) => {
    const idx = Math.max(0, Math.min(9, Math.round(-o / ITEM_H)));
    const target = -idx * ITEM_H;
    setSelected(RATINGS[idx]);
    animateTo(target);
  };

  // Smooth spring-like settle animation towards a target offset
  const animateTo = (target) => {
    cancelMomentum();
    setIsAnimating(true);
    const start = cur.current;
    const startTime = performance.now();
    const duration = 380;
    const step = (now) => {
      const t = Math.min(1, (now - startTime) / duration);
      // ease-out-back-ish curve for a tactile snap feel
      const eased = 1 - Math.pow(1 - t, 3);
      const val = start + (target - start) * eased;
      cur.current = val;
      setOffset(val);
      if (t < 1) {
        momentumFrame.current = requestAnimationFrame(step);
      } else {
        cur.current = target;
        setOffset(target);
        setIsAnimating(false);
      }
    };
    momentumFrame.current = requestAnimationFrame(step);
  };

  const cancelMomentum = () => {
    if (momentumFrame.current) cancelAnimationFrame(momentumFrame.current);
  };

  const runMomentum = () => {
    cancelMomentum();
    const step = () => {
      velocity.current *= FRICTION;
      if (Math.abs(velocity.current) < MIN_VELOCITY) {
        snapTo(cur.current);
        return;
      }
      let next = cur.current + velocity.current * 16; // approx ms per frame
      if (next > 0 || next < -9 * ITEM_H) {
        // hit bounds — stop momentum and snap back
        next = clamp(next);
        cur.current = next;
        setOffset(next);
        updateSelectedFromOffset(next);
        snapTo(next);
        return;
      }
      cur.current = next;
      setOffset(next);
      updateSelectedFromOffset(next);
      momentumFrame.current = requestAnimationFrame(step);
    };
    momentumFrame.current = requestAnimationFrame(step);
  };

  const handleStart = (clientY) => {
    cancelMomentum();
    setIsAnimating(false);
    dragging.current = true;
    startY.current = clientY;
    startOffset.current = cur.current;
    lastMove.current = { y: clientY, t: performance.now() };
    velocity.current = 0;
  };

  const handleMove = (clientY) => {
    if (!dragging.current) return;
    const now = performance.now();
    const dy = clientY - startY.current;
    const next = clamp(startOffset.current + dy);
    cur.current = next;
    setOffset(next);
    updateSelectedFromOffset(next);

    const dt = now - lastMove.current.t;
    if (dt > 0) {
      const instV = (clientY - lastMove.current.y) / dt;
      // smooth velocity a bit
      velocity.current = velocity.current * 0.7 + instV * 0.3;
    }
    lastMove.current = { y: clientY, t: now };
  };

  const handleEnd = () => {
    if (!dragging.current) return;
    dragging.current = false;
    if (Math.abs(velocity.current) > MIN_VELOCITY) {
      runMomentum();
    } else {
      snapTo(cur.current);
    }
  };

  useEffect(() => {
    const up = () => handleEnd();
    const mv = (e) => handleMove(e.clientY);
    window.addEventListener('mouseup', up);
    window.addEventListener('mousemove', mv);
    return () => {
      window.removeEventListener('mouseup', up);
      window.removeEventListener('mousemove', mv);
      cancelMomentum();
    };
  }, []);

  const color = ratingColor(selected);

  return (
    <div style={{
      position: 'fixed', inset: 0, maxWidth: 430, left: '50%', marginLeft: -215,
      zIndex: 500, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.96)', backdropFilter: 'blur(40px)',
    }}>
      <button onClick={onClose} className="nav-solid" style={{ position: 'fixed', top: 60, right: 22, width: 42, height: 42, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text)', fontSize: 16, border: 'none' }}>✕</button>

      <div style={{ fontSize: 17, color: 'var(--text-dim)', textAlign: 'center', padding: '0 50px', marginBottom: 32, fontWeight: 500 }}>{film.name}</div>

      <div
        className="nav-solid"
        style={{ position: 'relative', width: 140, height: 200, overflow: 'hidden', cursor: 'grab', userSelect: 'none', borderRadius: 40 }}
        onTouchStart={e => handleStart(e.touches[0].clientY)}
        onTouchMove={e => handleMove(e.touches[0].clientY)}
        onTouchEnd={handleEnd}
        onMouseDown={e => handleStart(e.clientY)}
      >
        <div style={{ position: 'relative', transform: `translateY(${offset + ITEM_H}px)`, transition: 'none' }}>
          {RATINGS.map(r => {
            const diff = Math.abs(r - selected);
            const c = diff === 0 ? color : 'var(--text)';
            return (
              <div key={r} style={{ height: ITEM_H, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: diff === 0 ? 72 : 40, color: c, opacity: diff === 0 ? 1 : diff === 1 ? 0.35 : 0.1, letterSpacing: '-2px' }}>{r}</div>
            );
          })}
        </div>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, transparent 35%, transparent 65%, rgba(0,0,0,0.5) 100%)', pointerEvents: 'none' }}/>
      </div>

      <button onClick={() => onRate(selected)} style={{ marginTop: 44, background: color, border: 'none', borderRadius: 100, padding: '16px 60px', color: 'white', fontSize: 18, fontWeight: 700, cursor: 'pointer', boxShadow: `0 8px 30px ${color}66`, transition: 'background 0.2s' }}>Оценить</button>
    </div>
  );
}
