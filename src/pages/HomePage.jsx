import { useState, useEffect } from 'react';
import { getCategories } from '../store';

export default function HomePage({ onOpenCategory, refreshKey }) {
  const [cats, setCats] = useState([]);
  useEffect(() => { setCats(getCategories()); }, [refreshKey]);

  return (
    <div className="page dotted-bg" style={{ paddingBottom: 140 }}>
      {/* Header */}
      <div style={{ padding: '80px 24px 32px' }}>
        <div style={{ fontSize: 44, fontWeight: 700, color: 'var(--text)', letterSpacing: '-1.5px', lineHeight: 1.05 }}>
          Binge.
        </div>
        <div style={{ fontSize: 19, fontWeight: 400, color: 'var(--text-dim)', marginTop: 8, letterSpacing: '-0.3px' }}>
          Твоя коллекция. Красиво.
        </div>
      </div>

      <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {cats.length === 0 && (
          <div className="glass" style={{ borderRadius: 28, padding: '60px 24px', textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🎬</div>
            <div style={{ fontSize: 20, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>Пока пусто</div>
            <div style={{ fontSize: 15, color: 'var(--text-dim)' }}>Нажми + чтобы добавить категорию</div>
          </div>
        )}

        {cats.map(cat => (
          <div
            key={cat.id}
            onClick={() => onOpenCategory(cat.id)}
            style={{
              borderRadius: 28,
              overflow: 'hidden',
              cursor: 'pointer',
              position: 'relative',
              height: 160,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'transform 0.2s cubic-bezier(0.25,0.46,0.45,0.94)',
              background: cat.image
                ? `url(${cat.image}) center/cover no-repeat`
                : cat.color,
              border: '1px solid rgba(255,255,255,0.1)',
            }}
            onTouchStart={e => e.currentTarget.style.transform = 'scale(0.97)'}
            onTouchEnd={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            {/* Dark overlay so text stays readable, especially on photos */}
            <div style={{
              position: 'absolute', inset: 0,
              background: cat.image
                ? 'rgba(0,0,0,0.4)'
                : 'linear-gradient(to bottom, rgba(0,0,0,0.05), rgba(0,0,0,0.25))',
            }} />
            <span style={{
              position: 'relative', zIndex: 1,
              fontSize: 28, fontWeight: 700, color: '#fff',
              letterSpacing: '-0.5px', textAlign: 'center', padding: '0 20px',
              textShadow: '0 2px 12px rgba(0,0,0,0.4)',
            }}>{cat.name}</span>

            {/* Film count badge */}
            <div style={{
              position: 'absolute', top: 14, right: 14, zIndex: 1,
              width: 30, height: 30, borderRadius: '50%',
              background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(10px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 700, color: '#fff',
            }}>{cat.films.length}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
