import { useState, useEffect } from 'react';
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

  const refresh = () => {
    const found = getCategories().find(c => c.id === categoryId);
    setCat(found);
  };
  useEffect(() => { refresh(); }, [categoryId]);

  const goBack = () => {
    setExiting(true);
    setTimeout(() => { onBack(); onRefresh(); }, 280);
  };

  const addFilmPrompt = () => {
    const name = prompt('Название фильма:');
    if (name?.trim()) { addFilm(categoryId, name.trim()); refresh(); }
  };

  const handleRate = (filmId, rating) => {
    updateFilm(categoryId, filmId, { rating });
    setShowRating(null); refresh();
  };

  const handleDelete = (filmId) => {
    deleteFilm(categoryId, filmId);
    setMenuFilm(null); refresh();
  };

  const saveCatName = () => {
    if (catName.trim()) { updateCategory(categoryId, { name: catName.trim() }); }
    setEditingName(false); refresh();
  };

  const saveFilmName = () => {
    if (editFilmName.trim()) { updateFilm(categoryId, editFilm.id, { name: editFilmName.trim() }); }
    setEditFilm(null);
    setMenuFilm(prev => prev ? { ...prev, name: editFilmName.trim() } : null);
    refresh();
  };

  if (!cat) return null;

  // sheet bg: category color at 97% opacity
  const sheetBg = cat.color + 'f7';

  return (
    <div className={`cat-page ${exiting ? 'screen-exit' : 'screen-enter'}`} style={{ background: cat.color }}>
      {/* Topbar */}
      <div className="cat-topbar">
        <button className="cat-back" onClick={goBack}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </button>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="topbar-btn" onClick={addFilmPrompt} style={{ background: 'rgba(217,217,217,0.8)', fontSize: 22 }}>+</button>
          <button className="topbar-btn" style={{ background: 'rgba(217,217,217,0.8)', fontSize: 20, fontWeight: 400 }}>AC</button>
        </div>
      </div>

      {/* Title */}
      <div className="cat-title-row">
        {editingName ? (
          <input autoFocus value={catName} onChange={e => setCatName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && saveCatName()}
            onBlur={saveCatName}
            style={{
              background: 'transparent', border: 'none', outline: 'none',
              fontSize: 40, fontWeight: 860, color: 'white', fontFamily: 'inherit',
              letterSpacing: '-0.5px', width: '100%',
            }} />
        ) : (
          <>
            <span className="cat-title">{cat.name}</span>
            <button className="cat-title-edit" onClick={() => { setEditingName(true); setCatName(cat.name); }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </button>
          </>
        )}
      </div>

      {/* Film list */}
      <div className="cat-list" style={{ paddingBottom: 40 }}>
        {cat.films.length === 0 && (
          <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 18, padding: '20px' }}>
            Нажми + чтобы добавить фильм
          </div>
        )}
        {cat.films.map((film, idx) => (
          <div key={film.id} className="film-row">
            <span className="film-num">{idx + 1}.</span>
            <span className="film-name">{film.name}</span>
            {film.rating !== null && <div className="film-badge">{film.rating}</div>}
            <button className="film-dots" onClick={() => setMenuFilm(film)}>
              <div className="film-dot"/><div className="film-dot"/><div className="film-dot"/>
            </button>
          </div>
        ))}
      </div>

      {/* Film action sheet */}
      {menuFilm && (
        <>
          <div className="sheet-overlay" onClick={() => { setMenuFilm(null); setEditFilm(null); }} />
          <div className="sheet" style={{ background: sheetBg }}>
            <div className="sheet-handle" />
            <div className="sheet-film-row">
              {editFilm?.id === menuFilm.id ? (
                <input autoFocus value={editFilmName} onChange={e => setEditFilmName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && saveFilmName()}
                  style={{ background: 'transparent', border: 'none', outline: 'none', fontSize: 24, fontWeight: 590, color: 'white', fontFamily: 'inherit', flex: 1 }} />
              ) : (
                <span className="sheet-film-name">{menuFilm.name}</span>
              )}
              <button className="sheet-pencil-btn" onClick={() => { setEditFilm(menuFilm); setEditFilmName(menuFilm.name); }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
              </button>
            </div>
            <div className="sheet-action" onClick={() => handleDelete(menuFilm.id)}>
              <div className="sheet-action-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                  <path d="M10 11v6M14 11v6M9 6V4h6v2"/>
                </svg>
              </div>
              <span className="sheet-action-label">Delete</span>
            </div>
            <div className="sheet-action" onClick={() => { setShowRating(menuFilm); setMenuFilm(null); }}>
              <div className="sheet-action-icon">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="#000">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
              </div>
              <span className="sheet-action-label">Rate</span>
            </div>
          </div>
        </>
      )}

      {/* Rating picker */}
      {showRating && (
        <RatingPicker film={showRating} bgColor={cat.color}
          onRate={r => handleRate(showRating.id, r)}
          onClose={() => setShowRating(null)} />
      )}
    </div>
  );
}
