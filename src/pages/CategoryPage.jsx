import { useState, useEffect, useRef } from 'react';
import { getCategories, addFilm, deleteFilm, updateFilm, updateCategory, deleteCategory, CATEGORY_COLORS, ratingColor } from '../store';
import RatingPicker from '../components/RatingPicker';
import ImagePositionEditor from '../components/ImagePositionEditor';

export default function CategoryPage({ categoryId, onBack, onRefresh }) {
  const [cat, setCat] = useState(null);
  const [menuFilm, setMenuFilm] = useState(null);
  const [showRating, setShowRating] = useState(null);
  const [editingName, setEditingName] = useState(false);
  const [catName, setCatName] = useState('');
  const [editFilm, setEditFilm] = useState(null);
  const [editFilmName, setEditFilmName] = useState('');
  const [exiting, setExiting] = useState(false);
  const [showAppearance, setShowAppearance] = useState(false);
  const [appearanceDragY, setAppearanceDragY] = useState(0);
  const appearanceDragging = useRef(false);
  const appearanceStartY = useRef(0);
  const [tempColor, setTempColor] = useState('');
  const [tempImage, setTempImage] = useState(null);
  const [tempImagePos, setTempImagePos] = useState({ x: 50, y: 50 });
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const fileInputRef = useRef(null);

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

  const openAppearance = () => {
    setTempColor(cat.color);
    setTempImage(cat.image);
    setTempImagePos(cat.imagePosition || { x: 50, y: 50 });
    setShowAppearance(true);
  };
  const saveAppearance = () => {
    updateCategory(categoryId, { color: tempColor, image: tempImage, imagePosition: tempImagePos });
    setShowAppearance(false);
    refresh();
    onRefresh();
  };
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => { setTempImage(reader.result); setTempImagePos({ x: 50, y: 50 }); };
    reader.readAsDataURL(file);
  };

  const handleAppearanceTouchStart = (e) => {
    appearanceDragging.current = true;
    appearanceStartY.current = e.touches[0].clientY;
  };
  const handleAppearanceTouchMove = (e) => {
    if (!appearanceDragging.current) return;
    const dy = e.touches[0].clientY - appearanceStartY.current;
    if (dy > 0) setAppearanceDragY(dy);
  };
  const handleAppearanceTouchEnd = () => {
    appearanceDragging.current = false;
    if (appearanceDragY > 100) {
      setShowAppearance(false);
    }
    setAppearanceDragY(0);
  };

  const handleDeleteCategory = () => {
    if (confirm(`Удалить категорию «${cat.name}» вместе со всеми фильмами?`)) {
      deleteCategory(categoryId);
      onRefresh();
      onBack();
    }
  };

  if (!cat) return null;

  const accent = cat.color;

  return (
    <div
      className={`cat-page ${exiting ? 'screen-exit' : 'screen-enter'}`}
      onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '60px 22px 0' }}>
        <button onClick={goBack} className="glass" style={{ borderRadius: '50%', width: 42, height: 42, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        </button>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={openAppearance} className="glass" style={{ borderRadius: '50%', width: 42, height: 42, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="13.5" cy="6.5" r=".5" fill="var(--text)"/><circle cx="17.5" cy="10.5" r=".5" fill="var(--text)"/><circle cx="8.5" cy="7.5" r=".5" fill="var(--text)"/><circle cx="6.5" cy="12.5" r=".5" fill="var(--text)"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/></svg>
          </button>
          <button onClick={handleDeleteCategory} className="glass" style={{ borderRadius: '50%', width: 42, height: 42, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FF453A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6M9 6V4h6v2"/></svg>
          </button>
          <button onClick={() => { const n = prompt('Название фильма:'); if (n?.trim()) { addFilm(categoryId, n.trim()); refresh(); } }}
            style={{ background: 'rgba(255,255,255,0.12)', border: 'none', borderRadius: '50%', width: 42, height: 42, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white', fontSize: 22, fontWeight: 300 }}>+</button>
        </div>
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

      <div className="cat-list" style={{ padding: '0 28px 40px' }}>
        {cat.films.length === 0 && (
          <div style={{ padding: '20px 4px', color: 'var(--text-dim)', fontSize: 15 }}>Нажми + чтобы добавить фильм</div>
        )}
        {cat.films.map((film, idx) => {
          const rc = film.rating !== null ? ratingColor(film.rating) : null;
          return (
            <div key={film.id} style={{
              display: 'flex', alignItems: 'center', gap: 14,
              padding: '13px 0',
              borderBottom: 'none',
            }}>
              <span style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-dim)', minWidth: 20, flexShrink: 0 }}>{idx + 1}</span>
              <span style={{ fontSize: 17, fontWeight: 500, color: 'var(--text)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{film.name}</span>
              {rc && (
                <span onClick={() => setShowRating(film)} className="rating-pill" style={{
                  fontSize: 13, minWidth: 30, height: 24, padding: '0 9px',
                  color: rc, border: 'none',
                  background: `${rc}20`,
                  boxShadow: `0 0 10px ${rc}55`,
                  flexShrink: 0, cursor: 'pointer',
                }}>{film.rating}</span>
              )}
              <button onClick={() => setMenuFilm(film)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-dim)', fontSize: 18, padding: '0 2px', flexShrink: 0 }}>⋯</button>
            </div>
          );
        })}
      </div>

      {/* Film action sheet */}
      {menuFilm && (
        <>
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 300 }} onClick={() => { setMenuFilm(null); setEditFilm(null); }} />
          <div className="glass" style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: 430, borderRadius: '28px 28px 0 0', padding: '14px 0 46px', zIndex: 301, animation: 'slideUp 0.32s cubic-bezier(0.34,1.26,0.64,1)', borderBottom: 'none' }}>
            <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.25)', margin: '0 auto 18px' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0 28px 18px', marginBottom: 8 }}>
              {editFilm?.id === menuFilm.id ? (
                <input autoFocus value={editFilmName} onChange={e => setEditFilmName(e.target.value)} onKeyDown={e => e.key === 'Enter' && saveFilmName()}
                  style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: 19, fontWeight: 500, color: 'var(--text)', fontFamily: 'inherit' }} />
              ) : (
                <span style={{ flex: 1, fontSize: 19, fontWeight: 500, color: 'var(--text)' }}>{menuFilm.name}</span>
              )}
              <button onClick={() => { setEditFilm(menuFilm); setEditFilmName(menuFilm.name); }} style={{ background: 'none', border: 'none', padding: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-dim)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              </button>
            </div>
            <div onClick={() => handleDelete(menuFilm.id)} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 28px', cursor: 'pointer' }}>
              <div style={{ width: 38, height: 38, borderRadius: 12, background: 'rgba(255,69,58,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FF453A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6M9 6V4h6v2"/></svg>
              </div>
              <span style={{ fontSize: 17, color: 'var(--text)' }}>Удалить</span>
            </div>
            <div onClick={() => { setShowRating(menuFilm); setMenuFilm(null); }} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 28px', cursor: 'pointer' }}>
              <div style={{ width: 38, height: 38, borderRadius: 12, background: 'rgba(255,214,10,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="#FFD60A"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
              </div>
              <span style={{ fontSize: 17, color: 'var(--text)' }}>Оценить</span>
            </div>
          </div>
        </>
      )}

      {/* Appearance editor sheet */}
      {showAppearance && (
        <>
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 398 }} onClick={() => setShowAppearance(false)} />
          <div
            className="glass"
            style={{
              position: 'fixed', bottom: 0, left: '50%',
              transform: `translateX(-50%) translateY(${appearanceDragY}px)`,
              width: 430, borderRadius: '28px 28px 0 0', padding: '20px 22px 48px', zIndex: 399,
              animation: appearanceDragY === 0 ? 'slideUp 0.32s cubic-bezier(0.34,1.26,0.64,1)' : 'none',
              maxHeight: '85dvh', overflowY: 'auto',
              transition: appearanceDragging.current ? 'none' : 'transform 0.25s ease',
            }}
            onTouchStart={handleAppearanceTouchStart}
            onTouchMove={handleAppearanceTouchMove}
            onTouchEnd={handleAppearanceTouchEnd}
          >
            <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.25)', margin: '0 auto 20px' }} />
            <div style={{ fontSize: 20, fontWeight: 500, textAlign: 'center', color: 'var(--text)', marginBottom: 20 }}>Оформление</div>

            {tempImage ? (
              <div style={{ marginBottom: 16 }}>
                <ImagePositionEditor image={tempImage} position={tempImagePos} onChange={setTempImagePos} />
              </div>
            ) : (
              <div style={{
                width: '100%', height: 100, borderRadius: 28, marginBottom: 16,
                background: tempColor,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <span style={{ color: 'white', fontWeight: 700, fontSize: 18, textShadow: '0 2px 8px rgba(0,0,0,0.4)' }}>{cat.name}</span>
              </div>
            )}

            <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />
            <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
              <button onClick={() => fileInputRef.current?.click()} style={{ flex: 1, padding: 13, borderRadius: 999, border: 'none', background: 'rgba(255,255,255,0.1)', color: 'var(--text)', fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>{tempImage ? 'Заменить фото' : 'Загрузить фото'}</button>
              {tempImage && (
                <button onClick={() => setTempImage(null)} style={{ padding: '13px 20px', borderRadius: 999, border: 'none', background: 'rgba(255,69,58,0.15)', color: '#FF453A', fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>Убрать</button>
              )}
            </div>

            <div style={{ fontSize: 13, color: 'var(--text-dim)', marginBottom: 10, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', opacity: tempImage ? 0.4 : 1 }}>Или выбери цвет</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 12, marginBottom: 18, opacity: tempImage ? 0.4 : 1, pointerEvents: tempImage ? 'none' : 'auto' }}>
              {CATEGORY_COLORS.map(c => (
                <div key={c} onClick={() => setTempColor(c)} style={{
                  width: 38, height: 38, borderRadius: '50%', background: c, cursor: 'pointer', margin: '0 auto',
                  border: tempColor === c ? '3px solid white' : '3px solid transparent',
                  transform: tempColor === c ? 'scale(1.15)' : 'scale(1)', transition: 'all 0.2s',
                }} />
              ))}
            </div>
            <button onClick={saveAppearance} style={{ width: '100%', padding: 16, borderRadius: 999, border: 'none', background: 'rgba(255,255,255,0.12)', color: 'var(--text)', fontSize: 17, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>Сохранить</button>
          </div>
        </>
      )}

      {showRating && (
        <RatingPicker film={showRating} onRate={r => handleRate(showRating.id, r)} onClose={() => setShowRating(null)} />
      )}
    </div>
  );
}
