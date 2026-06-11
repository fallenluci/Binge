import { useState, useRef, useEffect } from 'react';
import { getCategories, addFilm, addCategory, CATEGORY_COLORS } from '../store';

export default function Island({ activePage, onChangePage, onRefresh }) {
  const [searchMode, setSearchMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [plusOpen, setPlusOpen] = useState(false);
  const [showAddFilm, setShowAddFilm] = useState(false);
  const [showAddCat, setShowAddCat] = useState(false);
  const [newFilmName, setNewFilmName] = useState('');
  const [newCatName, setNewCatName] = useState('');
  const [selectedCatId, setSelectedCatId] = useState('');
  const [selectedColor, setSelectedColor] = useState(CATEGORY_COLORS[0]);
  const [categories, setCategories] = useState([]);

  const refreshCats = () => setCategories(getCategories());
  useEffect(() => { refreshCats(); }, []);

  const handleSearch = (q) => {
    setSearchQuery(q);
    if (!q.trim()) { setSearchResults([]); return; }
    const results = [];
    getCategories().forEach(cat => {
      cat.films.forEach(film => {
        if (film.name.toLowerCase().includes(q.toLowerCase())) {
          results.push({ film, cat });
        }
      });
    });
    setSearchResults(results);
  };

  const handleAddFilm = () => {
    if (!newFilmName.trim() || !selectedCatId) return;
    addFilm(selectedCatId, newFilmName.trim());
    setNewFilmName(''); setShowAddFilm(false); onRefresh();
  };

  const handleAddCat = () => {
    if (!newCatName.trim()) return;
    addCategory(newCatName.trim(), selectedColor);
    setNewCatName(''); setShowAddCat(false); refreshCats(); onRefresh();
  };

  return (
    <>
      {/* Plus menu */}
      {plusOpen && (
        <>
          <div className="overlay" onClick={() => setPlusOpen(false)} />
          <div className="plus-menu">
            <div className="plus-menu-item" onClick={() => { setPlusOpen(false); refreshCats(); setShowAddFilm(true); }}>
              <div className="plus-menu-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="3"/>
                  <line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
                </svg>
              </div>
              New film
            </div>
            <div className="plus-menu-item" onClick={() => { setPlusOpen(false); setShowAddCat(true); }}>
              <div className="plus-menu-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                </svg>
              </div>
              New category
            </div>
          </div>
        </>
      )}

      {/* Search results */}
      {searchMode && searchQuery && searchResults.length > 0 && (
        <div className="search-results">
          {searchResults.map(({ film, cat }) => (
            <div key={`${cat.id}-${film.id}`} className="search-result-item">
              <div className="search-result-name">{film.name}</div>
              <div className="search-result-cat" style={{ color: cat.color }}>
                {cat.name}{film.rating !== null ? ` · ${film.rating}/10` : ''}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Island */}
      <div className="island-wrap">
        <div className={`island ${searchMode ? 'search-mode' : ''}`}>
          {searchMode ? (
            <>
              {/* Search icon */}
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(0,0,0,0.55)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <input
                autoFocus
                className="island-search-input"
                placeholder="Search"
                value={searchQuery}
                onChange={e => handleSearch(e.target.value)}
              />
              {/* Close X */}
              <button
                onClick={() => { setSearchMode(false); setSearchQuery(''); setSearchResults([]); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, flexShrink: 0 }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(0,0,0,0.55)" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </>
          ) : (
            <>
              {/* Active pill */}
              <div className={`island-active-pill ${activePage === 'rand' ? 'rand' : ''}`} />

              {/* Home */}
              <button className="island-btn" onClick={() => onChangePage('home')}>
                <svg width="30" height="30" viewBox="0 0 30 30" fill="none">
                  <path d="M4 14L15 4L26 14V26H19V19H11V26H4V14Z"
                    fill={activePage === 'home' ? '#0000FF' : '#000'}
                    stroke={activePage === 'home' ? '#0000FF' : '#000'}
                    strokeWidth="1.5" strokeLinejoin="round"/>
                </svg>
                <span className={`island-btn-label ${activePage !== 'home' ? 'inactive' : ''}`}>Home</span>
              </button>

              {/* Rand */}
              <button className="island-btn" onClick={() => onChangePage('rand')}>
                <svg width="24" height="22" viewBox="0 0 24 22" fill="none">
                  <circle cx="10" cy="10" r="5" fill={activePage === 'rand' ? '#0000FF' : '#000'}/>
                  <circle cx="18" cy="7" r="3.5" fill={activePage === 'rand' ? '#0000FF' : '#000'}/>
                  <circle cx="6" cy="17" r="2.5" fill={activePage === 'rand' ? '#0000FF' : '#000'}/>
                  <circle cx="18" cy="17" r="2" fill={activePage === 'rand' ? '#0000FF' : '#000'}/>
                  <circle cx="13" cy="19" r="1.5" fill={activePage === 'rand' ? '#0000FF' : '#000'}/>
                </svg>
                <span className={`island-btn-label ${activePage !== 'rand' ? 'inactive' : ''}`}>Rand</span>
              </button>
            </>
          )}
        </div>

        {/* Search / Plus button */}
        {!searchMode ? (
          <button
            className={`island-plus ${plusOpen ? 'open' : ''}`}
            onClick={() => { setPlusOpen(!plusOpen); refreshCats(); }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="3" strokeLinecap="round">
              <line x1="12" y1="4" x2="12" y2="20"/>
              <line x1="4" y1="12" x2="20" y2="12"/>
            </svg>
          </button>
        ) : null}

        {/* Search button when not in search mode — replaces plus visually in island-wrap */}
        {!searchMode && (
          <button
            className="island-plus"
            style={{ marginLeft: -10 }}
            onClick={() => { setPlusOpen(false); setSearchMode(true); }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
          </button>
        )}
      </div>

      {/* Add Film */}
      {showAddFilm && (
        <>
          <div className="sheet-overlay modal-overlay" onClick={() => setShowAddFilm(false)} />
          <div className="modal-sheet">
            <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(0,0,0,0.18)', margin: '0 auto 20px' }} />
            <div className="modal-title">Новый фильм</div>
            <input autoFocus className="modal-input" placeholder="Название фильма"
              value={newFilmName} onChange={e => setNewFilmName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddFilm()}
            />
            <div style={{ background: 'white', borderRadius: 12, overflow: 'hidden', marginBottom: 12 }}>
              {categories.map(cat => (
                <div key={cat.id} onClick={() => setSelectedCatId(cat.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px',
                    borderBottom: '1px solid rgba(0,0,0,0.06)', cursor: 'pointer',
                    background: selectedCatId === cat.id ? 'rgba(0,122,255,0.06)' : 'white',
                  }}>
                  <div style={{ width: 12, height: 12, borderRadius: '50%', background: cat.color }} />
                  <span style={{ fontSize: 16, flex: 1 }}>{cat.name}</span>
                  {selectedCatId === cat.id && (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#007AFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  )}
                </div>
              ))}
            </div>
            <button className="modal-btn primary" onClick={handleAddFilm}>Добавить</button>
            <button className="modal-btn secondary" onClick={() => setShowAddFilm(false)}>Отмена</button>
          </div>
        </>
      )}

      {/* Add Category */}
      {showAddCat && (
        <>
          <div className="sheet-overlay modal-overlay" onClick={() => setShowAddCat(false)} />
          <div className="modal-sheet">
            <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(0,0,0,0.18)', margin: '0 auto 20px' }} />
            <div className="modal-title">Новая категория</div>
            <input autoFocus className="modal-input" placeholder="Название категории"
              value={newCatName} onChange={e => setNewCatName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddCat()}
            />
            <div style={{ background: 'white', borderRadius: 12, padding: '12px 16px', marginBottom: 12 }}>
              <div style={{ fontSize: 13, color: 'rgba(0,0,0,0.45)', marginBottom: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Цвет</div>
              <div className="color-picker">
                {CATEGORY_COLORS.map(color => (
                  <div key={color} className={`color-dot ${selectedColor === color ? 'selected' : ''}`}
                    style={{ background: color }} onClick={() => setSelectedColor(color)} />
                ))}
              </div>
            </div>
            <button className="modal-btn primary" onClick={handleAddCat}>Создать</button>
            <button className="modal-btn secondary" onClick={() => setShowAddCat(false)}>Отмена</button>
          </div>
        </>
      )}
    </>
  );
}
