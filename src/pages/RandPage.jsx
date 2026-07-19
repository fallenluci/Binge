import { useState, useEffect, useRef } from 'react';
import { getCategories } from '../store';
import CategoryDrum from '../components/CategoryDrum';

const GLOW = '#311C7E';

// Fallback cat artwork (used until dori2.png is present in /public, or if it fails to load)
const CatFace = ({ size = 220 }) => (
  <svg width={size} height={size} viewBox="0 0 220 220" fill="none">
    <defs>
      <radialGradient id="catGrad" cx="50%" cy="35%" r="70%">
        <stop offset="0%" stopColor="#6b4fd6" />
        <stop offset="100%" stopColor="#2a1a66" />
      </radialGradient>
      <filter id="catBlur" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="6" />
      </filter>
    </defs>
    <path d="M60 40 C40 40 30 70 34 100 C20 120 18 160 40 185 C60 205 90 210 110 210 C130 210 160 205 180 185 C202 160 200 120 186 100 C190 70 180 40 160 40 C145 40 138 65 130 85 C124 78 116 74 110 74 C104 74 96 78 90 85 C82 65 75 40 60 40 Z"
      fill="url(#catGrad)" filter="url(#catBlur)" opacity="0.95" />
    <path d="M60 40 C40 40 30 70 34 100 C20 120 18 160 40 185 C60 205 90 210 110 210 C130 210 160 205 180 185 C202 160 200 120 186 100 C190 70 180 40 160 40 C145 40 138 65 130 85 C124 78 116 74 110 74 C104 78 96 78 90 85 C82 65 75 40 60 40 Z"
      fill="url(#catGrad)" />
    <ellipse cx="80" cy="128" rx="24" ry="30" fill="#fff" />
    <ellipse cx="140" cy="128" rx="24" ry="30" fill="#fff" />
    <path d="M70 128 Q80 118 90 128 Q80 138 70 128 Z" fill={GLOW} />
    <path d="M130 128 Q140 118 150 128 Q140 138 130 128 Z" fill={GLOW} />
  </svg>
);

