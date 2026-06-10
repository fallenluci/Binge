import { useState, useEffect, useRef } from 'react';
import { getCategories } from '../store';

export default function RandPage() {
  const [categories, setCategories] = useState([]);
  const [selectedCatIndex, setSelectedCatIndex] = useState(0); // 0 = all
  const [isSpinning, setIsSpinning] = useState(false);
  const [result, setResult] = useState(null);
  const [bubbles, setBubbles] = useState([]);
  const animFrames = useRef([]);

  useEffect(() => {
    const cats = getCategories();
    setCategories(cats);
    setBubbles(makeBubbles(cats));
  }, []);

  const makeBubbles = (cats) => {
    const maxFilms = Math.max(...cats.map(c => c.films.length), 1);
    return cats.map((cat, i) => {
      const size = 50 + (cat.films.length / maxFilms) * 90;
      return {
        id: cat.id,
        color: cat.color,
        name: cat.name,
        size,
        x: 20 + Math.random() * 60,
        y: 15 + Math.random() * 55,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
      };
    });
  };

  const spinBubbles = () => {
    let start = null;
    const duration = 5000;
    let bubs = bubbles.map(b => ({
      ...b,
      vx: (Math.random() - 0.5) * 2,
      vy: (Math.random() - 0.5) * 2,
    }));

    const animate = (ts) => {
      if (!start) start = ts;
      const elapsed = ts - start;
      const progress = elapsed / duration;
      const speed = Math.max(0.1, 1 - progress * 0.8);

      bubs = bubs.map(b => {
        let nx = b.x + b.vx * speed;
        let ny = b.y + b.vy * speed;
        let nvx = b.vx;
        let nvy = b.vy;
        if (nx < 5 || nx > 90) { nvx = -nvx; nx = Math.max(5, Math.min(90, nx)); }
        if (ny < 5 || ny > 80) { nvy = -nvy; ny = Math.max(5, Math.min(80, ny)); }
        return { ...b, x: nx, y: ny, vx: nvx, vy: nvy };
      });
      setBubbles([...bubs]);

      if (elapsed < duration) {
        animFrames.current.push(requestAnimationFrame(animate));
      } else {
        setIsSpinning(false);
        pickRandom();
      }
    };
    animFrames.current.push(requestAnimationFrame(animate));
  };

  const pickRandom = () => {
    const cats = getCategories();
    let pool = [];
    if (selectedCatIndex === 0) {
      cats.forEach(c => c.films.forEach(f => pool.push({ film: f, cat: c })));
    } else {
      const cat = cats[selectedCatIndex - 1];
      if (cat) cat.films.forEach(f => pool.push({ film: f, cat }));
    }
    if (pool.length === 0) return;
    const pick = pool[Math.floor(Math.random() * pool.length)];
    setResult(pick);
  };

  const handleBubblePress = () => {
    if (isSpinning) return;
    setResult(null);
    setIsSpinning(true);
    spinBubbles();
  };

  // Picker state
  const pickerRef = useRef(null);
  const startY = useRef(0);
  const isDragging = useRef(false);
  const [pickerOffset, setPickerOffset] = useState(0);
  const currentOffset = useRef(0);
  const PICKER_ITEM_H = 48;
  const pickerItems = ['Все категории', ...categories.map(c => c.name)];

  const snapPicker = (raw) => {
    const idx = Math.round(-raw / PICKER_ITEM_H);
    const clamped = Math.max(0, Math.min(pickerItems.length - 1, idx));
    setSelectedCatIndex(clamped);
    const snapped = -clamped * PICKER_ITEM_H;
    setPickerOffset(snapped);
    currentOffset.current = snapped;
  };

  return (
    <div style={{
      height: '100dvh',
      background: '#0a0a0a',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      overflow: 'hidden',
      paddingBottom: 100,
    }}>
      {/* Bubbles area */}
      <div
        style={{ flex: 1, position: 'relative', cursor: 'pointer' }}
        onClick={handleBubblePress}
      >
        {bubbles.map(b => (
          <div
            key={b.id}
            style={{
              position: 'absolute',
              left: `${b.x}%`,
              top: `${b.y}%`,
              width: b.size,
              height: b.size,
              borderRadius: '50%',
              background: b.color,
              transform: 'translate(-50%, -50%)',
              transition: isSpinning ? 'none' : 'left 0.5s ease, top 0.5s ease',
              boxShadow: `0 4px 24px ${b.color}55`,
            }}
          />
        ))}
        {bubbles.length === 0 && (
          <div style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'rgba(255,255,255,0.3)',
            fontSize: 16,
            flexDirection: 'column',
            gap: 12,
          }}>
            <div style={{ fontSize: 48 }}>🎬</div>
            <div>Добавь категории на главной</div>
          </div>
        )}
      </div>

      {/* Result */}
      {result && (
        <div style={{
          textAlign: 'center',
          padding: '12px 24px',
          animation: 'popIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}>
          <div style={{ color: 'white', fontSize: 22, fontWeight: 800, letterSpacing: '-0.5px' }}>
            {result.film.name}
          </div>
          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, marginTop: 4 }}>
            {result.cat.name}
          </div>
        </div>
      )}

      {/* Hint when idle */}
      {!result && !isSpinning && bubbles.length > 0 && (
        <div style={{
          textAlign: 'center',
          color: 'rgba(255,255,255,0.3)',
          fontSize: 14,
          padding: '8px 0',
        }}>
          Нажми на пузыри чтобы выбрать фильм
        </div>
      )}

      {isSpinning && (
        <div style={{
          textAlign: 'center',
          color: 'rgba(255,255,255,0.5)',
          fontSize: 15,
          padding: '8px 0',
          animation: 'fadeIn 0.3s ease',
        }}>
          Выбираем...
        </div>
      )}

      {/* Category picker */}
      {categories.length > 0 && (
        <div style={{
          height: PICKER_ITEM_H * 3,
          overflow: 'hidden',
          position: 'relative',
          marginBottom: 8,
        }}>
          {/* Selected highlight */}
          <div style={{
            position: 'absolute',
            top: PICKER_ITEM_H,
            left: 16,
            right: 16,
            height: PICKER_ITEM_H,
            background: 'rgba(255,255,255,0.1)',
            borderRadius: 12,
            pointerEvents: 'none',
            zIndex: 1,
          }} />

          <div
            ref={pickerRef}
            style={{
              transform: `translateY(${pickerOffset + PICKER_ITEM_H}px)`,
              transition: isDragging.current ? 'none' : 'transform 0.3s ease',
              cursor: 'grab',
            }}
            onTouchStart={(e) => { startY.current = e.touches[0].clientY; isDragging.current = true; }}
            onTouchMove={(e) => {
              if (!isDragging.current) return;
              const dy = e.touches[0].clientY - startY.current;
              const raw = currentOffset.current + dy;
              const min = -(pickerItems.length - 1) * PICKER_ITEM_H;
              setPickerOffset(Math.max(min, Math.min(0, raw)));
            }}
            onTouchEnd={(e) => {
              isDragging.current = false;
              const dy = e.changedTouches[0].clientY - startY.current;
              snapPicker(currentOffset.current + dy);
            }}
            onMouseDown={(e) => { startY.current = e.clientY; isDragging.current = true; }}
            onMouseMove={(e) => {
              if (!isDragging.current) return;
              const dy = e.clientY - startY.current;
              const raw = currentOffset.current + dy;
              const min = -(pickerItems.length - 1) * PICKER_ITEM_H;
              setPickerOffset(Math.max(min, Math.min(0, raw)));
            }}
            onMouseUp={(e) => {
              isDragging.current = false;
              snapPicker(currentOffset.current + (e.clientY - startY.current));
            }}
          >
            {pickerItems.map((item, idx) => {
              const diff = Math.abs(idx - selectedCatIndex);
              return (
                <div
                  key={idx}
                  style={{
                    height: PICKER_ITEM_H,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: diff === 0 ? 17 : 15,
                    fontWeight: diff === 0 ? 700 : 400,
                    color: diff === 0 ? 'white' : 'rgba(255,255,255,0.35)',
                    transition: 'all 0.2s',
                    userSelect: 'none',
                  }}
                >
                  {item}
                </div>
              );
            })}
          </div>

          {/* Fade */}
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to bottom, #0a0a0a 0%, transparent 35%, transparent 65%, #0a0a0a 100%)',
            pointerEvents: 'none',
            zIndex: 2,
          }} />
        </div>
      )}
    </div>
  );
}
