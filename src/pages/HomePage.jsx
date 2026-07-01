import { useState, useEffect } from 'react';
import { getCategories } from '../store';

const Sprockets = () => (
  <div className="sprockets">
    {Array.from({ length: 16 }).map((_, i) => <span key={i} />)}
  </div>
);

export default function HomePage({ onOpenCategory, refreshKey }) {
  const [cats, setCats] = useState([]);
  useEffect(() => { setCats(getCategories()); }, [refreshKey]);

  return (
    <div className="page" style={{ paddingBottom: 130, background: 'var(--ink)' }}>
      {/* Header — marquee style */}
      <div style={{ padding: '52px 24px 18px' }}>
        <div style={{
          fontFamily: 'var(--display)', fontSize: 52, color: 'var(--paper)',
          letterSpacing: '4px', lineHeight: 1,
        }}>
          BINGE
        </div>
        <div style={{
          height: 3, width: 64, background: 'var(--safelight)', marginTop: 10,
        }} />
        <div style={{
          fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--paper-dim)',
          letterSpacing: '2px', marginTop: 10, textTransform: 'uppercase',
        }}>
          {cats.length} {cats.length === 1 ? 'reel' : 'reels'} loaded
        </div>
      </div>

      <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 18 }}>
        {cats.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--paper-dim)' }}>
            <div style={{ fontFamily: 'var(--display)', fontSize: 28, color: 'var(--paper)', letterSpacing: '2px', marginBottom: 8 }}>
              NO REELS YET
            </div>
            <div style={{ fontSize: 14 }}>Нажми + чтобы зарядить первую плёнку</div>
          </div>
        )}

        {cats.map(cat => {
          const preview = cat.films.slice(0, 4);
          return (
            <div
              key={cat.id}
              onClick={() => onOpenCategory(cat.id)}
              style={{
                background: 'var(--card)',
                borderRadius: 10,
                overflow: 'hidden',
                cursor: 'pointer',
                position: 'relative',
                border: '1px solid rgba(237,230,214,0.06)',
                transition: 'transform 0.15s',
              }}
              onTouchStart={e => e.currentTarget.style.transform = 'scale(0.98)'}
              onTouchEnd={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              <Sprockets />

              <div style={{ display: 'flex' }}>
                {/* Color accent spine */}
                <div style={{ width: 6, background: cat.color, flexShrink: 0 }} />

                <div style={{ flex: 1, padding: '14px 18px 18px' }}>
                  {/* Title row */}
                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 12 }}>
                    <span style={{
                      fontFamily: 'var(--display)', fontSize: 34, color: 'var(--paper)',
                      letterSpacing: '1.5px', lineHeight: 1,
                    }}>{cat.name.toUpperCase()}</span>
                    <span style={{
                      fontFamily: 'var(--mono)', fontSize: 12, color: cat.color, fontWeight: 700,
                    }}>
                      {String(cat.films.length).padStart(2, '0')}
                    </span>
                  </div>

                  {/* Film list */}
                  {preview.map((f, i) => (
                    <div key={f.id} style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '6px 0',
                      borderTop: i === 0 ? 'none' : '1px solid rgba(237,230,214,0.07)',
                    }}>
                      <span style={{
                        fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--paper-dim)', flexShrink: 0, width: 16,
                      }}>{String(i + 1).padStart(2, '0')}</span>
                      <span style={{
                        fontSize: 15, fontWeight: 500, color: 'var(--paper)', flex: 1,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>{f.name}</span>
                      {f.rating !== null && (
                        <span style={{
                          fontFamily: 'var(--mono)', fontSize: 12, fontWeight: 700,
                          color: 'var(--ink)', background: 'var(--amber)',
                          borderRadius: 4, padding: '1px 6px', flexShrink: 0,
                        }}>{String(f.rating).padStart(2, '0')}</span>
                      )}
                    </div>
                  ))}
                  {cat.films.length === 0 && (
                    <div style={{ color: 'var(--paper-dim)', fontSize: 14, padding: '6px 0' }}>Плёнка пуста</div>
                  )}
                  {cat.films.length > 4 && (
                    <div style={{
                      fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--paper-dim)',
                      marginTop: 8, letterSpacing: '1px',
                    }}>+ {cat.films.length - 4} more frames →</div>
                  )}
                </div>
              </div>

              <Sprockets />
            </div>
          );
        })}
      </div>
    </div>
  );
}
