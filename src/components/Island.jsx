import { useState, useEffect } from 'react';
import { getCategories, addFilm, addCategory, CATEGORY_COLORS } from '../store';

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

  const TabBtn = ({ id, label, icon }) => (
    <button onClick={() => onChangePage(id)} style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
      background: 'none', border: 'none', cursor: 'pointer', padding: '6px 18px',
      borderRight: '1px dashed rgba(237,230,214,0.25)',
    }}>
      {icon}
      <span style={{
        fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '1px',
        color: activePage === id ? 'var(--amber)' : 'var(--paper-dim)',
        textTransform: 'uppercase',
      }}>{label}</span>
    </button>
  );

  return (
    <>
      {plusOpen && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 50 }} onClick={() => setPlusOpen(false)} />
          <div style={{
            position: 'fixed', bottom: 116, left: '50%', transform: 'translateX(-50%)',
            background: 'var(--card)', border: '1px solid rgba(237,230,214,0.12)',
            borderRadius: 14, overflow: 'hidden', zIndex: 200, minWidth: 230,
            animation: 'popIn 0.22s cubic-bezier(0.34,1.5,0.64,1)',
          }}>
            <div onClick={() => { setPlusOpen(false); refreshCats(); setShowAddFilm(true); }}
              style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '15px 18px', cursor: 'pointer', borderBottom: '1px solid rgba(237,230,214,0.08)', color: 'var(--paper)' }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--safelight)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="4" x2="12" y2="20"/><line x1="4" y1="12" x2="20" y2="12"/></svg>
              </div>
              <span style={{ fontFamily: 'var(--display)', fontSize: 20, letterSpacing: '1px' }}>NEW FRAME</span>
            </div>
            <div onClick={() => { setPlusOpen(false); setShowAddCat(true); }}
              style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '15px 18px', cursor: 'pointer', color: 'var(--paper)' }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--amber)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--ink)" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="4" x2="12" y2="20"/><line x1="4" y1="12" x2="20" y2="12"/></svg>
              </div>
              <span style={{ fontFamily: 'var(--display)', fontSize: 20, letterSpacing: '1px' }}>NEW REEL</span>
            </div>
          </div>
        </>
      )}

      {searchMode && query && results.length > 0 && (
        <div style={{
          position: 'fixed', bottom: 116, left: '50%', transform: 'translateX(-50%)',
          width: 340, maxHeight: '48vh', overflowY: 'auto',
          background: 'var(--card)', border: '1px solid rgba(237,230,214,0.12)',
          borderRadius: 14, zIndex: 99,
        }}>
          {results.map(({ film, cat }) => (
            <div key={`${cat.id}-${film.id}`} style={{ padding: '12px 16px', borderBottom: '1px solid rgba(237,230,214,0.07)' }}>
              <div style={{ fontSize: 15, color: 'var(--paper)', fontWeight: 500 }}>{film.name}</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: cat.color, marginTop: 2 }}>
                {cat.name.toUpperCase()}{film.rating !== null ? ` · ${String(film.rating).padStart(2,'0')}` : ''}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Ticket-stub nav */}
      <div style={{ position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)', zIndex: 100 }}>
        {searchMode ? (
          <div style={{
            background: 'var(--card)', border: '1px solid rgba(237,230,214,0.15)',
            borderRadius: 14, height: 56, padding: '0 16px',
            display: 'flex', alignItems: 'center', gap: 10, width: 'min(330px, 84vw)',
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--paper-dim)" strokeWidth="2.5" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input autoFocus value={query} onChange={e => doSearch(e.target.value)} placeholder="Search the archive"
              style={{ background: 'none', border: 'none', outline: 'none', color: 'var(--paper)', fontSize: 15, flex: 1, fontFamily: 'inherit' }} />
            <button onClick={() => { setSearchMode(false); setQuery(''); setResults([]); }}
              style={{ background: 'none', border: 'none', color: 'var(--paper-dim)', cursor: 'pointer', fontSize: 16 }}>✕</button>
          </div>
        ) : (
          <div style={{
            background: 'var(--card)', border: '1px solid rgba(237,230,214,0.15)',
            borderRadius: 14, height: 56, display: 'flex', alignItems: 'stretch',
            position: 'relative', overflow: 'hidden',
          }}>
            {/* Tear notches */}
            <div style={{ position: 'absolute', left: -7, top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, borderRadius: '50%', background: 'var(--ink)' }} />
            <div style={{ position: 'absolute', right: -7, top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, borderRadius: '50%', background: 'var(--ink)' }} />

            <TabBtn id="home" label="Home" icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={activePage==='home'?'var(--amber)':'var(--paper-dim)'} strokeWidth="2" strokeLinejoin="round">
                <path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/>
              </svg>
            } />
            <button onClick={() => onChangePage('rand')} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
              background: 'none', border: 'none', cursor: 'pointer', padding: '6px 18px',
              borderRight: '1px dashed rgba(237,230,214,0.25)',
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={activePage==='rand'?'var(--amber)':'var(--paper-dim)'} strokeWidth="2">
                <circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="2" fill={activePage==='rand'?'var(--amber)':'var(--paper-dim)'}/>
                <line x1="12" y1="3" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="21"/>
                <line x1="3" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="21" y2="12"/>
              </svg>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '1px', color: activePage==='rand'?'var(--amber)':'var(--paper-dim)', textTransform: 'uppercase' }}>Spin</span>
            </button>
            <button onClick={() => setSearchMode(true)} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
              background: 'none', border: 'none', cursor: 'pointer', padding: '6px 18px',
              borderRight: '1px dashed rgba(237,230,214,0.25)',
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--paper-dim)" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '1px', color: 'var(--paper-dim)', textTransform: 'uppercase' }}>Find</span>
            </button>
            <button onClick={() => { setPlusOpen(!plusOpen); refreshCats(); }} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
              background: 'none', border: 'none', cursor: 'pointer', padding: '6px 18px',
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--safelight)" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="4" x2="12" y2="20"/><line x1="4" y1="12" x2="20" y2="12"/></svg>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '1px', color: 'var(--safelight)', textTransform: 'uppercase' }}>Add</span>
            </button>
          </div>
        )}
      </div>

      {/* Add Film Modal */}
      {showAddFilm && (
        <>
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 399 }} onClick={() => setShowAddFilm(false)} />
          <div style={{
            position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
            width: 390, background: 'var(--card)', borderRadius: '18px 18px 0 0',
            padding: '18px 20px 48px', zIndex: 400,
            animation: 'slideUp 0.32s cubic-bezier(0.34,1.26,0.64,1)',
            border: '1px solid rgba(237,230,214,0.1)', borderBottom: 'none',
          }}>
            <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(237,230,214,0.2)', margin: '0 auto 18px' }} />
            <div style={{ fontFamily: 'var(--display)', fontSize: 26, letterSpacing: '1px', textAlign: 'center', color: 'var(--paper)', marginBottom: 18 }}>NEW FRAME</div>
            <input autoFocus value={filmName} onChange={e => setFilmName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submitFilm()}
              placeholder="Film title"
              style={{ width: '100%', padding: '14px 16px', borderRadius: 10, border: '1px solid rgba(237,230,214,0.15)', background: 'rgba(237,230,214,0.05)', fontSize: 16, fontFamily: 'inherit', outline: 'none', color: 'var(--paper)', marginBottom: 12 }} />
            <div style={{ background: 'rgba(237,230,214,0.04)', borderRadius: 10, overflow: 'hidden', marginBottom: 14, border: '1px solid rgba(237,230,214,0.1)' }}>
              {cats.map(cat => (
                <div key={cat.id} onClick={() => setSelCatId(cat.id)} style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px',
                  borderBottom: '1px solid rgba(237,230,214,0.06)', cursor: 'pointer',
                  background: selCatId === cat.id ? 'rgba(217,142,44,0.1)' : 'transparent',
                }}>
                  <div style={{ width: 10, height: 10, borderRadius: 2, background: cat.color }} />
                  <span style={{ fontSize: 15, flex: 1, color: 'var(--paper)' }}>{cat.name}</span>
                  {selCatId === cat.id && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--amber)" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>}
                </div>
              ))}
              {cats.length === 0 && <div style={{ padding: '14px 16px', color: 'var(--paper-dim)', fontSize: 14 }}>Сначала создай категорию</div>}
            </div>
            <button onClick={submitFilm} style={{ width: '100%', padding: 14, borderRadius: 10, border: 'none', background: 'var(--safelight)', color: 'white', fontSize: 16, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Добавить</button>
            <button onClick={() => setShowAddFilm(false)} style={{ width: '100%', padding: 14, borderRadius: 10, border: 'none', background: 'transparent', color: 'var(--paper-dim)', fontSize: 15, cursor: 'pointer', fontFamily: 'inherit', marginTop: 6 }}>Отмена</button>
          </div>
        </>
      )}

      {/* Add Category Modal */}
      {showAddCat && (
        <>
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 399 }} onClick={() => setShowAddCat(false)} />
          <div style={{
            position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
            width: 390, background: 'var(--card)', borderRadius: '18px 18px 0 0',
            padding: '18px 20px 48px', zIndex: 400,
            animation: 'slideUp 0.32s cubic-bezier(0.34,1.26,0.64,1)',
            border: '1px solid rgba(237,230,214,0.1)', borderBottom: 'none',
          }}>
            <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(237,230,214,0.2)', margin: '0 auto 18px' }} />
            <div style={{ fontFamily: 'var(--display)', fontSize: 26, letterSpacing: '1px', textAlign: 'center', color: 'var(--paper)', marginBottom: 18 }}>NEW REEL</div>
            <input autoFocus value={catName} onChange={e => setCatName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submitCat()}
              placeholder="Reel name"
              style={{ width: '100%', padding: '14px 16px', borderRadius: 10, border: '1px solid rgba(237,230,214,0.15)', background: 'rgba(237,230,214,0.05)', fontSize: 16, fontFamily: 'inherit', outline: 'none', color: 'var(--paper)', marginBottom: 14 }} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 10, marginBottom: 16 }}>
              {CATEGORY_COLORS.map(c => (
                <div key={c} onClick={() => setSelColor(c)} style={{
                  width: 34, height: 34, borderRadius: 8, background: c, cursor: 'pointer', margin: '0 auto',
                  border: selColor === c ? '2px solid var(--paper)' : '2px solid transparent',
                  transform: selColor === c ? 'scale(1.15)' : 'scale(1)', transition: 'all 0.15s',
                }} />
              ))}
            </div>
            <button onClick={submitCat} style={{ width: '100%', padding: 14, borderRadius: 10, border: 'none', background: 'var(--amber)', color: 'var(--ink)', fontSize: 16, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Создать</button>
            <button onClick={() => setShowAddCat(false)} style={{ width: '100%', padding: 14, borderRadius: 10, border: 'none', background: 'transparent', color: 'var(--paper-dim)', fontSize: 15, cursor: 'pointer', fontFamily: 'inherit', marginTop: 6 }}>Отмена</button>
          </div>
        </>
      )}
    </>
  );
}
