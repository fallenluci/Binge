import { useState, useEffect } from 'react';
import { getCategories } from '../store';
import TopBar from '../components/TopBar';

export default function HomePage({ onOpenCategory, onProfile, profile, refreshKey }) {
  const [cats, setCats] = useState([]);

  useEffect(() => { setCats(getCategories()); }, [refreshKey]);

  return (
    <div className="page dotted-bg" style={{ paddingBottom: 140 }}>
      <TopBar onOpenCategory={onOpenCategory} onProfile={onProfile} profile={profile} />

      <div style={{ padding: '20px 16px 0', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {cats.length === 0 && (
          <div className="glass" style={{ borderRadius: 28, padding: '60px 24px', textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🎬</div>
            <div style={{ fontSize: 20, fontWeight: 500, color: 'var(--text)', marginBottom: 6 }}>Пока пусто</div>
            <div style={{ fontSize: 15, color: 'var(--text-dim)' }}>Нажми + чтобы добавить категорию</div>
          </div>
        )}

        {cats.map(cat => {
          const pos = cat.imagePosition || { x: 50, y: 50, scale: 100 };
          const scale = pos.scale ?? 100;
          return (
            <div
              key={cat.id}
              onClick={() => onOpenCategory(cat.id)}
              style={{
                cursor: 'pointer',
                height: 160,
                borderRadius: 28,
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                transition: 'transform 0.2s cubic-bezier(0.25,0.46,0.45,0.94)',
                background: cat.image
                  ? `url(${cat.image}) ${pos.x}% ${pos.y}%/${scale}% no-repeat`
                  : cat.color,
              }}
              onTouchStart={e => e.currentTarget.style.transform = 'scale(0.97)'}
              onTouchEnd={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              <div style={{
                position: 'absolute', inset: 0,
                background: cat.image ? 'rgba(0,0,0,0.4)' : 'linear-gradient(to bottom, rgba(0,0,0,0.05), rgba(0,0,0,0.25))',
              }} />
              <span style={{
                position: 'relative', zIndex: 1, fontSize: 28, fontWeight: 700, color: '#fff',
                letterSpacing: '-0.5px', textAlign: 'center', padding: '0 20px',
                textShadow: '0 2px 12px rgba(0,0,0,0.4)',
              }}>{cat.name}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
