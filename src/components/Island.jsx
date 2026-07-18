import { useState, useEffect, useRef } from 'react';
import { getCategories, addFilm, addCategory, CATEGORY_COLORS } from '../store';
import ImagePositionEditor from './ImagePositionEditor';

export default function Island({ activePage, onChangePage, onRefresh }) {
  const [plusOpen, setPlusOpen] = useState(false);
  const [showAddFilm, setShowAddFilm] = useState(false);
  const [showAddCat, setShowAddCat] = useState(false);
  const [filmName, setFilmName] = useState('');
  const [catName, setCatName] = useState('');
  const [selCatId, setSelCatId] = useState('');
  const [selColor, setSelColor] = useState(CATEGORY_COLORS[0]);
  const [catImage, setCatImage] = useState(null);
  const [catImagePos, setCatImagePos] = useState({ x: 50, y: 50 });
  const [cats, setCats] = useState([]);
  const fileInputRef = useRef(null);

  const refreshCats = () => setCats(getCategories());
  useEffect(() => { refreshCats(); }, []);

  const submitFilm = () => {
    if (!filmName.trim() || !selCatId) return;
    addFilm(selCatId, filmName.trim());
    setFilmName(''); setShowAddFilm(false); onRefresh();
  };

  const submitCat = () => {
    if (!catName.trim()) return;
    addCategory(catName.trim(), selColor, catImage, catImagePos);
    setCatName(''); setCatImage(null); setCatImagePos({ x: 50, y: 50 }); setShowAddCat(false);
    refreshCats(); onRefresh();
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => { setCatImage(reader.result); setCatImagePos({ x: 50, y: 50 }); };
    reader.readAsDataURL(file);
  };

  return (
    <>
      {plusOpen && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 50 }} onClick={() => setPlusOpen(false)} />
          <div className="menu-solid" style={{
            position: 'fixed', bottom: 110, left: '50%', transform: 'translateX(-50%)',
            borderRadius: 22, overflow: 'hidden', zIndex: 200, minWidth: 240,
            animation: 'popIn 0.28s cubic-bezier(0.34,1.4,0.64,1)',
          }}>
            <div onClick={() => { setPlusOpen(false); refreshCats(); setShowAddFilm(true); }}
              style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 20px', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text)" strokeWidth="2.2" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="4"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
              </div>
              <span style={{ fontSize: 16, fontWeight: 500, color: 'var(--text)' }}>Новый фильм</span>
            </div>
            <div onClick={() => { setPlusOpen(false); setShowAddCat(true); }}
              style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 20px', cursor: 'pointer' }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text)" strokeWidth="2.2" strokeLinecap="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
              </div>
              <span style={{ fontSize: 16, fontWeight: 500, color: 'var(--text)' }}>Новая категория</span>
            </div>
          </div>
        </>
      )}

      {/* Bottom nav: main dock (Home/Rand) + separate "+" island */}
      <div style={{ position: 'fixed', bottom: 30, left: '50%', transform: 'translateX(-50%)', zIndex: 100, display: 'flex', alignItems: 'center', gap: 10 }}>
        <div className="nav-solid" style={{ height: 62, padding: 6, display: 'flex', alignItems: 'stretch', gap: 4 }}>
          <DockBtn active={activePage === 'home'} onClick={() => onChangePage('home')} label="Home" icon={
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M3 11l9-8 9 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M5 10v10h14V10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          } />
          <DockBtn active={activePage === 'rand'} onClick={() => onChangePage('rand')} label="Random" icon={
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="4"/><circle cx="8.5" cy="8.5" r="1.4" fill="currentColor" stroke="none"/><circle cx="15.5" cy="8.5" r="1.4" fill="currentColor" stroke="none"/><circle cx="8.5" cy="15.5" r="1.4" fill="currentColor" stroke="none"/><circle cx="15.5" cy="15.5" r="1.4" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none"/></svg>
          } />
        </div>

        {/* Separate "+" island — solid gray, white icon */}
        <button onClick={() => { setPlusOpen(!plusOpen); refreshCats(); }} className="nav-solid" style={{
          width: 62, height: 62,
          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: 'none', padding: 0,
        }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round"><line x1="12" y1="4" x2="12" y2="20"/><line x1="4" y1="12" x2="20" y2="12"/></svg>
        </button>
      </div>

      {/* Add Film */}
      {showAddFilm && (
        <>
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 399 }} onClick={() => setShowAddFilm(false)} />
          <div className="glass" style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: 430, borderRadius: '28px 28px 0 0', padding: '20px 22px 48px', zIndex: 400, animation: 'slideUp 0.35s cubic-bezier(0.34,1.26,0.64,1)', borderBottom: 'none' }}>
            <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.25)', margin: '0 auto 20px' }} />
            <div style={{ fontSize: 20, fontWeight: 700, textAlign: 'center', color: 'var(--text)', marginBottom: 20 }}>Новый фильм</div>
            <input autoFocus value={filmName} onChange={e => setFilmName(e.target.value)} onKeyDown={e => e.key === 'Enter' && submitFilm()}
              placeholder="Название фильма"
              style={{ width: '100%', padding: '15px 16px', borderRadius: 14, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.06)', fontSize: 16, fontFamily: 'inherit', outline: 'none', color: 'var(--text)', marginBottom: 14 }} />
            <div style={{ borderRadius: 14, overflow: 'hidden', marginBottom: 16, border: '1px solid rgba(255,255,255,0.1)' }}>
              {cats.map(cat => (
                <div key={cat.id} onClick={() => setSelCatId(cat.id)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer', background: selCatId === cat.id ? 'rgba(10,132,255,0.15)' : 'rgba(255,255,255,0.03)' }}>
                  <div style={{ width: 12, height: 12, borderRadius: '50%', background: cat.image ? `url(${cat.image}) center/cover` : cat.color }} />
                  <span style={{ fontSize: 16, flex: 1, color: 'var(--text)' }}>{cat.name}</span>
                  {selCatId === cat.id && <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>}
                </div>
              ))}
            </div>
            <button onClick={submitFilm} style={{ width: '100%', padding: 16, borderRadius: 14, border: 'none', background: 'var(--accent)', color: 'white', fontSize: 17, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Добавить</button>
            <button onClick={() => setShowAddFilm(false)} style={{ width: '100%', padding: 16, borderRadius: 14, border: 'none', background: 'rgba(255,255,255,0.08)', color: 'var(--text)', fontSize: 16, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', marginTop: 10 }}>Отмена</button>
          </div>
        </>
      )}

      {/* Add Category — with color OR photo (+ position editor) */}
      {showAddCat && (
        <>
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 399 }} onClick={() => setShowAddCat(false)} />
          <div className="glass" style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: 430, borderRadius: '28px 28px 0 0', padding: '20px 22px 48px', zIndex: 400, animation: 'slideUp 0.35s cubic-bezier(0.34,1.26,0.64,1)', borderBottom: 'none', maxHeight: '85dvh', overflowY: 'auto' }}>
            <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.25)', margin: '0 auto 20px' }} />
            <div style={{ fontSize: 20, fontWeight: 700, textAlign: 'center', color: 'var(--text)', marginBottom: 20 }}>Новая категория</div>
            <input autoFocus value={catName} onChange={e => setCatName(e.target.value)} onKeyDown={e => e.key === 'Enter' && submitCat()}
              placeholder="Название категории"
              style={{ width: '100%', padding: '15px 16px', borderRadius: 14, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.06)', fontSize: 16, fontFamily: 'inherit', outline: 'none', color: 'var(--text)', marginBottom: 16 }} />

            {catImage ? (
              <div style={{ marginBottom: 16 }}>
                <ImagePositionEditor image={catImage} position={catImagePos} onChange={setCatImagePos} />
              </div>
            ) : (
              <div style={{
                width: '100%', height: 100, borderRadius: 16, marginBottom: 16, background: selColor,
                display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.12)',
              }}>
                <span style={{ color: 'white', fontWeight: 700, fontSize: 18, textShadow: '0 2px 8px rgba(0,0,0,0.4)' }}>{catName || 'Превью'}</span>
              </div>
            )}

            <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />
            <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
              <button onClick={() => fileInputRef.current?.click()} style={{
                flex: 1, padding: 13, borderRadius: 12, border: '1px solid rgba(255,255,255,0.15)',
                background: 'rgba(255,255,255,0.06)', color: 'var(--text)', fontSize: 14, fontWeight: 600,
                cursor: 'pointer', fontFamily: 'inherit',
              }}>{catImage ? 'Заменить фото' : 'Загрузить фото'}</button>
              {catImage && (
                <button onClick={() => setCatImage(null)} style={{
                  padding: '13px 16px', borderRadius: 12, border: '1px solid rgba(255,69,58,0.3)',
                  background: 'rgba(255,69,58,0.1)', color: '#FF453A', fontSize: 14, fontWeight: 600,
                  cursor: 'pointer', fontFamily: 'inherit',
                }}>Убрать</button>
              )}
            </div>

            <div style={{ fontSize: 13, color: 'var(--text-dim)', marginBottom: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', opacity: catImage ? 0.4 : 1 }}>
              Или выбери цвет
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 12, marginBottom: 18, opacity: catImage ? 0.4 : 1, pointerEvents: catImage ? 'none' : 'auto' }}>
              {CATEGORY_COLORS.map(c => (
                <div key={c} onClick={() => setSelColor(c)} style={{
                  width: 38, height: 38, borderRadius: '50%', background: c, cursor: 'pointer', margin: '0 auto',
                  border: selColor === c ? '3px solid white' : '3px solid transparent',
                  boxShadow: selColor === c ? `0 0 0 2px ${c}` : 'none',
                  transform: selColor === c ? 'scale(1.15)' : 'scale(1)', transition: 'all 0.2s',
                }} />
              ))}
            </div>
            <button onClick={submitCat} style={{ width: '100%', padding: 16, borderRadius: 14, border: 'none', background: 'var(--accent)', color: 'white', fontSize: 17, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Создать</button>
            <button onClick={() => { setShowAddCat(false); setCatImage(null); }} style={{ width: '100%', padding: 16, borderRadius: 14, border: 'none', background: 'rgba(255,255,255,0.08)', color: 'var(--text)', fontSize: 16, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', marginTop: 10 }}>Отмена</button>
          </div>
        </>
      )}
    </>
  );
}

function DockBtn({ active, onClick, icon, label }) {
  return (
    <button onClick={onClick} style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2,
      background: active ? 'rgb(58,58,60)' : 'none',
      border: 'none',
      borderRadius: '999px',
      padding: '6px 22px', cursor: 'pointer', color: active ? 'var(--text)' : 'var(--text-dim)',
      transition: 'background 0.2s',
    }}>
      {icon}
      <span style={{ fontSize: 10, fontWeight: 500 }}>{label}</span>
    </button>
  );
}
