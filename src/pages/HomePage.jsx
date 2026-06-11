import { useState, useEffect } from 'react';
import { getCategories } from '../store';

export default function HomePage({ onOpenCategory, refreshKey }) {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    setCategories(getCategories());
  }, [refreshKey]);

  return (
    <div className="page" style={{ paddingBottom: 120 }}>
      {/* Topbar */}
      <div className="topbar">
        <div className="topbar-circle" style={{ fontSize: 20, fontWeight: 400 }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <line x1="4" y1="12" x2="20" y2="12" stroke="black" strokeWidth="3.43" strokeLinecap="round"/>
            <line x1="4" y1="6" x2="20" y2="6" stroke="black" strokeWidth="3.43" strokeLinecap="round"/>
          </svg>
        </div>
        <div className="topbar-circle">
          <span style={{ fontSize: 20, fontWeight: 400 }}>AC</span>
        </div>
      </div>

      {/* Tiles */}
      <div style={{ padding: '16px 31px 0', display: 'flex', flexDirection: 'column', gap: 15 }}>
        {categories.length === 0 && (
          <div style={{ textAlign: 'center', padding: '80px 20px', color: 'rgba(0,0,0,0.35)', fontSize: 16 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🎬</div>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>Нет категорий</div>
            <div>Нажми + чтобы добавить первую категорию</div>
          </div>
        )}
        {categories.map(cat => (
          <CategoryTile key={cat.id} category={cat} onClick={() => onOpenCategory(cat.id)} />
        ))}
      </div>
    </div>
  );
}

function CategoryTile({ category, onClick }) {
  const { name, color, films } = category;
  const preview = films.slice(0, 3);

  return (
    <div
      className="tile"
      style={{ background: color }}
      onClick={onClick}
      onTouchStart={e => e.currentTarget.style.transform = 'scale(0.97)'}
      onTouchEnd={e => e.currentTarget.style.transform = 'scale(1)'}
    >
      <div className="tile-title">{name}</div>
      <div className="tile-films">
        {preview.map(f => f.name).join('\n') || 'Нет фильмов'}
      </div>
    </div>
  );
}
