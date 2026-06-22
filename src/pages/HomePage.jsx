import { useState, useEffect } from 'react';
import { getCategories } from '../store';

// Dot pattern background
const DotBg = () => (
  <svg style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', zIndex: 0, pointerEvents: 'none' }}
    xmlns="http://www.w3.org/2000/svg">
    <defs>
      <pattern id="dots" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
        <circle cx="2" cy="2" r="1.5" fill="rgba(150,150,150,0.5)" />
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#dots)" />
  </svg>
);

export default function HomePage({ onOpenCategory, refreshKey, onAddFilm, onAddCat }) {
  const [cats, setCats] = useState([]);
  const [expanded, setExpanded] = useState({});

  useEffect(() => {
    const c = getCategories();
    setCats(c);
    // Last category expanded by default
    if (c.length > 0) {
      setExpanded({ [c[c.length - 1].id]: true });
    }
  }, [refreshKey]);

  const toggle = (id) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

  return (
    <div style={{ minHeight: '100dvh', background: '#000', position: 'relative', overflow: 'hidden' }}>
      <DotBg />

      {/* Header */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '56px 20px 16px',
        background: '#000',
      }}>
        <span style={{
          fontSize: 36, fontWeight: 900, color: '#fff',
          fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif",
          letterSpacing: '-1px',
        }}>Binge</span>
        <div style={{
          width: 40, height: 40, borderRadius: '50%',
          background: '#8B0000',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
            <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
          </svg>
        </div>
      </div>

      {/* Stack of tiles */}
      <div style={{ position: 'relative', zIndex: 1, padding: '0 0 140px' }}>
        {cats.length === 0 && (
          <div style={{ textAlign: 'center', padding: '80px 20px', color: 'rgba(255,255,255,0.4)' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🎬</div>
            <div style={{ fontSize: 17, fontWeight: 600, color: 'white', marginBottom: 8 }}>Нет категорий</div>
            <div style={{ fontSize: 15 }}>Нажми + чтобы добавить первую</div>
          </div>
        )}

        {cats.map((cat, idx) => {
          const isLast = idx === cats.length - 1;
          const isOpen = !!expanded[cat.id];
          const filmsToShow = isOpen ? (isLast ? 5 : cat.films.length) : 3;
          const shown = cat.films.slice(0, filmsToShow);

          return (
            <div key={cat.id}
              style={{
                background: cat.color,
                borderRadius: 28,
                marginBottom: isLast ? 0 : -20,
                position: 'relative',
                zIndex: idx + 1,
                overflow: 'hidden',
                transition: 'all 0.4s cubic-bezier(0.34,1.1,0.64,1)',
                cursor: 'pointer',
              }}
              onClick={() => onOpenCategory(cat.id)}
            >
              {/* Title row */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '22px 22px 8px',
              }}>
                <span style={{
                  fontSize: 40, fontWeight: 900, color: '#fff',
                  fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif",
                  letterSpacing: '-0.5px', lineHeight: 1.1,
                }}>{cat.name}</span>
                <button
                  onClick={e => { e.stopPropagation(); toggle(cat.id); }}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'rgba(255,255,255,0.8)', padding: '4px 8px',
                    transition: 'transform 0.3s',
                    transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                  }}
                >
                  <svg width="22" height="14" viewBox="0 0 22 14" fill="none">
                    <path d="M2 2L11 11L20 2" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>

              {/* Films */}
              <div style={{ padding: '4px 22px 22px', overflow: 'hidden' }}>
                {shown.map((f, i) => {
                  const isBlurred = !isOpen && i === shown.length - 1 && cat.films.length > 3;
                  return (
                    <div key={f.id} style={{
                      fontSize: 20, fontWeight: 900,
                      fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif",
                      color: isBlurred ? 'rgba(255,255,255,0.45)' : '#fff',
                      filter: isBlurred ? 'blur(3px)' : 'none',
                      lineHeight: 1.4,
                      marginBottom: 2,
                    }}>{f.name}</div>
                  );
                })}
                {cat.films.length === 0 && (
                  <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 16, fontWeight: 500 }}>
                    Нет фильмов
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
