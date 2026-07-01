import { useState, useEffect, useRef } from 'react';
import { getCategories } from '../store';

export default function RandPage() {
  const [cats, setCats] = useState([]);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState(null);
  const [count, setCount] = useState(null);
  const [selectedCat, setSelectedCat] = useState(null);
  const [showCats, setShowCats] = useState(false);

  useEffect(() => { setCats(getCategories()); }, []);

  const start = () => {
    if (spinning) return;
    setResult(null);
    setSpinning(true);
    let n = 9;
    setCount(n);
    const tick = () => {
      n -= 1;
      if (n >= 0) {
        setCount(n);
        setTimeout(tick, 220);
      } else {
        setSpinning(false);
        setCount(null);
        pick();
      }
    };
    setTimeout(tick, 220);
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

  const selCatObj = cats.find(c => c.id === selectedCat);

  return (
    <div style={{ height: '100dvh', background: 'var(--ink)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ padding: '52px 24px 0' }}>
        <div style={{ fontFamily: 'var(--display)', fontSize: 30, color: 'var(--paper)', letterSpacing: '2px' }}>RANDOM REEL</div>
        <div style={{ height: 2, width: 50, background: 'var(--amber)', marginTop: 8 }} />
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 28 }}>
        {/* Countdown circle — film leader style */}
        <div
          onClick={start}
          style={{
            width: 220, height: 220, borderRadius: '50%',
            border: '3px solid var(--paper-dim)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', position: 'relative',
            background: 'conic-gradient(from 0deg, var(--card) 0deg, var(--card) 350deg, var(--amber) 360deg)',
          }}
        >
          {/* Tick marks like a clock/leader */}
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} style={{
              position: 'absolute', width: 2, height: 12, background: 'rgba(237,230,214,0.3)',
              top: 8, left: '50%', transformOrigin: '1px 102px',
              transform: `rotate(${i * 30}deg)`,
            }} />
          ))}
          {spinning ? (
            <span style={{ fontFamily: 'var(--mono)', fontSize: 64, fontWeight: 700, color: 'var(--amber)' }}>{count}</span>
          ) : (
            <span style={{ fontFamily: 'var(--display)', fontSize: 26, color: 'var(--paper)', letterSpacing: '2px', textAlign: 'center' }}>
              TAP TO<br/>SPIN
            </span>
          )}
        </div>

        {/* Result */}
        <div style={{ minHeight: 60, textAlign: 'center', padding: '0 30px' }}>
          {result && (
            <>
              <div style={{ fontFamily: 'var(--display)', fontSize: 30, color: 'var(--paper)', letterSpacing: '1px', lineHeight: 1.1 }}>{result.film.name.toUpperCase()}</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 12, color: result.cat.color, marginTop: 8, letterSpacing: '1px' }}>{result.cat.name.toUpperCase()}</div>
            </>
          )}
          {!result && !spinning && cats.length === 0 && (
            <div style={{ color: 'var(--paper-dim)', fontSize: 14 }}>Сначала добавь категории на главной</div>
          )}
        </div>
      </div>

      {/* Reel filter */}
      <div style={{ padding: '0 24px 110px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
        {showCats ? (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
            <button onClick={() => setSelectedCat(null)} style={{
              fontFamily: 'var(--mono)', fontSize: 12, padding: '8px 16px', borderRadius: 8,
              border: `1px solid ${!selectedCat ? 'var(--amber)' : 'rgba(237,230,214,0.2)'}`,
              background: !selectedCat ? 'rgba(217,142,44,0.15)' : 'transparent',
              color: !selectedCat ? 'var(--amber)' : 'var(--paper-dim)', cursor: 'pointer',
            }}>ALL</button>
            {cats.map(c => (
              <button key={c.id} onClick={() => setSelectedCat(c.id)} style={{
                fontFamily: 'var(--mono)', fontSize: 12, padding: '8px 16px', borderRadius: 8,
                border: `1px solid ${selectedCat === c.id ? c.color : 'rgba(237,230,214,0.2)'}`,
                background: selectedCat === c.id ? `${c.color}25` : 'transparent',
                color: selectedCat === c.id ? c.color : 'var(--paper-dim)', cursor: 'pointer',
              }}>{c.name.toUpperCase()}</button>
            ))}
          </div>
        ) : (
          cats.length > 0 && (
            <button onClick={() => setShowCats(true)} style={{
              fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '1px',
              background: 'none', border: '1px dashed rgba(237,230,214,0.3)', borderRadius: 8,
              padding: '8px 18px', color: 'var(--paper-dim)', cursor: 'pointer',
            }}>FILTER REEL {selCatObj ? `· ${selCatObj.name.toUpperCase()}` : ''}</button>
          )
        )}
      </div>
    </div>
  );
}
