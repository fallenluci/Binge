import { useState, useEffect } from 'react';
import { getCategories, addFilm, deleteFilm, updateFilm } from '../store';
import RatingPicker from '../components/RatingPicker';

export default function CategoryPage({ categoryId, onBack, onRefresh }) {
  const [category, setCategory] = useState(null);
  const [menuFilm, setMenuFilm] = useState(null);
  const [showRating, setShowRating] = useState(null);
  const [editingFilm, setEditingFilm] = useState(null);
  const [editName, setEditName] = useState('');
  const [isExiting, setIsExiting] = useState(false);

  const refresh = () => {
    const cat = getCategories().find(c => c.id === categoryId);
    setCategory(cat);
  };

  useEffect(() => { refresh(); }, [categoryId]);

  const handleBack = () => {
    setIsExiting(true);
    setTimeout(() => { onBack(); onRefresh(); }, 280);
  };

  const handleAddFilm = () => {
    const name = prompt('Название фильма:');
    if (name?.trim()) { addFilm(categoryId, name.trim()); refresh(); }
  };

  const handleDelete = (filmId) => {
    deleteFilm(categoryId, filmId);
    setMenuFilm(null);
    refresh();
  };

  const handleRate = (filmId, rating) => {
    updateFilm(categoryId, filmId, { rating });
    setShowRating(null);
    refresh();
  };

  const handleEditSave = () => {
    if (editName.trim()) {
      updateFilm(categoryId, editingFilm.id, { name: editName.trim() });
      setEditingFilm(null);
      setMenuFilm(prev => prev ? { ...prev, name: editName.trim() } : null);
      refresh();
    }
  };

  if (!category) return null;

  return (
    <div
      className={`cat-page ${isExiting ? 'screen-exit' : 'screen-enter'}`}
      style={{ background: category.color }}
    >
      {/* Top bar */}
      <div className="cat-topbar">
        <button className="cat-back-btn" onClick={handleBack}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </button>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={handleAddFilm}
            className="topbar-circle"
            style={{ background: 'rgba(255,255,255,0.25)', color: 'white', fontSize: 24, fontWeight: 300 }}
          >+</button>
          <div className="topbar-circle" style={{ background: 'rgba(255,255,255,0.25)' }}>
            <span style={{ fontSize: 20, fontWeight: 400, color: 'white' }}>AC</span>
          </div>
        </div>
      </div>

      {/* Title */}
      <div className="cat-title">{category.name}</div>

      {/* Film list */}
      <div className="cat-list">
        {category.films.length === 0 && (
          <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 18, padding: '20px 31px' }}>
            Нажми + чтобы добавить первый фильм
          </div>
        )}
        {category.films.map((film, idx) => (
          <div key={film.id} className="film-row">
            <span className="film-num">{idx + 1}.</span>
            <span className="film-name">{film.name}</span>
            {film.rating !== null && (
              <div className="film-rating-badge">{film.rating}</div>
            )}
            <button className="film-dots-btn" onClick={() => setMenuFilm(film)}>
              <div className="film-dot" />
              <div className="film-dot" />
              <div className="film-dot" />
            </button>
          </div>
        ))}
      </div>

      {/* Action sheet */}
      {menuFilm && (
        <>
          <div className="sheet-overlay" onClick={() => { setMenuFilm(null); setEditingFilm(null); }} />
          <div className="sheet" style={{ background: `${category.color}f7` }}>
            <div className="sheet-handle" />

            {/* Film name / edit row */}
            <div className="sheet-film-title-row">
              {editingFilm?.id === menuFilm.id ? (
                <>
                  <input
                    autoFocus
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleEditSave()}
                    style={{
                      flex: 1, background: 'transparent', border: 'none', outline: 'none',
                      fontSize: 24, fontWeight: 590, color: 'white', fontFamily: 'inherit',
                    }}
                  />
                  <button
                    onClick={handleEditSave}
                    style={{ background: 'none', border: 'none', color: 'white', fontWeight: 700, cursor: 'pointer', fontSize: 16 }}
                  >✓</button>
                </>
              ) : (
                <>
                  <span className="sheet-film-name">{menuFilm.name}</span>
                  <button
                    className="sheet-edit-btn"
                    onClick={() => { setEditingFilm(menuFilm); setEditName(menuFilm.name); }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                  </button>
                </>
              )}
            </div>

            {/* Delete */}
            <div className="sheet-action-row" onClick={() => handleDelete(menuFilm.id)}>
              <div className="sheet-action-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                  <path d="M10 11v6M14 11v6M9 6V4h6v2"/>
                </svg>
              </div>
              <span className="sheet-action-label">Delete</span>
            </div>

            {/* Rate */}
            <div className="sheet-action-row" onClick={() => { setShowRating(menuFilm); setMenuFilm(null); }}>
              <div className="sheet-action-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="black">
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
        <RatingPicker
          film={showRating}
          onRate={(rating) => handleRate(showRating.id, rating)}
          onClose={() => setShowRating(null)}
          bgColor={category.color}
        />
      )}
    </div>
  );
}
