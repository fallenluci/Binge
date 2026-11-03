import { useState, useEffect, useRef } from 'react';
import { getCategories, addFilm, addCategory, CATEGORY_COLORS } from '../store';
import CoverPicker from './CoverPicker';

export default function Island({ activePage, onChangePage, onRefresh }) {
  const [plusOpen, setPlusOpen] = useState(false);
  // The same dock on every screen size
  const dockBottom = '30px';
  const [showAddFilm, setShowAddFilm] = useState(false);
  const [showAddCat, setShowAddCat] = useState(false);
  const [addCatDragY, setAddCatDragY] = useState(0);
  const addCatDragging = useRef(false);
  const addCatStartY = useRef(0);
  const [filmName, setFilmName] = useState('');
  const [catName, setCatName] = useState('');
  const [selCatId, setSelCatId] = useState('');
  const [selColor, setSelColor] = useState(CATEGORY_COLORS[0]);
  const [catCover, setCatCover] = useState({ image: null, crop: null });
  const [cats, setCats] = useState([]);

  const refreshCats = () => setCats(getCategories());
  useEffect(() => { refreshCats(); }, []);

  const submitFilm = () => {
    if (!filmName.trim() || !selCatId) return;
    addFilm(selCatId, filmName.trim());
    setFilmName(''); setShowAddFilm(false); onRefresh();
  };

  const handleAddCatTouchStart = (e) => {
    addCatDragging.current = true;
    addCatStartY.current = e.touches[0].clientY;
  };
  const handleAddCatTouchMove = (e) => {
    if (!addCatDragging.current) return;
    const dy = e.touches[0].clientY - addCatStartY.current;
    if (dy > 0) setAddCatDragY(dy);
  };
  const handleAddCatTouchEnd = () => {
    addCatDragging.current = false;
    if (addCatDragY > 100) { setShowAddCat(false); setCatCover({ image: null, crop: null }); }
    setAddCatDragY(0);
  };

  const submitCat = () => {
    if (!catName.trim()) return;
    addCategory(catName.trim(), selColor, catCover.image, catCover.crop);
    setCatName(''); setCatCover({ image: null, crop: null }); setShowAddCat(false);
    refreshCats(); onRefresh();
  };



  return (
    <>
      {plusOpen && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 50 }} onClick={() => setPlusOpen(false)} />
          <div className="menu-solid" style={{
            position: 'absolute', bottom: `calc(${dockBottom} + 80px)`, left: '50%', transform: 'translateX(-50%)',
            borderRadius: 22, overflow: 'hidden', zIndex: 200, width: 224,
            animation: 'popIn 0.28s cubic-bezier(0.34,1.4,0.64,1)',
          }}>
            <div onClick={() => { setPlusOpen(false); refreshCats(); setShowAddFilm(true); }}
              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', cursor: 'pointer' }}>
              <div style={{ width: 30, height: 30, borderRadius: 9, background: 'rgb(52,52,54)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text)" strokeWidth="2.2" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="4"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
              </div>
              <span style={{ fontSize: 15, fontWeight: 500, color: 'var(--text)' }}>Новый фильм</span>
            </div>
            <div onClick={() => { setPlusOpen(false); setShowAddCat(true); }}
              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', cursor: 'pointer' }}>
              <div style={{ width: 30, height: 30, borderRadius: 9, background: 'rgb(52,52,54)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text)" strokeWidth="2.2" strokeLinecap="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
              </div>
              <span style={{ fontSize: 15, fontWeight: 500, color: 'var(--text)' }}>Новая категория</span>
            </div>
          </div>
        </>
      )}

      {/* Bottom nav: main dock (Home/Rand) + separate "+" island */}
      {/* absolute in .app: sits 30px above the real bottom of the app screen */}
      <div style={{ position: 'absolute', bottom: dockBottom, left: '50%', transform: 'translateX(-50%)', zIndex: 100, display: 'flex', alignItems: 'center', gap: 10 }}>
        <div className="nav-solid" style={{ height: 62, padding: 6, display: 'flex', alignItems: 'stretch', gap: 4, position: 'relative' }}>
          {/* Sliding active indicator — glides between Home/Rand like iOS segmented control */}
          <div style={{
            position: 'absolute', top: 6, left: 6,
            width: 68, height: 50, borderRadius: 999,
            background: 'rgb(58,58,60)',
            transform: `translateX(${activePage === 'rand' ? 72 : 0}px)`,
            transition: 'transform 0.35s cubic-bezier(0.34,1.15,0.64,1)',
            pointerEvents: 'none',
          }} />
          <DockBtn active={activePage === 'home'} onClick={() => onChangePage('home')} label="Home" icon={
            <MaskIcon src="/icons/home.svg" />
          } />
          <DockBtn active={activePage === 'rand'} onClick={() => onChangePage('rand')} label="Random" icon={
            <MaskIcon src="/icons/random.svg" />
          } />
        </div>

        {/* Separate "+" island — rotates into an "×" when open */}
        <button onClick={() => { setPlusOpen(!plusOpen); refreshCats(); }} aria-label="Добавить" className="nav-solid" style={{
          width: 62, height: 62,
          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: 'none', padding: 0,
        }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round"
            style={{ transform: plusOpen ? 'rotate(45deg)' : 'rotate(0deg)', transition: 'transform 0.3s cubic-bezier(0.34,1.4,0.64,1)' }}>
            <line x1="12" y1="4" x2="12" y2="20"/><line x1="4" y1="12" x2="20" y2="12"/>
          </svg>
        </button>
      </div>

      {/* Add Film */}
      {showAddFilm && (
        <>
          <div className="sheet-backdrop" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 399 }} onClick={() => setShowAddFilm(false)} />
          <div className="glass sheet-panel" style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: 430, borderRadius: '28px 28px 0 0', padding: '20px 22px 32px', zIndex: 400, animation: 'slideUp 0.35s cubic-bezier(0.34,1.26,0.64,1)', borderBottom: 'none' }}>
            <div className="sheet-handle" style={{ width: 36, height: 4, borderRadius: 2, background: 'rgb(86,86,88)', margin: '0 auto 20px' }} />
            <div className="d-title" style={{ marginBottom: 20 }}>Новый фильм</div>
            <input autoFocus value={filmName} onChange={e => setFilmName(e.target.value)} onKeyDown={e => e.key === 'Enter' && submitFilm()}
              placeholder="Название фильма" className="d-field" style={{ marginBottom: 18 }} />
            <div className="d-label" style={{ marginBottom: 10 }}>Категория</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 18, maxHeight: '38dvh', overflowY: 'auto' }}>
              {cats.map(cat => {
                const on = selCatId === cat.id;
                return (
                  <div key={cat.id} onClick={() => setSelCatId(cat.id)} style={{
                    display: 'flex', alignItems: 'center', gap: 12, minHeight: 46, padding: '0 14px', borderRadius: 18, cursor: 'pointer', flexShrink: 0,
                    background: on ? '#351E88' : '#2C2C2C', transition: 'background 0.2s',
                  }}>
                    <div style={{ width: 14, height: 14, borderRadius: '50%', flexShrink: 0, background: cat.image ? `url(${cat.image}) center/cover` : cat.color }} />
                    <span style={{ fontSize: 16, fontWeight: 700, flex: 1, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cat.name}</span>
                    {on && <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
                  </div>
                );
              })}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button className="d-btn primary" onClick={submitFilm} style={{ opacity: filmName.trim() && selCatId ? 1 : 0.5 }}>Добавить</button>
              <button className="d-btn ghost" onClick={() => setShowAddFilm(false)}>Отмена</button>
            </div>
          </div>
        </>
      )}

      {/* Add Category — with color OR photo (+ position editor) */}
      {showAddCat && (
        <>
          <div className="sheet-backdrop" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 399 }} onClick={() => setShowAddCat(false)} />
          <div
            className="glass sheet-panel"
            data-noswipe
            style={{
              position: 'fixed', bottom: 0, left: '50%',
              transform: `translateX(-50%) translateY(${addCatDragY}px)`,
              width: 430, borderRadius: '28px 28px 0 0', padding: '20px 22px 40px', zIndex: 400,
              animation: addCatDragY === 0 ? 'slideUp 0.35s cubic-bezier(0.34,1.26,0.64,1)' : 'none',
              maxHeight: '85dvh', overflowY: 'auto',
              transition: addCatDragging.current ? 'none' : 'transform 0.25s ease',
            }}
            onTouchStart={handleAddCatTouchStart}
            onTouchMove={handleAddCatTouchMove}
            onTouchEnd={handleAddCatTouchEnd}
          >
            <div className="sheet-handle" style={{ width: 36, height: 4, borderRadius: 2, background: 'rgb(86,86,88)', margin: '0 auto 20px' }} />
            <div className="d-title" style={{ marginBottom: 20 }}>Новая категория</div>
            <input autoFocus value={catName} onChange={e => setCatName(e.target.value)} onKeyDown={e => e.key === 'Enter' && submitCat()}
              placeholder="Название категории" className="d-field" style={{ marginBottom: 16 }} />

            <CoverPicker name={catName} color={selColor} value={catCover} onChange={setCatCover} />

            <div className="d-label" style={{ marginBottom: 12, opacity: catCover.image ? 0.4 : 1 }}>Или выбери цвет</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 12, marginBottom: 22, opacity: catCover.image ? 0.4 : 1, pointerEvents: catCover.image ? 'none' : 'auto' }}>
              {CATEGORY_COLORS.map(c => (
                <div key={c} onClick={() => setSelColor(c)} className={`d-swatch${selColor === c ? ' on' : ''}`} style={{ background: c }} />
              ))}
            </div>
            <button className="d-btn primary" onClick={submitCat} style={{ opacity: catName.trim() ? 1 : 0.5 }}>Создать</button>
          </div>
        </>
      )}
    </>
  );
}

// Icon from Figma used as a mask, so it takes the button's text colour
// (white when active, grey when not). Vector SVGs exported from Figma.
function MaskIcon({ src, size = 24 }) {
  const mask = `url(${src}) center / contain no-repeat`;
  return <span aria-hidden="true" style={{ display: 'block', width: size, height: size, backgroundColor: 'currentColor', WebkitMask: mask, mask }} />;
}

function DockBtn({ active, onClick, icon, label }) {
  return (
    <button onClick={onClick} aria-label={label} style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2,
      background: 'none',
      border: 'none',
      borderRadius: '999px',
      width: 68,
      padding: '6px 4px', cursor: 'pointer', color: active ? 'var(--text)' : 'var(--text-dim)',
      transition: 'color 0.2s', flexShrink: 0, position: 'relative', zIndex: 1,
    }}>
      {icon}
      <span style={{ fontSize: 10, fontWeight: 500 }}>{label}</span>
    </button>
  );
}
