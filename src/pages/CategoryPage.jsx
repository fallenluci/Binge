import { useState, useEffect, useRef } from 'react';
import { getCategories, addFilm, deleteFilm, updateFilm, updateCategory } from '../store';
import RatingPicker from '../components/RatingPicker';

export default function CategoryPage({ categoryId, onBack, onRefresh }) {
  const [cat, setCat] = useState(null);
  const [menuFilm, setMenuFilm] = useState(null);
  const [showRating, setShowRating] = useState(null);
  const [editingName, setEditingName] = useState(false);
  const [catName, setCatName] = useState('');
  const [editFilm, setEditFilm] = useState(null);
  const [editFilmName, setEditFilmName] = useState('');
  const [exiting, setExiting] = useState(false);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);

  const refresh = () => setCat(getCategories().find(c => c.id === categoryId));
  useEffect(() => { refresh(); }, [categoryId]);
  const goBack = () => { setExiting(true); setTimeout(() => { onBack(); onRefresh(); }, 300); };
  const handleTouchStart = e => { touchStartX.current = e.touches[0].clientX; touchStartY.current = e.touches[0].clientY; };
  const handleTouchEnd = e => {
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = Math.abs(e.changedTouches[0].clientY - touchStartY.current);
    if (dx > 80 && dy < 60) goBack();
  };
  const handleRate = (filmId, rating) => { updateFilm(categoryId, filmId, { rating }); setShowRating(null); refresh(); };
  const handleDelete = (filmId) => { deleteFilm(categoryId, filmId); setMenuFilm(null); refresh(); };
  const saveCatName = () => { if (catName.trim()) updateCategory(categoryId, { name: catName.trim() }); setEditingName(false); refresh(); };
  const saveFilmName = () => {
    if (editFilmName.trim()) updateFilm(categoryId, editFilm.id, { name: editFilmName.trim() });
    setEditFilm(null);
    setMenuFilm(prev => prev ? { ...prev, name: editFilmName.trim() } : null);
    refresh();
  };

  if (!cat) return null;

  return (
    <div
      className={`cat-page ${exiting ? 'screen-exit' : 'screen-enter'}`}
      style={{ background: `radial-gradient(ellipse at 30% 0%, ${cat.color}33 0%, #000 60%)` }}
      onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '60px 22px 0' }}>
        <button onClick={goBack} className="glass" style={{
          borderRadius: 16, width: 42, height: 42, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.15)',
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        </button>
        <button onClick={() => { const n = prompt('Название фильма:'); if (n?.trim()) { addFilm(categoryId, n.trim()); refresh(); } }}
          style={{
            background: cat.color, border: 'none', borderRadius: 16, width: 42, height: 42,
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white', fontSize: 22, fontWeight: 300,
          }}>+</button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '26px 24px 20px' }}>
        {editingName ? (
          <input autoFocus value={catName} onChange={e => setCatName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && saveCatName()} onBlur={saveCatName}
            style={{ background: 'transparent', border: 'none', outline: 'none', fontSize: 36, fontWeight: 700, color: 'var(--text)', letterSpacing: '-1px', width: '100%', fontFamily: 'inherit' }} />
        ) : (
          <>
            <span style={{ fontSize: 36, fontWeight: 700, color: 'var(--text)', letterSpacing: '-1px' }}>{cat.name}</span>
            <button onClick={() => { setEditingName(true); setCatName(cat.name); }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-dim)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
          </>
        )}
      </div>

      <div className="cat-list" style={{ padding: '0 16px 40px' }}>
        {cat.films.length === 0 && (
          <div className="glass" style={{ borderRadius: 20, padding: '30px', textAlign: 'center', color: 'var(--text-dim)', fontSize: 15 }}>Нажми + чтобы добавить фильм</div>
        )}
        {cat.films.map((film, idx) => (
          <div key={film.id} className="glass" style={{
            borderRadius: 18, padding: '16px 18px', marginBottom: 10,
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-dim)', minWidth: 22 }}>{idx + 1}</span>
            <span style={{ fontSize: 17, fontWeight: 500, color: 'var(--text)', flex: 1 }}>{film.name}</span>
            {film.rating !== null && (
              <span style={{ fontSize: 13, fontWeight: 700, color: cat.color, background: `${cat.color}25`, borderRadius: 20, padding: '4px 11px', flexShrink: 0 }}>{film.rating}</span>
            )}
            <button onClick={() => setMenuFilm(film)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-dim)', fontSize: 18, padding: '0 2px', flexShrink: 0 }}>⋯</button>
          </div>
        ))}
      </div>

      {menuFilm && (
        <>
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 300 }} onClick={() => { setMenuFilm(null); setEditFilm(null); }} />
          <div className="glass" style={{
            position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: 430,
            borderRadius: '28px 28px 0 0', padding: '14px 0 46px', zIndex: 301,
            animation: 'slideUp 0.32s cubic-bezier(0.34,1.26,0.64,1)', borderBottom: 'none',
          }}>
            <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.25)', margin: '0 auto 18px' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0 22px 18px', borderBottom: '1px solid rgba(255,255,255,0.1)', marginBottom: 8 }}>
              {editFilm?.id === menuFilm.id ? (
                <input autoFocus value={editFilmName} onChange={e => setEditFilmName(e.target.value)} onKeyDown={e => e.key === 'Enter' && saveFilmName()}
                  style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: 19, fontWeight: 600, color: 'var(--text)', fontFamily: 'inherit' }} />
              ) : (
                <span style={{ flex: 1, fontSize: 19, fontWeight: 600, color: 'var(--text)' }}>{menuFilm.name}</span>
              )}
              <button onClick={() => { setEditFilm(menuFilm); setEditFilmName(menuFilm.name); }} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 10, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--text)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              </button>
            </div>
            <div onClick={() => handleDelete(menuFilm.id)} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 22px', cursor: 'pointer' }}>
              <div style={{ width: 38, height: 38, borderRadius: 12, background: 'rgba(255,69,58,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FF453A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6M9 6V4h6v2"/></svg>
              </div>
              <span style={{ fontSize: 17, color: 'var(--text)' }}>Удалить</span>
            </div>
            <div onClick={() => { setShowRating(menuFilm); setMenuFilm(null); }} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 22px', cursor: 'pointer' }}>
              <div style={{ width: 38, height: 38, borderRadius: 12, background: 'rgba(255,214,10,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="#FFD60A"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
              </div>
              <span style={{ fontSize: 17, color: 'var(--text)' }}>Оценить</span>
            </div>
          </div>
        </>
      )}

      {showRating && (
        <RatingPicker film={showRating} accentColor={cat.color} onRate={r => handleRate(showRating.id, r)} onClose={() => setShowRating(null)} />
      )}
    </div>
  );
}
