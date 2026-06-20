import { useState, useRef, useEffect } from 'react';
import { getCategories, addFilm, addCategory, CATEGORY_COLORS } from '../store';

export default function Island({ activePage, onChangePage, onRefresh }) {
  const [searchMode, setSearchMode] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [plusOpen, setPlusOpen] = useState(false);
  const [showAddFilm, setShowAddFilm] = useState(false);
  const [showAddCat, setShowAddCat] = useState(false);
  const [filmName, setFilmName] = useState('');
  const [catName, setCatName] = useState('');
  const [selCatId, setSelCatId] = useState('');
  const [selColor, setSelColor] = useState(CATEGORY_COLORS[0]);
  const [cats, setCats] = useState([]);
  const inputRef = useRef(null);

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

  // pill position
  const homeActive = activePage === 'home';
  const pillStyle = { left: homeActive ? 4 : 88, width: homeActive ? 84 : 80 };

  return (
    <>
      {/* Plus menu */}
      {plusOpen && (
        <>
          <div className="overlay" onClick={() => setPlusOpen(false)} />
          <div className="plus-menu" style={{ bottom: 108 }}>
            <div className="plus-menu-item" onClick={() => { setPlusOpen(false); refreshCats(); setShowAddFilm(true); }}>
              <div className="plus-menu-icon">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="3"/>
                  <line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
                </svg>
              </div>
              New film
            </div>
            <div className="plus-menu-item" onClick={() => { setPlusOpen(false); setShowAddCat(true); }}>
              <div className="plus-menu-icon">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
        <div className="search-results">
          {results.map(({ film, cat }) => (
            <div key={`${cat.id}-${film.id}`} className="search-result-item">
              <div className="search-result-name">{film.name}</div>
              <div className="search-result-cat" style={{ color: cat.color }}>
                {cat.name}{film.rating !== null ? ` · ${film.rating}/10` : ''}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="island-wrap">
        {searchMode ? (
          /* Search mode — full width island */
          <div className="island search" style={{ width: 'min(340px, 85vw)' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(0,0,0,0.55)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input ref={inputRef} autoFocus className="island-search-input"
              placeholder="Search" value={query} onChange={e => doSearch(e.target.value)} />
            <button onClick={() => { setSearchMode(false); setQuery(''); setResults([]); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0, padding: 2 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(0,0,0,0.55)" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        ) : (
          <>
            {/* Main island with Home + Rand */}
            <div className="island" style={{ width: 172 }}>
              <div className="island-pill" style={pillStyle} />
              <button className="island-tab" onClick={() => onChangePage('home')}>
                <svg width="26" height="26" viewBox="0 0 24 24" fill={homeActive ? '#0000FF' : '#000'}>
                  <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
                </svg>
                <span className="island-tab-label" style={{ color: homeActive ? '#0000FF' : '#000' }}>Home</span>
              </button>
              <button className="island-tab" onClick={() => onChangePage('rand')}>
                <svg width="24" height="22" viewBox="0 0 24 22">
                  <circle cx="10" cy="9" r="4.5" fill={!homeActive ? '#0000FF' : '#000'}/>
                  <circle cx="18" cy="6" r="3" fill={!homeActive ? '#0000FF' : '#000'}/>
                  <circle cx="6" cy="17" r="2" fill={!homeActive ? '#0000FF' : '#000'}/>
                  <circle cx="18" cy="16" r="2.5" fill={!homeActive ? '#0000FF' : '#000'}/>
                  <circle cx="13" cy="18" r="1.5" fill={!homeActive ? '#0000FF' : '#000'}/>
                </svg>
                <span className="island-tab-label" style={{ color: !homeActive ? '#0000FF' : '#000' }}>Rand</span>
              </button>
            </div>

            {/* Search circle */}
            <button className="island-circle" onClick={() => setSearchMode(true)}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
            </button>
          </>
        )}
      </div>

      {/* Plus button — top right of screen, controlled separately */}
      {/* (handled inside topbar of each page for now) */}

      {/* Add Film Modal */}
      {showAddFilm && (
        <>
          <div className="modal-overlay" onClick={() => setShowAddFilm(false)} />
          <div className="modal-sheet">
            <div className="modal-handle" />
            <div className="modal-title">Новый фильм</div>
            <input autoFocus className="modal-input" placeholder="Название фильма"
              value={filmName} onChange={e => setFilmName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submitFilm()} />
            <div style={{ background: 'white', borderRadius: 12, overflow: 'hidden', marginBottom: 12 }}>
              {cats.map(cat => (
                <div key={cat.id} onClick={() => setSelCatId(cat.id)} style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px',
                  borderBottom: '1px solid rgba(0,0,0,0.06)', cursor: 'pointer',
                  background: selCatId === cat.id ? 'rgba(0,122,255,0.06)' : 'white',
                }}>
                  <div style={{ width: 12, height: 12, borderRadius: '50%', background: cat.color }} />
                  <span style={{ fontSize: 16, flex: 1 }}>{cat.name}</span>
                  {selCatId === cat.id && (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#007AFF" strokeWidth="2.5" strokeLinecap="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  )}
                </div>
              ))}
              {cats.length === 0 && <div style={{ padding: '14px 16px', color: 'rgba(0,0,0,0.4)', fontSize: 15 }}>Сначала создай категорию</div>}
            </div>
            <button className="modal-btn primary" onClick={submitFilm}>Добавить</button>
            <button className="modal-btn secondary" onClick={() => setShowAddFilm(false)}>Отмена</button>
          </div>
        </>
      )}

      {/* Add Category Modal */}
      {showAddCat && (
        <>
          <div className="modal-overlay" onClick={() => setShowAddCat(false)} />
          <div className="modal-sheet">
            <div className="modal-handle" />
            <div className="modal-title">Новая категория</div>
            <input autoFocus className="modal-input" placeholder="Название категории"
              value={catName} onChange={e => setCatName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submitCat()} />
            <div style={{ background: 'white', borderRadius: 12, padding: '12px 16px', marginBottom: 12 }}>
              <div style={{ fontSize: 13, color: 'rgba(0,0,0,0.45)', marginBottom: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Цвет</div>
              <div className="color-picker">
                {CATEGORY_COLORS.map(c => (
                  <div key={c} className={`color-dot${selColor === c ? ' sel' : ''}`}
                    style={{ background: c }} onClick={() => setSelColor(c)} />
                ))}
              </div>
            </div>
            <button className="modal-btn primary" onClick={submitCat}>Создать</button>
            <button className="modal-btn secondary" onClick={() => setShowAddCat(false)}>Отмена</button>
          </div>
        </>
      )}
    </>
  );
}
