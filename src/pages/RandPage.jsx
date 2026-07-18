import { useState, useEffect, useRef } from 'react';
import { getCategories } from '../store';

export default function RandPage() {
  const [cats, setCats] = useState([]);
  const [bubbles, setBubbles] = useState([]);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState(null);
  const [selectedCat, setSelectedCat] = useState(null);
  const [showCats, setShowCats] = useState(false);
  const animRef = useRef([]);

  useEffect(() => {
    const c = getCategories();
    setCats(c);
    setBubbles(initBubbles(c));
  }, []);

  const initBubbles = (c) => {
    const maxF = Math.max(...c.map(x => x.films.length), 1);
    const pos = [{x:52,y:38},{x:74,y:26},{x:26,y:34},{x:32,y:60},{x:66,y:62}];
    return c.map((cat, i) => ({
      id: cat.id, color: cat.color, name: cat.name,
      size: 56 + (cat.films.length / maxF) * 74,
      x: pos[i % pos.length].x + (Math.random()-0.5)*6,
      y: pos[i % pos.length].y + (Math.random()-0.5)*6,
      vx: (Math.random()-0.5)*0.4, vy: (Math.random()-0.5)*0.4,
    }));
  };

  const handlePress = () => {
    if (spinning || bubbles.length === 0) return;
    setResult(null); setSpinning(true);
    let bubs = bubbles.map(b => ({ ...b, vx: (Math.random()-0.5)*3, vy: (Math.random()-0.5)*3 }));
    let start = null; const dur = 4200;
    const animate = (ts) => {
      if (!start) start = ts;
      const elapsed = ts - start;
      const speed = Math.max(0.05, 1 - (elapsed/dur)*0.95);
      bubs = bubs.map(b => {
        let nx = b.x + b.vx*speed, ny = b.y + b.vy*speed;
        let nvx = b.vx, nvy = b.vy;
        if (nx < 10 || nx > 90) { nvx=-nvx; nx=Math.max(10,Math.min(90,nx)); }
        if (ny < 10 || ny > 80) { nvy=-nvy; ny=Math.max(10,Math.min(80,ny)); }
        return { ...b, x:nx, y:ny, vx:nvx, vy:nvy };
      });
      setBubbles([...bubs]);
      if (elapsed < dur) animRef.current = [requestAnimationFrame(animate)];
      else { setSpinning(false); pick(); }
    };
    animRef.current = [requestAnimationFrame(animate)];
  };

  const pick = () => {
    const allCats = getCategories();
    let pool = [];
    if (selectedCat) { const c = allCats.find(x=>x.id===selectedCat); if (c) c.films.forEach(f=>pool.push({film:f,cat:c})); }
    else allCats.forEach(c => c.films.forEach(f => pool.push({ film:f, cat:c })));
    if (pool.length > 0) setResult(pool[Math.floor(Math.random()*pool.length)]);
  };

  const selCatObj = cats.find(c => c.id === selectedCat);

  return (
    <div className="dotted-bg" style={{ height: '100dvh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ padding: '64px 24px 0' }}>
        <div style={{ fontSize: 32, fontWeight: 500, color: 'var(--text)', letterSpacing: '-1px' }}>Random</div>
        <div style={{ fontSize: 15, color: 'var(--text-dim)', marginTop: 4 }}>Не знаешь что посмотреть?</div>
      </div>

      <div style={{ flex: 1, position: 'relative', cursor: 'pointer' }} onClick={handlePress}>
        {bubbles.map(b => (
          <div key={b.id} className="glass" style={{
            position: 'absolute', left: `${b.x}%`, top: `${b.y}%`,
            width: b.size, height: b.size, borderRadius: '50%',
            transform: 'translate(-50%,-50%)',
            transition: spinning ? 'none' : 'left 0.8s ease, top 0.8s ease',
            background: `radial-gradient(circle at 35% 30%, ${b.color}, ${b.color}99)`,
            boxShadow: `0 8px 30px ${b.color}55`,
            border: '1px solid rgba(255,255,255,0.3)',
          }} />
        ))}
        {bubbles.length === 0 && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12, color: 'var(--text-dim)', textAlign: 'center', padding: 40 }}>
            <div style={{ fontSize: 40 }}>🎬</div>
            <div>Добавь категории на главной</div>
          </div>
        )}
      </div>

      <div style={{ padding: '0 24px 100px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
        {result && (
          <div className="glass" style={{ borderRadius: 24, padding: '20px 28px', textAlign: 'center', animation: 'popIn 0.4s cubic-bezier(0.34,1.4,0.64,1)', maxWidth: '100%' }}>
            <div style={{ fontSize: 22, fontWeight: 500, color: 'var(--text)' }}>{result.film.name}</div>
            <div style={{ fontSize: 13, color: result.cat.color, marginTop: 4, fontWeight: 700 }}>{result.cat.name}</div>
          </div>
        )}
        {spinning && <div style={{ color: 'var(--text-dim)', fontSize: 14 }}>Выбираем...</div>}
        {!spinning && !result && bubbles.length > 0 && <div style={{ color: 'var(--text-dim)', fontSize: 14 }}>Нажми на пузыри</div>}

        {showCats ? (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
            <button onClick={() => setSelectedCat(null)} className="glass" style={{ borderRadius: 100, padding: '9px 18px', fontSize: 13, fontWeight: 500, color: !selectedCat ? 'var(--accent)' : 'var(--text-dim)', border: 'none', cursor: 'pointer' }}>Все</button>
            {cats.map(c => (
              <button key={c.id} onClick={() => setSelectedCat(c.id)} className="glass" style={{ borderRadius: 100, padding: '9px 18px', fontSize: 13, fontWeight: 700, color: selectedCat === c.id ? c.color : 'var(--text-dim)', border: 'none', cursor: 'pointer' }}>{c.name}</button>
            ))}
          </div>
        ) : (
          cats.length > 0 && (
            <button onClick={() => setShowCats(true)} className="glass" style={{ borderRadius: 100, padding: '10px 22px', fontSize: 14, fontWeight: 500, color: 'var(--text)', border: 'none', cursor: 'pointer' }}>
              Настроить {selCatObj ? `· ${selCatObj.name}` : ''}
            </button>
          )
        )}
      </div>
    </div>
  );
}
