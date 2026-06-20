import { useState, useEffect, useRef } from 'react';
import { getCategories } from '../store';

export default function RandPage() {
  const [cats, setCats] = useState([]);
  const [bubbles, setBubbles] = useState([]);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState(null);
  const [showCats, setShowCats] = useState(false);
  const [selectedCat, setSelectedCat] = useState(null); // null = all
  const animRef = useRef([]);

  useEffect(() => {
    const c = getCategories();
    setCats(c);
    setBubbles(initBubbles(c));
  }, []);

  const initBubbles = (c) => {
    const maxF = Math.max(...c.map(x => x.films.length), 1);
    // Approximate positions from Figma screen 9
    const pos = [
      { x: 58, y: 42 }, { x: 77, y: 28 }, { x: 25, y: 38 },
      { x: 33, y: 64 }, { x: 63, y: 65 },
    ];
    return c.map((cat, i) => ({
      id: cat.id, color: cat.color, name: cat.name,
      size: 50 + (cat.films.length / maxF) * 80,
      x: (pos[i % pos.length].x) + (Math.random() - 0.5) * 8,
      y: (pos[i % pos.length].y) + (Math.random() - 0.5) * 8,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
    }));
  };

  const handlePress = () => {
    if (spinning) return;
    setResult(null);
    setSpinning(true);
    animRef.current.forEach(cancelAnimationFrame);
    let bubs = bubbles.map(b => ({ ...b, vx: (Math.random()-0.5)*3.5, vy: (Math.random()-0.5)*3.5 }));
    let start = null;
    const dur = 5000;
    const animate = (ts) => {
      if (!start) start = ts;
      const elapsed = ts - start;
      const speed = Math.max(0.05, 1 - (elapsed / dur) * 0.95);
      bubs = bubs.map(b => {
        let nx = b.x + b.vx * speed, ny = b.y + b.vy * speed;
        let nvx = b.vx, nvy = b.vy;
        if (nx < 8 || nx > 92) { nvx = -nvx; nx = Math.max(8, Math.min(92, nx)); }
        if (ny < 5 || ny > 82) { nvy = -nvy; ny = Math.max(5, Math.min(82, ny)); }
        return { ...b, x: nx, y: ny, vx: nvx, vy: nvy };
      });
      setBubbles([...bubs]);
      if (elapsed < dur) {
        animRef.current = [requestAnimationFrame(animate)];
      } else {
        setSpinning(false);
        pick();
      }
    };
    animRef.current = [requestAnimationFrame(animate)];
  };

  const pick = () => {
    const allCats = getCategories();
    let pool = [];
    if (selectedCat) {
      const c = allCats.find(x => x.id === selectedCat);
      if (c) c.films.forEach(f => pool.push({ film: f, cat: c }));
    } else {
      allCats.forEach(c => c.films.forEach(f => pool.push({ film: f, cat: c })));
    }
    if (pool.length > 0) setResult(pool[Math.floor(Math.random() * pool.length)]);
  };

  const toggleCat = (catId) => {
    setSelectedCat(prev => prev === catId ? null : catId);
  };

  const selCatObj = cats.find(c => c.id === selectedCat);

  return (
    <div className="rand-page">
      {/* Topbar */}
      <div className="rand-topbar">
        <button className="topbar-btn" style={{ background: '#D9D9D9', fontSize: 22 }}>+</button>
        <button className="topbar-btn" style={{ background: '#D9D9D9', fontSize: 20, fontWeight: 400 }}>AC</button>
      </div>

      {/* Bubbles */}
      <div className="rand-bubbles" onClick={handlePress}>
        {bubbles.map(b => (
          <div key={b.id} style={{
            position: 'absolute',
            left: `${b.x}%`, top: `${b.y}%`,
            width: b.size, height: b.size, borderRadius: '50%',
            background: b.color,
            transform: 'translate(-50%,-50%)',
            transition: spinning ? 'none' : 'left 1s ease, top 1s ease',
            boxShadow: `0 4px 20px ${b.color}44`,
          }} />
        ))}
        {bubbles.length === 0 && (
          <div style={{
            position: 'absolute', inset: 0, display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            flexDirection: 'column', gap: 12,
            color: 'rgba(255,255,255,0.3)', fontSize: 16, textAlign: 'center', padding: 40,
          }}>
            <div style={{ fontSize: 48 }}>🎬</div>
            <div>Добавь категории на главной</div>
          </div>
        )}
      </div>

      {/* Bottom area */}
      <div className="rand-bottom">
        {/* Result */}
        {result && (
          <div className="rand-result">{result.film.name}</div>
        )}
        {spinning && <div className="rand-hint">Выбираем...</div>}
        {!spinning && !result && bubbles.length > 0 && (
          <div className="rand-hint">Нажми на пузыри</div>
        )}

        {/* Category chips or Settings button */}
        {showCats ? (
          <div className="rand-cats">
            {cats.map(c => (
              <button key={c.id} className="rand-cat-chip" onClick={() => toggleCat(c.id)}
                style={{ background: selectedCat === c.id ? 'rgba(180,180,180,0.8)' : 'rgba(130,130,130,0.6)' }}>
                {c.name}
                {selectedCat === c.id && <span className="rand-chip-x">✕</span>}
              </button>
            ))}
          </div>
        ) : (
          cats.length > 0 && (
            <button className="rand-settings-btn" onClick={() => setShowCats(true)}>
              Settings
            </button>
          )
        )}

        {/* Selected category tag after result */}
        {result && selCatObj && (
          <button className="rand-cat-chip" onClick={() => setSelectedCat(null)}>
            {selCatObj.name} <span className="rand-chip-x">✕</span>
          </button>
        )}
      </div>
    </div>
  );
}
