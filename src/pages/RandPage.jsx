import { useState, useEffect, useRef } from 'react';
import { getCategories } from '../store';

const PICKER_H = 45;

export default function RandPage() {
  const [categories, setCategories] = useState([]);
  const [bubbles, setBubbles] = useState([]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [result, setResult] = useState(null);
  const [selectedCatIdx, setSelectedCatIdx] = useState(0);
  const [pickerOffset, setPickerOffset] = useState(0);
  const curPickerOffset = useRef(0);
  const animRef = useRef([]);
  const startY = useRef(0);
  const dragging = useRef(false);

  useEffect(() => {
    const cats = getCategories();
    setCategories(cats);
    setBubbles(makeBubbles(cats));
  }, []);

  const makeBubbles = (cats) => {
    const maxF = Math.max(...cats.map(c => c.films.length), 1);
    // Positions from Figma frame 9 (approx, scaled to % of container)
    const positions = [
      { x: 58, y: 43 },  // big green
      { x: 78, y: 65 },  // small blue
      { x: 77, y: 27 },  // red
      { x: 28, y: 37 },  // purple
      { x: 35, y: 61 },  // yellow
    ];
    return cats.map((cat, i) => {
      const size = 46 + (cat.films.length / maxF) * 70;
      const pos = positions[i % positions.length];
      return {
        id: cat.id, color: cat.color, name: cat.name, size,
        x: pos.x + (Math.random() - 0.5) * 10,
        y: pos.y + (Math.random() - 0.5) * 10,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
      };
    });
  };

  const handleBubblePress = () => {
    if (isSpinning || bubbles.length === 0) return;
    setResult(null);
    setIsSpinning(true);
    let bubs = bubbles.map(b => ({
      ...b, vx: (Math.random()-0.5)*3, vy: (Math.random()-0.5)*3,
    }));
    let start = null;
    const duration = 5000;
    const animate = (ts) => {
      if (!start) start = ts;
      const elapsed = ts - start;
      const speed = Math.max(0.05, 1 - (elapsed / duration) * 0.95);
      bubs = bubs.map(b => {
        let nx = b.x + b.vx * speed;
        let ny = b.y + b.vy * speed;
        let nvx = b.vx, nvy = b.vy;
        if (nx < 5 || nx > 92) { nvx = -nvx; nx = Math.max(5, Math.min(92, nx)); }
        if (ny < 5 || ny > 85) { nvy = -nvy; ny = Math.max(5, Math.min(85, ny)); }
        return { ...b, x: nx, y: ny, vx: nvx, vy: nvy };
      });
      setBubbles([...bubs]);
      if (elapsed < duration) {
        animRef.current.push(requestAnimationFrame(animate));
      } else {
        setIsSpinning(false);
        // Pick random
        const cats = getCategories();
        let pool = [];
        if (selectedCatIdx === 0) {
          cats.forEach(c => c.films.forEach(f => pool.push({ film: f, cat: c })));
        } else {
          const cat = cats[selectedCatIdx - 1];
          if (cat) cat.films.forEach(f => pool.push({ film: f, cat }));
        }
        if (pool.length > 0) {
          setResult(pool[Math.floor(Math.random() * pool.length)]);
        }
      }
    };
    animRef.current.push(requestAnimationFrame(animate));
  };

  const pickerItems = ['Все', ...categories.map(c => c.name)];

  const snapPicker = (raw) => {
    const idx = Math.max(0, Math.min(pickerItems.length - 1, Math.round(-raw / PICKER_H)));
    setSelectedCatIdx(idx);
    const snapped = -(idx * PICKER_H);
    setPickerOffset(snapped);
    curPickerOffset.current = snapped;
  };

  return (
    <div className="rand-page">
      {/* Topbar */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '56px 20px 0', flexShrink: 0 }}>
        <div className="topbar-circle" style={{ background: 'rgba(255,255,255,0.15)', color: 'white', fontSize: 20 }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <line x1="4" y1="12" x2="20" y2="12" stroke="white" strokeWidth="3" strokeLinecap="round"/>
            <line x1="4" y1="6" x2="20" y2="6" stroke="white" strokeWidth="3" strokeLinecap="round"/>
          </svg>
        </div>
        <div className="topbar-circle" style={{ background: '#D9D9D9' }}>
          <span style={{ fontSize: 20, fontWeight: 400, color: '#000' }}>AC</span>
        </div>
      </div>

      {/* Bubbles */}
      <div className="rand-bubbles" onClick={handleBubblePress}>
        {bubbles.map(b => (
          <div key={b.id} style={{
            position: 'absolute',
            left: `${b.x}%`, top: `${b.y}%`,
            width: b.size, height: b.size,
            borderRadius: '50%',
            background: b.color,
            transform: 'translate(-50%, -50%)',
            boxShadow: `0 4px 24px ${b.color}66`,
            transition: isSpinning ? 'none' : 'left 0.8s ease, top 0.8s ease',
          }} />
        ))}
        {bubbles.length === 0 && (
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexDirection: 'column', gap: 12,
            color: 'rgba(255,255,255,0.3)', fontSize: 16, textAlign: 'center', padding: 40,
          }}>
            <div style={{ fontSize: 48 }}>🎬</div>
            <div>Добавь категории на главной</div>
          </div>
        )}
      </div>

      {/* Result */}
      {result && (
        <div className="rand-result">
          <div className="rand-result-name">{result.film.name}</div>
        </div>
      )}
      {!result && !isSpinning && bubbles.length > 0 && (
        <div className="rand-hint">Нажми чтобы выбрать фильм</div>
      )}
      {isSpinning && <div className="rand-hint">Выбираем...</div>}

      {/* Category picker drum */}
      {categories.length > 0 && (
        <div className="rand-picker" style={{ marginBottom: 90 }}>
          <div className="rand-picker-highlight" />
          <div
            style={{
              transform: `translateY(${pickerOffset + PICKER_H}px)`,
              transition: dragging.current ? 'none' : 'transform 0.3s ease',
              cursor: 'grab', userSelect: 'none',
            }}
            onTouchStart={e => { startY.current = e.touches[0].clientY; dragging.current = true; }}
            onTouchMove={e => {
              if (!dragging.current) return;
              const raw = curPickerOffset.current + (e.touches[0].clientY - startY.current);
              setPickerOffset(Math.max(-(pickerItems.length-1)*PICKER_H, Math.min(0, raw)));
            }}
            onTouchEnd={e => {
              dragging.current = false;
              snapPicker(curPickerOffset.current + (e.changedTouches[0].clientY - startY.current));
            }}
            onMouseDown={e => { startY.current = e.clientY; dragging.current = true; }}
            onMouseMove={e => {
              if (!dragging.current) return;
              const raw = curPickerOffset.current + (e.clientY - startY.current);
              setPickerOffset(Math.max(-(pickerItems.length-1)*PICKER_H, Math.min(0, raw)));
            }}
            onMouseUp={e => {
              dragging.current = false;
              snapPicker(curPickerOffset.current + (e.clientY - startY.current));
            }}
          >
            {pickerItems.map((item, idx) => {
              const diff = Math.abs(idx - selectedCatIdx);
              return (
                <div key={idx} style={{
                  height: PICKER_H,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: diff === 0 ? 16 : 14,
                  fontWeight: diff === 0 ? 860 : 400,
                  color: diff === 0 ? '#000' : 'rgba(255,255,255,0.35)',
                  transition: 'all 0.2s',
                  userSelect: 'none',
                }}>{item}</div>
              );
            })}
          </div>
          <div className="rand-picker-fade" />
        </div>
      )}
    </div>
  );
}
