import { useState, useRef, useEffect } from 'react';
import { getCategories, addFilm, addCategory, CATEGORY_COLORS } from '../store';

const HomeIcon = ({ active }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path d="M3 12L12 4L21 12V21H15V15H9V21H3V12Z"
      fill={active ? '#fff' : 'rgba(255,255,255,0.6)'}
      stroke={active ? '#fff' : 'rgba(255,255,255,0.6)'}
      strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round"/>
  </svg>
);

// Rounded hexagon
const HexIcon = ({ active }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path d="M12 2.5L20.5 7.25V16.75L12 21.5L3.5 16.75V7.25L12 2.5Z"
      fill="none"
      stroke={active ? '#fff' : 'rgba(255,255,255,0.6)'}
      strokeWidth="2" strokeLinejoin="round"/>
  </svg>
);

const PlusIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <line x1="12" y1="4" x2="12" y2="20" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
    <line x1="4" y1="12" x2="20" y2="12" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
  </svg>
);

export default function Island({ activePage, onChangePage, onRefresh }) {
  const [plusOpen, setPlusOpen] = useState(false);
  const [showAddFilm, setShowAddFilm] = useState(false);
  const [showAddCat, setShowAddCat] = useState(false);
  const [searchMode, setSearchMode] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [filmName, setFilmName] = useState('');
  const [catName, setCatName] = useState('');
  const [selCatId, setSelCatId] = useState('');
  const [selColor, setSelColor] = useState(CATEGORY_COLORS[0]);
  const [cats, setCats] = useState([]);

  const refreshCats = () => setCats(getCategories());
  useEffect(() => { refreshCats(); }, []);

  const doSearch = (q) => {
    setQuery(q);
    if (!q.trim()) { setResults([]); return; }
    const res = [];
    getCategories().forEach(cat => cat.films.forEach(film => {
      if (film.name.toLowerCase().includes(q.toLowerCase())) res.push({ film, cat });
    }));
    setResults(res);
  };

  const submitFilm = () => {
    if (!filmName.trim() || !selCatId) return;
    addFilm(selCatId, filmName.trim());
    setFilmName(''); setShowAddFilm(false); onRefresh();
  };

  const submitCat = () => {
    if (!catName.trim()) return;
    addCategory(catName.trim(), selColor);
    setCatName(''); setShowAddCat(false); refreshCats(); onRefresh();
  };

  return (
    <>
      {/* Plus menu */}
      {plusOpen && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 50 }} onClick={() => setPlusOpen(false)} />
          <div style={{
            position: 'fixed', bottom: 108, left: '50%', transform: 'translateX(-50%)',
            background: 'rgba(40,40,40,0.95)', backdropFilter: 'blur(20px)',
            borderRadius: 20, overflow: 'hidden', zIndex: 200, minWidth: 220,
            animation: 'popIn 0.25s cubic-bezier(0.34,1.56,0.64,1)',
            border: '1px solid rgba(255,255,255,0.12)',
          }}>
            <div onClick={() => { setPlusOpen(false); refreshCats(); setShowAddFilm(true); }}
              style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 20px', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.08)', color: 'white', fontSize: 17 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="3"/>
                  <line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
                </svg>
              </div>
              New film
            </div>
            <div onClick={() => { setPlusOpen(false); setShowAddCat(true); }}
              style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 20px', cursor: 'pointer', color: 'white', fontSize: 17 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                </svg>
              </div>
              New category
            </div>
          </div>
        </>
      )}

      {/* Search results */}
      {searchMode && query && results.length > 0 && (
        <div style={{
          position: 'fixed', bottom: 108, left: '50%', transform: 'translateX(-50%)',
          width: 340, maxHeight: '50vh', overflowY: 'auto',
          background: 'rgba(28,28,30,0.95)', backdropFilter: 'blur(20px)',
          borderRadius: 20, zIndex: 99,
          border: '1px solid rgba(255,255,255,0.1)',
        }}>
          {results.map(({ film, cat }) => (
            <div key={`${cat.id}-${film.id}`} style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ fontSize: 15, color: 'white', fontWeight: 500 }}>{film.name}</div>
              <div style={{ fontSize: 12, color: cat.color, marginTop: 2 }}>
                {cat.name}{film.rating !== null ? ` · ${film.rating}/10` : ''}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Island */}
      <div style={{ position: 'fixed', bottom: 32, left: '50%', transform: 'translateX(-50%)', zIndex: 100 }}>
        {searchMode ? (
          <div style={{
            background: 'rgba(28,28,28,0.95)', backdropFilter: 'blur(20px)',
            borderRadius: 100, height: 60, padding: '0 20px',
            display: 'flex', alignItems: 'center', gap: 10,
            width: 'min(340px, 85vw)',
            border: '1px solid rgba(255,255,255,0.12)',
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input autoFocus value={query} onChange={e => doSearch(e.target.value)}
              placeholder="Search"
              style={{ background: 'none', border: 'none', outline: 'none', color: 'white', fontSize: 16, flex: 1, fontFamily: 'inherit' }} />
            <button onClick={() => { setSearchMode(false); setQuery(''); setResults([]); }}
              style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: 18 }}>✕</button>
          </div>
        ) : (
          <div style={{
            background: 'rgba(28,28,28,0.95)', backdropFilter: 'blur(20px)',
            borderRadius: 100, height: 60, padding: '0 8px',
            display: 'flex', alignItems: 'center', gap: 4,
            border: '1px solid rgba(255,255,255,0.1)',
          }}>
            {/* Home */}
            <button onClick={() => onChangePage('home')} style={{
              background: activePage === 'home' ? 'rgba(255,255,255,0.15)' : 'none',
              border: 'none', borderRadius: 100, width: 52, height: 48,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', transition: 'background 0.2s',
            }}>
              <HomeIcon active={activePage === 'home'} />
            </button>

            {/* Hex / Rand */}
            <button onClick={() => onChangePage('rand')} style={{
              background: activePage === 'rand' ? 'rgba(255,255,255,0.15)' : 'none',
              border: 'none', borderRadius: 100, width: 52, height: 48,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', transition: 'background 0.2s',
            }}>
              <HexIcon active={activePage === 'rand'} />
            </button>

            {/* Plus */}
            <button onClick={() => { setPlusOpen(!plusOpen); refreshCats(); }} style={{
              background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 100,
              width: 52, height: 48,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', transition: 'all 0.2s',
            }}>
              <PlusIcon />
            </button>
          </div>
        )}
      </div>

      {/* Add Film */}
      {showAddFilm && (
        <>
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 399 }} onClick={() => setShowAddFilm(false)} />
          <div style={{
            position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
            width: 390, background: '#1c1c1e', borderRadius: '20px 20px 0 0',
            padding: '16px 20px 48px', zIndex: 400,
            animation: 'slideUp 0.35s cubic-bezier(0.34,1.26,0.64,1)',
          }}>
            <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.2)', margin: '0 auto 20px' }} />
            <div style={{ fontSize: 17, fontWeight: 600, textAlign: 'center', color: 'white', marginBottom: 20 }}>Новый фильм</div>
            <input autoFocus value={filmName} onChange={e => setFilmName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submitFilm()}
              placeholder="Название фильма"
              style={{ width: '100%', padding: '14px 16px', borderRadius: 12, border: 'none', background: 'rgba(255,255,255,0.1)', fontSize: 16, fontFamily: 'inherit', outline: 'none', color: 'white', marginBottom: 12 }} />
            <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 12, overflow: 'hidden', marginBottom: 12 }}>
              {cats.map(cat => (
                <div key={cat.id} onClick={() => setSelCatId(cat.id)} style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px',
                  borderBottom: '1px solid rgba(255,255,255,0.06)', cursor: 'pointer',
                  background: selCatId === cat.id ? 'rgba(255,255,255,0.1)' : 'transparent',
                }}>
                  <div style={{ width: 12, height: 12, borderRadius: '50%', background: cat.color }} />
                  <span style={{ fontSize: 16, flex: 1, color: 'white' }}>{cat.name}</span>
                  {selCatId === cat.id && <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#007AFF" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>}
                </div>
              ))}
            </div>
            <button onClick={submitFilm} style={{ width: '100%', padding: 14, borderRadius: 12, border: 'none', background: '#007AFF', color: 'white', fontSize: 16, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Добавить</button>
            <button onClick={() => setShowAddFilm(false)} style={{ width: '100%', padding: 14, borderRadius: 12, border: 'none', background: 'rgba(255,255,255,0.1)', color: 'white', fontSize: 16, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', marginTop: 8 }}>Отмена</button>
          </div>
        </>
      )}

      {/* Add Category */}
      {showAddCat && (
        <>
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 399 }} onClick={() => setShowAddCat(false)} />
          <div style={{
            position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
            width: 390, background: '#1c1c1e', borderRadius: '20px 20px 0 0',
            padding: '16px 20px 48px', zIndex: 400,
            animation: 'slideUp 0.35s cubic-bezier(0.34,1.26,0.64,1)',
          }}>
            <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.2)', margin: '0 auto 20px' }} />
            <div style={{ fontSize: 17, fontWeight: 600, textAlign: 'center', color: 'white', marginBottom: 20 }}>Новая категория</div>
            <input autoFocus value={catName} onChange={e => setCatName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submitCat()}
              placeholder="Название категории"
              style={{ width: '100%', padding: '14px 16px', borderRadius: 12, border: 'none', background: 'rgba(255,255,255,0.1)', fontSize: 16, fontFamily: 'inherit', outline: 'none', color: 'white', marginBottom: 12 }} />
            <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 12, padding: '12px 16px', marginBottom: 12 }}>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', marginBottom: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Цвет</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 10 }}>
                {CATEGORY_COLORS.map(c => (
                  <div key={c} onClick={() => setSelColor(c)} style={{
                    width: 38, height: 38, borderRadius: '50%', background: c, cursor: 'pointer', margin: '0 auto',
                    border: selColor === c ? '3px solid white' : '3px solid transparent',
                    transform: selColor === c ? 'scale(1.15)' : 'scale(1)',
                    transition: 'all 0.2s',
                  }} />
                ))}
              </div>
            </div>
            <button onClick={submitCat} style={{ width: '100%', padding: 14, borderRadius: 12, border: 'none', background: '#007AFF', color: 'white', fontSize: 16, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Создать</button>
            <button onClick={() => setShowAddCat(false)} style={{ width: '100%', padding: 14, borderRadius: 12, border: 'none', background: 'rgba(255,255,255,0.1)', color: 'white', fontSize: 16, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', marginTop: 8 }}>Отмена</button>
          </div>
        </>
      )}

      <style>{`
        @keyframes popIn { from{opacity:0;transform:translateX(-50%) scale(0.9)} to{opacity:1;transform:translateX(-50%) scale(1)} }
        @keyframes slideUp { from{transform:translateX(-50%) translateY(100%)} to{transform:translateX(-50%) translateY(0)} }
      `}</style>
    </>
  );
}
