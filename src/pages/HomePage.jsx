import { useState, useEffect } from 'react';
import { getCategories } from '../store';

export default function HomePage({ onOpenCategory, refreshKey }) {
  const [cats, setCats] = useState([]);
  useEffect(() => { setCats(getCategories()); }, [refreshKey]);

  return (
    <div className="page" style={{ paddingBottom: 120 }}>
      <div className="topbar">
        <button className="topbar-btn" style={{ fontSize: 22, fontWeight: 300 }}>+</button>
        <button className="topbar-btn" style={{ fontSize: 20, fontWeight: 400 }}>AC</button>
      </div>
      <div style={{ padding: '16px 31px 0', display: 'flex', flexDirection: 'column', gap: 15 }}>
        {cats.length === 0 && (
          <div style={{ textAlign: 'center', padding: '80px 0', color: 'rgba(0,0,0,0.35)' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🎬</div>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>Нет категорий</div>
            <div style={{ fontSize: 15 }}>Нажми + чтобы добавить первую</div>
          </div>
        )}
        {cats.map(cat => (
          <div key={cat.id} className="tile" style={{ background: cat.color }} onClick={() => onOpenCategory(cat.id)}
            onTouchStart={e => e.currentTarget.style.transform='scale(0.97)'}
            onTouchEnd={e => e.currentTarget.style.transform='scale(1)'}
          >
            <div className="tile-title">{cat.name}</div>
            {cat.films.slice(0, 3).map((f, i) => (
              <div key={f.id} className={`tile-film${i === 2 && cat.films.length >= 3 ? ' blurred' : ''}`}>
                {f.name}
              </div>
            ))}
            {cat.films.length === 0 && <div className="tile-film" style={{ opacity: 0.6 }}>Нет фильмов</div>}
          </div>
        ))}
      </div>
    </div>
  );
}
