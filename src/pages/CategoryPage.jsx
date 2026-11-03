import { useState, useEffect, useRef } from 'react';
import { getCategories, addFilm, deleteFilm, updateFilm, updateCategory, deleteCategory, CATEGORY_COLORS, ratingColor } from '../store';
import RatingPicker from '../components/RatingPicker';
import CoverPicker from '../components/CoverPicker';
import PosterPicker from '../components/PosterPicker';
import FilmSheet from '../components/FilmSheet';
import CategoryShareSheet from '../components/CategoryShareSheet';
import { socialEnabled } from '../social';
import { coverCrop } from '../lib/cover';
import { useIsDesktop } from '../lib/useIsDesktop';

export default function CategoryPage({ categoryId, refreshKey, onBack, onRefresh, user, profile, social = { friends: [], inbox: [] }, intent }) {
  const [showShare, setShowShare] = useState(false);
  // Read synchronously: with an empty first render the screen underneath flashed for a frame
  const [cat, setCat] = useState(() => getCategories().find(c => c.id === categoryId) || null);
  const desktop = useIsDesktop();
  const [menuFilm, setMenuFilm] = useState(null);
  const [showRating, setShowRating] = useState(null);
  const [editingName, setEditingName] = useState(false);
  const [catName, setCatName] = useState('');
  const [showAppearance, setShowAppearance] = useState(false);
  const [appearanceDragY, setAppearanceDragY] = useState(0);
  const appearanceDragging = useRef(false);
  const appearanceStartY = useRef(0);
  const [tempColor, setTempColor] = useState('');
  const [tempCover, setTempCover] = useState({ image: null, crop: null });

  const refresh = () => setCat(getCategories().find(c => c.id === categoryId));
  useEffect(() => { refresh(); }, [categoryId]);
  // Data changed elsewhere (another device via sync): re-read without remounting the page.
  useEffect(() => {
    if (refreshKey === undefined) return;
    const fresh = getCategories().find(c => c.id === categoryId);
    if (fresh) setCat(fresh);
    else onBack(); // the category was deleted on another device
  }, [refreshKey]);
  const goBack = () => { onBack(); onRefresh(); };
  const handleRate = (filmId, rating) => { updateFilm(categoryId, filmId, { rating }); setShowRating(null); refresh(); };
  const handleDelete = (filmId) => { deleteFilm(categoryId, filmId); setMenuFilm(null); refresh(); };
  const saveCatName = () => { if (catName.trim()) updateCategory(categoryId, { name: catName.trim() }); setEditingName(false); refresh(); };


  const openAppearance = () => {
    setTempColor(cat.color);
    setTempCover({ image: cat.image || null, crop: coverCrop(cat) });
    setShowAppearance(true);
  };
  const saveAppearance = () => {
    updateCategory(categoryId, { color: tempColor, image: tempCover.image, imageCrop: tempCover.image ? tempCover.crop : null, imagePosition: null });
    setShowAppearance(false);
    refresh();
    onRefresh();
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

  // "Выбрать постер" from the film menu
  const [posterFor, setPosterFor] = useState(null);

  // "+" in the header: styled sheet instead of the browser's prompt()
  const [showAddFilm, setShowAddFilm] = useState(false);
  const [newFilmName, setNewFilmName] = useState('');
  const submitNewFilm = () => {
    const name = newFilmName.trim();
    if (!name) return;
    addFilm(categoryId, name);
    setShowAddFilm(false);
    refresh();
  };

  // Styled confirmation sheet instead of the browser's confirm()
  const [confirmDelCat, setConfirmDelCat] = useState(false);
  const handleDeleteCategory = () => setConfirmDelCat(true);
  const reallyDeleteCategory = () => {
    deleteCategory(categoryId);
    onRefresh();
    onBack();
  };

  // Opened from the home tile menu → «Оформление»
  useEffect(() => { if (intent === 'appearance' && cat) openAppearance(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!cat) return null;

  const accent = cat.color;

  return (
    <div
      className="cat-page"
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: desktop ? 'min(147px, 14.4dvh) 22px 0' : 'calc(60px + var(--top-shift)) 22px 0' }}>
        <button onClick={goBack} className="glass" style={{ borderRadius: '50%', width: 42, height: 42, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        </button>
        <div style={{ display: 'flex', gap: desktop ? 5 : 10 }}>
          {socialEnabled && user && (
            <button onClick={() => setShowShare(true)} aria-label="Поделиться" className="glass" style={{ borderRadius: '50%', width: 42, height: 42, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: 'none' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v13" /><path d="m7 8 5-5 5 5" /><path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7" /></svg>
            </button>
          )}
          <button onClick={openAppearance} className="glass" style={{ borderRadius: '50%', width: 42, height: 42, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="13.5" cy="6.5" r=".5" fill="var(--text)"/><circle cx="17.5" cy="10.5" r=".5" fill="var(--text)"/><circle cx="8.5" cy="7.5" r=".5" fill="var(--text)"/><circle cx="6.5" cy="12.5" r=".5" fill="var(--text)"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/></svg>
          </button>
          <button onClick={handleDeleteCategory} className="glass" style={{ borderRadius: '50%', width: 42, height: 42, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FF453A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6M9 6V4h6v2"/></svg>
          </button>
          <button aria-label="Добавить фильм" onClick={() => { setNewFilmName(''); setShowAddFilm(true); }}
            style={{ background: 'rgb(30,30,32)', border: 'none', borderRadius: '50%', width: 42, height: 42, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white', fontSize: 22, fontWeight: 300 }}>+</button>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: desktop ? '5px 24px 9px' : '26px 24px 20px' }}>
        {editingName ? (
          <input autoFocus value={catName} onChange={e => setCatName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && saveCatName()} onBlur={saveCatName}
            style={{ background: 'transparent', border: 'none', outline: 'none', fontSize: 36, fontWeight: 700, color: 'var(--text)', letterSpacing: '-1px', width: '100%', fontFamily: 'inherit' }} />
        ) : (
          <>
            <span style={{ fontSize: 36, fontWeight: 700, color: 'var(--text)', letterSpacing: '-1px' }}>{cat.name}</span>
            {socialEnabled && cat.visibility && cat.visibility !== 'private' && (
              <span onClick={() => setShowShare(true)} style={{ cursor: 'pointer', fontSize: 12, fontWeight: 800, color: cat.visibility === 'public' ? '#30D158' : '#8E8E93', background: '#1C1C1E', borderRadius: 999, padding: '4px 10px', whiteSpace: 'nowrap' }}>
                {cat.visibility === 'public' ? 'Публичная' : 'По ссылке'}
              </span>
            )}
            <button onClick={() => { setEditingName(true); setCatName(cat.name); }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-dim)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
          </>
        )}
      </div>

      <div className="cat-list" style={{ padding: desktop ? '0 20px 40px' : '0 28px 40px' }}>
        {cat.films.length === 0 && (
          <div style={{ padding: '20px 4px', color: 'var(--text-dim)', fontSize: 15 }}>Нажми + чтобы добавить фильм</div>
        )}
        {cat.films.map((film, idx) => {
          const rc = film.rating !== null ? ratingColor(film.rating) : null;
          return (
            <div key={film.id} className="rise-in" style={{
              animationDelay: `${120 + Math.min(idx, 14) * 28}ms`,
              display: 'flex', alignItems: 'center', gap: desktop ? 12 : 14,
              padding: '13px 0',
              borderBottom: 'none',
            }}>
              <span style={{ fontSize: desktop ? 19 : 15, fontWeight: desktop ? 600 : 500, color: 'var(--text-dim)', minWidth: desktop ? 0 : 20, flexShrink: 0 }}>{idx + 1}</span>
              <span style={{ fontSize: desktop ? 19 : 17, fontWeight: desktop ? 700 : 500, color: 'var(--text)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{film.name}</span>
              {rc && (
                <span onClick={() => setShowRating(film)} className="rating-pill" style={{
                  fontSize: desktop ? 18 : 13, minWidth: desktop ? 44 : 30, height: desktop ? 27 : 24, padding: desktop ? '0 10px' : '0 9px',
                  color: rc, border: 'none',
                  background: `${rc}20`,
                  flexShrink: 0, cursor: 'pointer',
                }}>{film.rating}</span>
              )}
              <button onClick={() => setMenuFilm(film)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-dim)', fontSize: desktop ? 22 : 18, padding: '0 2px', flexShrink: 0 }}>⋯</button>
            </div>
          );
        })}
      </div>

      {/* Film menu: poster, info and description from TMDB, actions */}
      {menuFilm && (
        <FilmSheet
          key={menuFilm.id}
          film={menuFilm}
          categoryId={categoryId}
          onClose={() => setMenuFilm(null)}
          onRate={() => { setShowRating(menuFilm); setMenuFilm(null); }}
          onPoster={() => { setPosterFor(menuFilm); setMenuFilm(null); }}
          onDelete={() => handleDelete(menuFilm.id)}
          onRename={(name) => {
            // A new name may be another film: look the poster and info up again (unless picked by hand)
            updateFilm(categoryId, menuFilm.id, menuFilm.posterManual ? { name } : { name, poster: null, posterChecked: false, tmdbId: null, info: null });
            setMenuFilm(null); refresh(); onRefresh();
          }}
          onChanged={refresh}
        />
      )}

      {/* Appearance editor sheet */}
      {showAppearance && (
        <>
          <div className="sheet-backdrop" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 398 }} onClick={() => setShowAppearance(false)} />
          <div
            className="glass sheet-panel"
            style={{
              position: 'fixed', bottom: 0, left: '50%',
              transform: `translateX(-50%) translateY(${appearanceDragY}px)`,
              width: 430, borderRadius: '28px 28px 0 0', padding: '20px 22px 40px', zIndex: 399,
              animation: appearanceDragY === 0 ? 'slideUp 0.32s cubic-bezier(0.34,1.26,0.64,1)' : 'none',
              maxHeight: '85dvh', overflowY: 'auto',
              transition: appearanceDragging.current ? 'none' : 'transform 0.25s ease',
            }}
            onTouchStart={handleAppearanceTouchStart}
            onTouchMove={handleAppearanceTouchMove}
            onTouchEnd={handleAppearanceTouchEnd}
          >
            <div className="sheet-handle" style={{ width: 36, height: 4, borderRadius: 2, background: 'rgb(86,86,88)', margin: '0 auto 20px' }} />
            <div className="d-title" style={{ marginBottom: 20 }}>Оформление</div>

            <CoverPicker name={cat.name} color={tempColor} value={tempCover} onChange={setTempCover} />

            <div className="d-label" style={{ marginBottom: 12, opacity: tempCover.image ? 0.4 : 1 }}>Или выбери цвет</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 12, marginBottom: 22, opacity: tempCover.image ? 0.4 : 1, pointerEvents: tempCover.image ? 'none' : 'auto' }}>
              {CATEGORY_COLORS.map(c => (
                <div key={c} onClick={() => setTempColor(c)} className={`d-swatch${tempColor === c ? ' on' : ''}`} style={{ background: c }} />
              ))}
            </div>
            <button className="d-btn primary" onClick={saveAppearance}>Сохранить</button>
          </div>
        </>
      )}

      {showShare && user && (
        <CategoryShareSheet cat={cat} user={user} profile={profile} social={social} onChanged={() => { refresh(); onRefresh(); }} onClose={() => setShowShare(false)} />
      )}

      {posterFor && (
        <PosterPicker
          film={posterFor}
          onPick={(r) => { updateFilm(categoryId, posterFor.id, { poster: r?.poster || null, tmdbId: r?.id || null, tmdbType: r?.type || null, info: null, posterChecked: true, posterManual: true }); setPosterFor(null); refresh(); onRefresh(); }}
          onClose={() => setPosterFor(null)}
        />
      )}

      {showAddFilm && (
        <>
          <div className="sheet-backdrop" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 398 }} onClick={() => setShowAddFilm(false)} />
          <div className="glass sheet-panel" style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: 430, borderRadius: '28px 28px 0 0', padding: '20px 22px 32px', zIndex: 399, animation: 'slideUp 0.32s cubic-bezier(0.34,1.26,0.64,1)' }}>
            <div className="sheet-handle" style={{ width: 36, height: 4, borderRadius: 2, margin: '0 auto 20px' }} />
            <div className="d-title">Новый фильм</div>
            <div className="d-label" style={{ textAlign: 'center', margin: '8px 0 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <span style={{ width: 12, height: 12, borderRadius: '50%', flexShrink: 0, background: cat.image ? `url(${cat.image}) center/cover` : cat.color }} />
              {cat.name}
            </div>
            <input autoFocus className="d-field" placeholder="Название фильма" value={newFilmName}
              onChange={e => setNewFilmName(e.target.value)} onKeyDown={e => e.key === 'Enter' && submitNewFilm()} style={{ marginBottom: 18 }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button className="d-btn primary" onClick={submitNewFilm} style={{ opacity: newFilmName.trim() ? 1 : 0.5 }}>Добавить</button>
              <button className="d-btn ghost" onClick={() => setShowAddFilm(false)}>Отмена</button>
            </div>
          </div>
        </>
      )}

      {confirmDelCat && (
        <>
          <div className="sheet-backdrop" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 398 }} onClick={() => setConfirmDelCat(false)} />
          <div className="glass sheet-panel" style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: 430, borderRadius: '28px 28px 0 0', padding: '20px 22px 32px', zIndex: 399, animation: 'slideUp 0.32s cubic-bezier(0.34,1.26,0.64,1)' }}>
            <div className="sheet-handle" style={{ width: 36, height: 4, borderRadius: 2, margin: '0 auto 20px' }} />
            <div className="d-title">Удалить категорию?</div>
            <div className="d-label" style={{ textAlign: 'center', margin: '10px 10px 22px', lineHeight: '19px' }}>
              «{cat.name}» и {cat.films.length === 0 ? 'пустой список' : `все фильмы в ней (${cat.films.length})`} удалятся без возможности вернуть
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button className="d-btn" style={{ background: '#C40000' }} onClick={reallyDeleteCategory}>Удалить</button>
              <button className="d-btn ghost" onClick={() => setConfirmDelCat(false)}>Отмена</button>
            </div>
          </div>
        </>
      )}

      {showRating && (
        <RatingPicker film={showRating} onRate={r => handleRate(showRating.id, r)} onClose={() => setShowRating(null)} />
      )}
    </div>
  );
}
