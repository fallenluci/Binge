import { useState, useEffect, useRef } from 'react';
import { getCategories } from '../store';
import { posterUrl } from '../lib/posters';
import CategoryDrum from '../components/CategoryDrum';
import TopBar from '../components/TopBar';
import { useIsDesktop } from '../lib/useIsDesktop';

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

const ANIM_URL = '/dori-roll.webp';
const ANIM_MS = 7000; // length of the animation (plays once, 60 fps)

export default function RandPage({ onOpenCategory, onProfile, onRefresh, profile, refreshKey }) {
  const desktop = useIsDesktop();
  // Figma desktop: 375px mascot, 52px result title; phone keeps 220 / 38
  const CAT = desktop ? 375 : 220;
  const [cats, setCats] = useState(getCategories);
  const [phase, setPhase] = useState('idle'); // idle | playing | result
  const [result, setResult] = useState(null);
  const [showDrum, setShowDrum] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(0); // 0 = all categories
  const [imgOk, setImgOk] = useState(true);
  // Roll animation: an animated WebP with a real transparent background. Unlike a
  // transparent WebM (which Safari shows on black) it works on iPhone too. It's
  // loaded once as a blob; every roll gets a fresh object URL so it starts from frame 1.
  const [animSrc, setAnimSrc] = useState(null);
  const animBlob = useRef(null);
  const pendingResult = useRef(null);
  const safetyTimeout = useRef(null);

  useEffect(() => {
    const fresh = getCategories();
    setCats(fresh);
    setSelectedIdx(i => (i > fresh.length ? 0 : i)); // the chosen category may be gone
  }, [refreshKey]);

  const drumItems = [{ id: 'all', label: 'Все' }, ...cats.map(c => ({ id: c.id, label: c.name, color: c.color }))];
  const selectedCat = selectedIdx > 0 ? cats[selectedIdx - 1] : null;

  const pickFilm = () => {
    const allCats = getCategories();
    let pool = [];
    if (selectedCat) {
      const c = allCats.find(x => x.id === selectedCat.id);
      if (c) c.films.forEach(f => pool.push({ film: f, cat: c }));
    } else {
      // "Все" — only films that haven't been rated yet
      allCats.forEach(c => c.films.forEach(f => { if (f.rating == null) pool.push({ film: f, cat: c }); }))
    }
    return pool.length > 0 ? pool[Math.floor(Math.random() * pool.length)] : null;
  };

  const finish = () => {
    setPhase('result');
    setResult(pendingResult.current);
    clearTimeout(safetyTimeout.current);
  };

  useEffect(() => {
    let alive = true;
    fetch(ANIM_URL).then(r => (r.ok ? r.blob() : null)).then(b => { if (alive && b) animBlob.current = b; }).catch(() => {});
    return () => { alive = false; };
  }, []);
  // Free the last object URL when it's replaced or the page closes
  useEffect(() => () => { if (animSrc) URL.revokeObjectURL(animSrc); }, [animSrc]);

  const start = () => {
    if (phase === 'playing') return;
    pendingResult.current = pickFilm();
    setResult(null);
    setPhase('playing');
    setShowDrum(false);

    clearTimeout(safetyTimeout.current);
    if (animBlob.current) {
      setAnimSrc(URL.createObjectURL(animBlob.current));
      safetyTimeout.current = setTimeout(finish, ANIM_MS);
    } else {
      // Animation not loaded (offline / slow network) — fall back to a short reveal delay
      safetyTimeout.current = setTimeout(finish, 2200);
    }
  };

  useEffect(() => () => clearTimeout(safetyTimeout.current), []);

  const tapAgain = () => {
    setPhase('idle');
    setResult(null);
  };

  // Result with a poster: the poster takes Dori's place and tints the whole screen
  const poster = phase === 'result' && result?.film.poster ? result.film.poster : null;

  // Poster as tall as Dori, but on short desktop windows it shrinks so the result still fits
  const POSTER_H = desktop ? 'min(375px, 34dvh)' : `${CAT}px`;

  return (
    <div className="rand-frame dotted-bg">
      {/* Same header as Home — identical icons, working search */}
      <TopBar onOpenCategory={onOpenCategory} onProfile={onProfile} onRefresh={onRefresh} profile={profile} floatingResults />

      {/* Center content */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: desktop ? '11.5px 24px 0' : '0 24px', gap: desktop ? 0 : 28,
      }}>
        {/* Ambient glow behind the cat */}
        <div style={{
          position: 'absolute', width: desktop ? 545 : 320, height: desktop ? 545 : 320, borderRadius: '50%',
          background: `radial-gradient(circle, ${GLOW}aa 0%, ${GLOW}33 45%, transparent 72%)`,
          filter: 'blur(10px)',
          animation: phase === 'playing' ? 'rand-glow-pulse 1.1s ease-in-out infinite' : 'none',
          opacity: phase === 'playing' ? 1 : 0.6,
          transition: 'opacity 0.4s ease',
          pointerEvents: 'none',
        }} />

        {/* Cat button — img + video both stay mounted; we just toggle which is visible */}
        <button
          onClick={poster ? undefined : start}
          disabled={phase === 'playing'}
          style={{
            position: 'relative', width: CAT, height: poster ? POSTER_H : CAT, background: 'none', border: 'none',
            cursor: phase === 'playing' || poster ? 'default' : 'pointer', padding: 0,
            transition: 'transform 0.15s',
          }}
          onTouchStart={e => phase !== 'playing' && (e.currentTarget.style.transform = 'scale(0.96)')}
          onTouchEnd={e => (e.currentTarget.style.transform = 'scale(1)')}
        >
          {poster && (
            <img
              key={poster}
              src={posterUrl(poster, 'w500')}
              alt={result.film.name}
              style={{
                position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', height: '100%', aspectRatio: '2 / 3',
                objectFit: 'cover', borderRadius: desktop ? 24 : 16, boxShadow: '0 24px 60px rgba(0,0,0,0.6)',
                animation: 'fadeIn 0.6s ease',
              }}
            />
          )}
          {imgOk && !poster && (
            <img
              src="/dori2.png"
              alt="Dori"
              onError={() => setImgOk(false)}
              style={{
                position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain',
                display: phase === 'playing' && animSrc ? 'none' : 'block',
              }}
            />
          )}
          {!imgOk && phase !== 'playing' && !poster && <CatFace size={CAT} />}
          {phase === 'playing' && animSrc && (
            <img
              src={animSrc}
              alt=""
              aria-hidden="true"
              draggable="false"
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain' }}
            />
          )}
        </button>

        {/* Result: film name, category, actions */}
        {phase === 'result' && result && (
          <div style={{ textAlign: 'center', animation: 'fadeIn 0.6s ease', marginTop: desktop ? 22 : -6, width: '100%', maxWidth: desktop ? 520 : 360, position: 'relative' }}>
            <div style={{ fontSize: poster ? (desktop ? 40 : 28) : (desktop ? 52 : 38), fontWeight: 700, color: 'var(--text)', letterSpacing: '-1px', lineHeight: 1.15 }}>
              {result.film.name}
            </div>
            <div style={{ color: 'var(--text-dim)', fontSize: 14, fontWeight: 700, marginTop: 6 }}>
              {result.cat.name}{result.film.rating != null && ` · оценка ${result.film.rating}`}
            </div>
            <button type="button" className="d-btn primary" onClick={start} style={{ width: 200, margin: `${desktop ? 22 : 18}px auto 0` }}>Ещё раз</button>
          </div>
        )}
        {phase === 'result' && !result && (
          <div style={{ textAlign: 'center', color: 'var(--text-dim)', fontSize: 15 }} onClick={tapAgain}>
            {selectedCat ? 'В этой категории пока нет фильмов' : cats.some(c => c.films.length) ? 'Все фильмы уже оценены' : 'Пока нет фильмов'}
          </div>
        )}

        {/* Настроить button — opens the vertical category drum overlay */}
        <div style={{ minHeight: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: desktop ? 45.4 : 0 }}>
          {phase !== 'playing' && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setShowDrum(true); }}
              className="glass"
              style={{
                borderRadius: 999, padding: '12px 26px', border: 'none', cursor: 'pointer',
                fontSize: 15, fontWeight: 500, color: 'var(--text)',
              }}>Настроить {selectedCat ? `· ${selectedCat.name}` : ''}</button>
          )}
        </div>
      </div>

      {showDrum && (
        <CategoryDrum
          items={drumItems}
          selectedIndex={selectedIdx}
          onSelect={setSelectedIdx}
          onDone={() => setShowDrum(false)}
        />
      )}
    </div>
  );
}
