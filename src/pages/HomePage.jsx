import { useState, useEffect } from 'react';
import { getCategories } from '../store';

export default function HomePage({ onOpenCategory, refreshKey }) {
  const [cats, setCats] = useState([]);
  useEffect(() => { setCats(getCategories()); }, [refreshKey]);

  return (
    <div className="page" style={{
      background: 'radial-gradient(ellipse at 30% 0%, #1a1a2e 0%, #000 55%)',
      paddingBottom: 140,
    }}>
      {/* Hero header, Apple style */}
      <div style={{ padding: '80px 24px 40px' }}>
        <div style={{
          fontSize: 44, fontWeight: 700, color: 'var(--text)',
          letterSpacing: '-1.5px', lineHeight: 1.05,
        }}>Binge.</div>
        <div style={{
          fontSize: 19, fontWeight: 400, color: 'var(--text-dim)',
          marginTop: 8, letterSpacing: '-0.3px',
        }}>Твоя коллекция. Красиво.</div>
      </div>

      <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {cats.length === 0 && (
          <div className="glass" style={{
            borderRadius: 28, padding: '60px 24px', textAlign: 'center',
          }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🎬</div>
            <div style={{ fontSize: 20, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>Пока пусто</div>
            <div style={{ fontSize: 15, color: 'var(--text-dim)' }}>Нажми + чтобы добавить категорию</div>
          </div>
        )}

        {cats.map(cat => {
          const preview = cat.films.slice(0, 3);
          return (
            <div
              key={cat.id}
              className="glass"
              onClick={() => onOpenCategory(cat.id)}
              style={{
                borderRadius: 28,
                overflow: 'hidden',
                cursor: 'pointer',
                position: 'relative',
                transition: 'transform 0.2s cubic-bezier(0.25,0.46,0.45,0.94)',
              }}
              onTouchStart={e => e.currentTarget.style.transform = 'scale(0.98)'}
              onTouchEnd={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              {/* Color glow behind glass */}
              <div style={{
                position: 'absolute', inset: 0, zIndex: -1,
                background: `radial-gradient(circle at 20% 20%, ${cat.color}55, transparent 70%)`,
              }} />

              <div style={{ padding: '24px 24px 22px', position: 'relative' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                  <span style={{
                    fontSize: 26, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.5px',
                  }}>{cat.name}</span>
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%',
                    background: `${cat.color}30`, border: `1px solid ${cat.color}60`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: 700, color: cat.color, flexShrink: 0,
                  }}>{cat.films.length}</div>
                </div>

                {preview.map((f, i) => (
                  <div key={f.id} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '9px 0',
                    borderTop: i === 0 ? 'none' : '1px solid rgba(255,255,255,0.08)',
                  }}>
                    <span style={{
                      fontSize: 16, fontWeight: 500, color: 'var(--text)',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1,
                    }}>{f.name}</span>
                    {f.rating !== null && (
                      <span style={{
                        fontSize: 13, fontWeight: 700, color: cat.color,
                        background: `${cat.color}22`, borderRadius: 20,
                        padding: '3px 10px', marginLeft: 10, flexShrink: 0,
                      }}>{f.rating}</span>
                    )}
                  </div>
                ))}
                {cat.films.length === 0 && (
                  <div style={{ color: 'var(--text-dim)', fontSize: 15, padding: '9px 0' }}>Нет фильмов</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
