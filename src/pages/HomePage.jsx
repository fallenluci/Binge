import { useState, useEffect } from 'react';
import { getCategories, deleteCategory, updateCategory } from '../store';

export default function HomePage({ onOpenCategory, onRefresh, refreshKey }) {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    setCategories(getCategories());
  }, [refreshKey]);

  return (
    <div className="page" style={{ paddingBottom: 120 }}>
      <div style={{ padding: '0 20px', paddingTop: 8 }}>
        {categories.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '80px 20px',
            color: 'rgba(0,0,0,0.35)',
            fontSize: 16
          }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🎬</div>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>Нет категорий</div>
            <div>Нажми + чтобы добавить первую категорию</div>
          </div>
        )}
        {categories.map((cat, i) => (
          <CategoryTile
            key={cat.id}
            category={cat}
            onClick={() => onOpenCategory(cat.id)}
          />
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
      onClick={onClick}
      style={{
        background: color,
        borderRadius: 20,
        padding: '20px 20px 24px',
        marginBottom: 16,
        cursor: 'pointer',
        userSelect: 'none',
        transition: 'transform 0.15s, opacity 0.15s',
        WebkitTapHighlightColor: 'transparent',
      }}
      onTouchStart={e => e.currentTarget.style.transform = 'scale(0.98)'}
      onTouchEnd={e => e.currentTarget.style.transform = 'scale(1)'}
    >
      <div style={{
        fontSize: 32,
        fontWeight: 800,
        color: 'white',
        marginBottom: 14,
        letterSpacing: '-0.5px'
      }}>
        {name}
      </div>
      <div>
        {preview.map((film, idx) => {
          const isLast = idx === preview.length - 1 && preview.length >= 3;
          return (
            <div
              key={film.id}
              style={{
                fontSize: 16,
                fontWeight: 500,
                color: isLast ? 'rgba(255,255,255,0.45)' : 'white',
                marginBottom: idx < preview.length - 1 ? 4 : 0,
                filter: isLast ? 'blur(3px)' : 'none',
                transition: 'filter 0.2s',
              }}
            >
              {film.name}
            </div>
          );
        })}
        {films.length === 0 && (
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 15 }}>
            Нет фильмов
          </div>
        )}
      </div>
    </div>
  );
}
