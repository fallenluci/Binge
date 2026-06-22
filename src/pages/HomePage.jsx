import { useState, useEffect, useRef } from 'react';
import { getCategories } from '../store';

// Darken a hex color by amount (0-1)
function darkenColor(hex, amount = 0.45) {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0,2), 16);
  const g = parseInt(h.substring(2,4), 16);
  const b = parseInt(h.substring(4,6), 16);
  const dr = Math.round(r * (1 - amount));
  const dg = Math.round(g * (1 - amount));
  const db = Math.round(b * (1 - amount));
  return `rgb(${dr},${dg},${db})`;
}

const DotBg = () => (
  <svg style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', zIndex: 0, pointerEvents: 'none' }}>
    <defs>
      <pattern id="dots" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
        <circle cx="2" cy="2" r="1.2" fill="rgba(150,150,150,0.5)" />
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#dots)" />
  </svg>
);

export default function HomePage({ onOpenCategory, refreshKey }) {
  const [cats, setCats] = useState([]);
  const scrollRef = useRef(null);

  useEffect(() => {
    setCats(getCategories());
  }, [refreshKey]);

  return (
    <div style={{ height: '100dvh', background: '#000', position: 'relative', overflow: 'hidden' }}>
      <DotBg />

      {/* Header */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '56px 20px 16px',
        background: 'linear-gradient(to bottom, #000 60%, transparent)',
        pointerEvents: 'none',
      }}>
        <span style={{
          fontSize: 36, fontWeight: 900, color: '#fff',
          fontFamily: "-apple-system, 'SF Pro Display', BlinkMacSystemFont, sans-serif",
          letterSpacing: '-1px',
        }}>Binge</span>
        <div style={{
          width: 40, height: 40, borderRadius: '50%', background: '#8B0000',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          pointerEvents: 'all',
        }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
            <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
          </svg>
        </div>
      </div>

      {/* Scroll container with snap */}
      <div
        ref={scrollRef}
        style={{
          height: '100dvh',
          overflowY: 'scroll',
          scrollSnapType: 'y mandatory',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
          position: 'relative',
          zIndex: 1,
          perspective: '1000px',
        }}
      >
        <style>{`
          div::-webkit-scrollbar { display: none; }
          @keyframes fadeSlideIn { from { opacity:0; transform: translateY(30px); } to { opacity:1; transform: translateY(0); } }
        `}</style>

        {/* Top padding so first card starts below header */}
        <div style={{ height: 110, scrollSnapAlign: 'none', flexShrink: 0 }} />

        {cats.length === 0 && (
          <div style={{ textAlign: 'center', padding: '80px 20px', color: 'rgba(255,255,255,0.4)' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🎬</div>
            <div style={{ fontSize: 17, fontWeight: 600, color: 'white', marginBottom: 8 }}>Нет категорий</div>
            <div style={{ fontSize: 15 }}>Нажми + чтобы добавить первую</div>
          </div>
        )}

        {cats.map((cat, idx) => {
          const isLast = idx === cats.length - 1;
          const dark = darkenColor(cat.color, 0.5);
          const preview = cat.films.slice(0, 3);

          return (
            <div
              key={cat.id}
              style={{
                scrollSnapAlign: 'start',
                padding: '0 12px',
                paddingBottom: isLast ? 120 : 0,
                position: 'relative',
              }}
            >
              <div
                onClick={() => onOpenCategory(cat.id)}
                style={{
                  width: '100%',
                  borderRadius: 28,
                  overflow: 'hidden',
                  cursor: 'pointer',
                  position: 'relative',
                  // 3D card effect — bottom edge pushed back
                  transformStyle: 'preserve-3d',
                  transform: 'perspective(800px) rotateX(2deg)',
                  transformOrigin: 'center bottom',
                  transition: 'transform 0.2s',
                  // Radial gradient: light center → dark edges
                  background: `radial-gradient(ellipse at 50% 40%, ${cat.color} 0%, ${dark} 100%)`,
                  marginBottom: isLast ? 0 : -80,
                  // Stack shadow
                  boxShadow: '0 20px 60px rgba(0,0,0,0.6), 0 4px 12px rgba(0,0,0,0.4)',
                  minHeight: 220,
                  paddingBottom: 24,
                }}
                onTouchStart={e => e.currentTarget.style.transform = 'perspective(800px) rotateX(2deg) scale(0.985)'}
                onTouchEnd={e => e.currentTarget.style.transform = 'perspective(800px) rotateX(2deg) scale(1)'}
              >
                {/* Category title */}
                <div style={{
                  padding: '24px 24px 16px',
                  fontSize: 40, fontWeight: 900, color: '#fff',
                  fontFamily: "-apple-system, 'SF Pro Display', BlinkMacSystemFont, sans-serif",
                  letterSpacing: '-0.5px', lineHeight: 1.1,
                }}>
                  {cat.name}
                </div>

                {/* Films list with fade at bottom */}
                <div style={{ position: 'relative', padding: '0 24px' }}>
                  {preview.map((f, i) => (
                    <div key={f.id} style={{
                      fontSize: 20, fontWeight: 900, color: '#fff',
                      fontFamily: "-apple-system, 'SF Pro Display', BlinkMacSystemFont, sans-serif",
                      lineHeight: 1.4, marginBottom: 2,
                    }}>{f.name}</div>
                  ))}
                  {cat.films.length === 0 && (
                    <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 16 }}>Нет фильмов</div>
                  )}
                  {/* Gradient fade at bottom — covers last 20% */}
                  {cat.films.length > 0 && (
                    <div style={{
                      position: 'absolute',
                      bottom: 0, left: 0, right: 0,
                      height: '60%',
                      background: `linear-gradient(to bottom, transparent 0%, ${dark} 100%)`,
                      pointerEvents: 'none',
                    }} />
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* Bottom padding */}
        <div style={{ height: 40 }} />
      </div>
    </div>
  );
}
