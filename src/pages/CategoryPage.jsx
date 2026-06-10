import { useState, useEffect, useRef } from 'react';
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
    const cats = getCategories();
    const cat = cats.find(c => c.id === categoryId);
    setCategory(cat);
  };

  useEffect(() => { refresh(); }, [categoryId]);

  const handleBack = () => {
    setIsExiting(true);
    setTimeout(() => { onBack(); onRefresh(); }, 260);
  };

  const handleAddFilm = () => {
    const name = prompt('Название фильма:');
    if (name?.trim()) {
      addFilm(categoryId, name.trim());
      refresh();
    }
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
      setMenuFilm(null);
      refresh();
    }
  };

  if (!category) return null;

  return (
    <div
      className={isExiting ? 'screen-exit' : 'screen-enter'}
      style={{
        position: 'fixed',
        inset: 0,
        background: category.color,
        zIndex: 20,
        display: 'flex',
        flexDirection: 'column',
        maxWidth: 430,
        left: '50%',
        transform: isExiting ? 'none' : 'none',
        marginLeft: -215,
      }}
    >
      {/* Top bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '56px 20px 16px',
      }}>
        <button
          onClick={handleBack}
          style={{
            background: 'rgba(255,255,255,0.25)',
            border: 'none',
            borderRadius: 50,
            width: 40,
            height: 40,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: 'white',
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </button>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={handleAddFilm}
            style={{
              background: 'rgba(255,255,255,0.25)',
              border: 'none',
              borderRadius: 50,
              width: 44,
              height: 44,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'white',
              fontSize: 22,
            }}
          >+</button>
          <div style={{
            background: 'rgba(255,255,255,0.25)',
            borderRadius: 50,
            width: 44,
            height: 44,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: 13,
            fontWeight: 700,
          }}>AC</div>
        </div>
      </div>

      {/* Title */}
      <div style={{ padding: '8px 24px 20px' }}>
        <h1 style={{ fontSize: 36, fontWeight: 800, color: 'white', letterSpacing: '-0.5px' }}>
          {category.name}
        </h1>
      </div>

      {/* Film list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 24px 40px' }}>
        {category.films.length === 0 && (
          <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 16, paddingTop: 20 }}>
            Нажми + чтобы добавить первый фильм
          </div>
        )}
        {category.films.map((film, idx) => (
          <div
            key={film.id}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 12,
              paddingBottom: 20,
              paddingTop: idx === 0 ? 0 : 0,
            }}
          >
            <span style={{ color: 'white', fontSize: 17, fontWeight: 500, minWidth: 24, paddingTop: 1 }}>
              {idx + 1}.
            </span>
            <span style={{ color: 'white', fontSize: 17, fontWeight: 500, flex: 1, lineHeight: 1.35 }}>
              {film.name}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
              {film.rating !== null && (
                <span style={{
                  background: 'rgba(0,0,0,0.75)',
                  color: 'white',
                  borderRadius: 20,
                  padding: '3px 10px',
                  fontSize: 14,
                  fontWeight: 700,
                  minWidth: 32,
                  textAlign: 'center',
                }}>
                  {film.rating}
                </span>
              )}
              <button
                onClick={() => setMenuFilm(film)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: 18,
                  padding: '4px 2px',
                  letterSpacing: 1,
                  opacity: 0.8,
                }}
              >
                •••
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Film action sheet */}
      {menuFilm && (
        <>
          <div className="sheet-overlay" onClick={() => setMenuFilm(null)} />
          <div className="sheet" style={{ maxWidth: 430, left: '50%', transform: 'translateX(-50%)' }}>
            <div className="sheet-handle" />
            {/* Edit name inline */}
            <div style={{ background: 'white', borderRadius: 12, padding: '12px 16px', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
              {editingFilm?.id === menuFilm.id ? (
                <>
                  <input
                    autoFocus
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleEditSave()}
                    style={{ flex: 1, border: 'none', outline: 'none', fontSize: 16, fontFamily: 'inherit' }}
                  />
                  <button onClick={handleEditSave} style={{ background: 'none', border: 'none', color: '#007AFF', fontWeight: 600, cursor: 'pointer', fontSize: 15 }}>
                    Сохранить
                  </button>
                </>
              ) : (
                <>
                  <span style={{ flex: 1, fontSize: 16, fontWeight: 500 }}>{menuFilm.name}</span>
                  <button onClick={() => { setEditingFilm(menuFilm); setEditName(menuFilm.name); }} style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: 0.5 }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                  </button>
                </>
              )}
            </div>

            <div className="sheet-item">
              <div className="sheet-row" onClick={() => { setShowRating(menuFilm); setMenuFilm(null); }}>
                <div className="sheet-row-icon" style={{ background: '#FFD60A' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                </div>
                <span className="sheet-row-label">Оценить</span>
              </div>
              <div className="sheet-row" onClick={() => handleDelete(menuFilm.id)}>
                <div className="sheet-row-icon" style={{ background: '#FF3B30' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                    <path d="M10 11v6M14 11v6M9 6V4h6v2"/>
                  </svg>
                </div>
                <span className="sheet-row-label danger">Удалить</span>
              </div>
            </div>
            <button className="modal-btn secondary" onClick={() => setMenuFilm(null)}>Отмена</button>
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