export default function RandPage({ onChangePage }) {
  const [cats, setCats] = useState([]);
  const [phase, setPhase] = useState('idle'); // idle | playing | result
  const [result, setResult] = useState(null);
  const [showDrum, setShowDrum] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(0); // 0 = all categories
  const [imgOk, setImgOk] = useState(true);
  const [videoOk, setVideoOk] = useState(true);
  const videoRef = useRef(null);
  const pendingResult = useRef(null);
  const safetyTimeout = useRef(null);

  useEffect(() => { setCats(getCategories()); }, []);

  const drumItems = [{ id: 'all', label: 'Все категории' }, ...cats.map(c => ({ id: c.id, label: c.name, color: c.color }))];
  const selectedCat = selectedIdx > 0 ? cats[selectedIdx - 1] : null;

  const pickFilm = () => {
    const allCats = getCategories();
    let pool = [];
    if (selectedCat) {
      const c = allCats.find(x => x.id === selectedCat.id);
      if (c) c.films.forEach(f => pool.push({ film: f, cat: c }));
    } else {
      allCats.forEach(c => c.films.forEach(f => pool.push({ film: f, cat: c })));
    }
    return pool.length > 0 ? pool[Math.floor(Math.random() * pool.length)] : null;
  };

  const finish = () => {
    setPhase('result');
    setResult(pendingResult.current);
    clearTimeout(safetyTimeout.current);
  };

  // Video element stays mounted permanently — we only toggle visibility and play/pause it,
  // matching the reference implementation that's confirmed to work reliably.
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onEnded = () => finish();
    const onErr = () => setVideoOk(false);
    v.addEventListener('ended', onEnded);
    v.addEventListener('error', onErr);
    return () => {
      v.removeEventListener('ended', onEnded);
      v.removeEventListener('error', onErr);
    };
  }, []);

  const start = () => {
    if (phase === 'playing') return;
    pendingResult.current = pickFilm();
    setResult(null);
    setPhase('playing');
    setShowDrum(false);

    const v = videoRef.current;
    if (v && videoOk) {
      v.currentTime = 0;
      v.play().catch(() => setVideoOk(false));
      // Safety net in case 'ended' never fires for some reason
      clearTimeout(safetyTimeout.current);
      safetyTimeout.current = setTimeout(finish, 9000);
    } else {
      // No video available — fall back to a fixed reveal delay
      clearTimeout(safetyTimeout.current);
      safetyTimeout.current = setTimeout(finish, 2200);
    }
  };

  useEffect(() => () => clearTimeout(safetyTimeout.current), []);

  const tapAgain = () => {
    setPhase('idle');
    setResult(null);
  };

  return (
    <div className="rand-frame dotted-bg">
      {/* Top bar — mirrors Home header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '56px 24px 0' }}>
        <div style={{ fontSize: 40, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.5px' }}>Dori</div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => onChangePage && onChangePage('home')} className="glass" style={{
            width: 42, height: 42, borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text)" strokeWidth="2.3" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          </button>
          <div className="glass" style={{
            width: 42, height: 42, borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="var(--text-dim)"><path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/></svg>
          </div>
        </div>
      </div>

      {/* Center content */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '0 24px', gap: 28,
      }}>
        {/* Ambient glow behind the cat */}
        <div style={{
          position: 'absolute', width: 320, height: 320, borderRadius: '50%',
          background: `radial-gradient(circle, ${GLOW}aa 0%, ${GLOW}33 45%, transparent 72%)`,
          filter: 'blur(10px)',
          animation: phase === 'playing' ? 'rand-glow-pulse 1.1s ease-in-out infinite' : 'none',
          opacity: phase === 'playing' ? 1 : 0.6,
          transition: 'opacity 0.4s ease',
          pointerEvents: 'none',
        }} />

        {/* Cat button — img + video both stay mounted; we just toggle which is visible */}
        <button
          onClick={start}
          disabled={phase === 'playing'}
          style={{
            position: 'relative', width: 220, height: 220, background: 'none', border: 'none',
            cursor: phase === 'playing' ? 'default' : 'pointer', padding: 0,
            transition: 'transform 0.15s',
          }}
          onTouchStart={e => phase !== 'playing' && (e.currentTarget.style.transform = 'scale(0.96)')}
          onTouchEnd={e => (e.currentTarget.style.transform = 'scale(1)')}
        >
          {imgOk && (
            <img
              src="/dori2.png"
              alt="Dori"
              onError={() => setImgOk(false)}
              style={{
                position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain',
                display: phase === 'playing' && videoOk ? 'none' : 'block',
              }}
            />
          )}
          {!imgOk && phase !== 'playing' && <CatFace size={220} />}
          {videoOk && (
            <video
              ref={videoRef}
              src="/dori2.webm"
              muted
              playsInline
              preload="auto"
              style={{
                position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain',
                mixBlendMode: 'screen',
                display: phase === 'playing' ? 'block' : 'none',
              }}
            />
          )}
        </button>

        {/* Result film name */}
        {phase === 'result' && result && (
          <div style={{ textAlign: 'center', animation: 'apple-reveal 0.7s cubic-bezier(0.22,1,0.36,1)' }} onClick={tapAgain}>
            <div style={{ fontSize: 38, fontWeight: 700, color: 'var(--text)', letterSpacing: '-1px', lineHeight: 1.15 }}>
              {result.film.name}
            </div>
          </div>
        )}
        {phase === 'result' && !result && (
          <div style={{ textAlign: 'center', color: 'var(--text-dim)', fontSize: 15 }} onClick={tapAgain}>
            В этой категории пока нет фильмов
          </div>
        )}

        {/* Настроить button / horizontal drum */}
        <div style={{ minHeight: 64, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {showDrum ? (
            <CategoryDrum items={drumItems} selectedIndex={selectedIdx} onSelect={setSelectedIdx} />
          ) : (
            phase !== 'playing' && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setShowDrum(true); }}
                className="glass"
                style={{
                  borderRadius: 999, padding: '12px 26px', border: 'none', cursor: 'pointer',
                  fontSize: 15, fontWeight: 500, color: 'var(--text)',
                }}>Настроить</button>
            )
          )}
        </div>
      </div>
    </div>
  );
}
