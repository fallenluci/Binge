import { useState, useRef, useEffect } from 'react';
import { getCategories, addFilm, addCategory, CATEGORY_COLORS } from '../store';

const HomeIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
    <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
  </svg>
);

const RandIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="8" cy="8" r="2" fill="currentColor" stroke="none"/>
    <circle cx="16" cy="8" r="1.2" fill="currentColor" stroke="none"/>
    <circle cx="12" cy="14" r="2.5" fill="currentColor" stroke="none"/>
    <circle cx="7" cy="15" r="1" fill="currentColor" stroke="none"/>
    <circle cx="17" cy="15" r="1.5" fill="currentColor" stroke="none"/>
  </svg>
);

const SearchIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
  </svg>
);

export default function Island({ activePage, onChangePage, onRefresh }) {
  const [searchMode, setSearchMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [plusOpen, setPlusOpen] = useState(false);
  const [showAddFilm, setShowAddFilm] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newFilmName, setNewFilmName] = useState('');
  const [newCatName, setNewCatName] = useState('');
  const [selectedCatId, setSelectedCatId] = useState('');
  const [selectedColor, setSelectedColor] = useState(CATEGORY_COLORS[0]);
  const [categories, setCategories] = useState([]);
  const [plusMenuY, setPlusMenuY] = useState(120);
  const searchRef = useRef(null);
  const plusRef = useRef(null);

  const refreshCats = () => setCategories(getCategories());
  useEffect(() => { refreshCats(); }, []);

  const handleSearch = (q) => {
    setSearchQuery(q);
    if (!q.trim()) { setSearchResults([]); return; }
    const cats = getCategories();
    const results = [];
    cats.forEach(cat => {
      cat.films.forEach(film => {
        if (film.name.toLowerCase().includes(q.toLowerCase())) {
          results.push({ film, cat });
        }
      });
    });
    setSearchResults(results);
  };

  const handleAddFilmSubmit = () => {
    if (!newFilmName.trim() || !selectedCatId) return;
    addFilm(selectedCatId, newFilmName.trim());
    setNewFilmName('');
    setShowAddFilm(false);
    onRefresh();
  };

  const handleAddCategorySubmit = () => {
    if (!newCatName.trim()) return;
    addCategory(newCatName.trim(), selectedColor);
    setNewCatName('');
    setShowAddCategory(false);
    refreshCats();
    onRefresh();
  };

  return (
    <>
      {/* Plus menu */}
      {plusOpen && (
        <>
          <div className="overlay" onClick={() => setPlusOpen(false)} />
          <div className="plus-menu" style={{ bottom: 110, right: 20 }}>
            <div className="plus-menu-item" onClick={() => { setPlusOpen(false); refreshCats(); setShowAddFilm(true); }}>
              <div className="plus-menu-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="3"/>
                  <path d="M8 12h8M12 8v8"/>
                </svg>
              </div>
              New film
            </div>
            <div className="plus-menu-item" onClick={() => { setPlusOpen(false); setShowAddCategory(true); }}>
              <div className="plus-menu-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
                {cat.name} {film.rating !== null ? `· ${film.rating}/10` : ''}
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
              <SearchIcon />
              <input
                ref={searchRef}
                autoFocus
                className="island-search-input"
                placeholder="Поиск фильмов..."
                value={searchQuery}
                onChange={e => handleSearch(e.target.value)}
              />
              {searchQuery ? (
                <button className="island-search-clear" onClick={() => { setSearchQuery(''); setSearchResults([]); }}>✕</button>
              ) : (
                <button className="island-search-clear" onClick={() => { setSearchMode(false); setSearchQuery(''); setSearchResults([]); }}>✕</button>
              )}
            </>
          ) : (
            <>
              <button
                className={`island-btn ${activePage === 'home' ? 'active' : ''}`}
                onClick={() => onChangePage('home')}
              >
                <HomeIcon />
                Home
              </button>
              <button
                className={`island-btn ${activePage === 'rand' ? 'active' : ''}`}
                onClick={() => onChangePage('rand')}
              >
                <RandIcon />
                Rand
              </button>
              <button
                className="island-btn"
                onClick={() => { setSearchMode(true); }}
              >
                <SearchIcon />
              </button>
            </>
          )}
        </div>

        {/* Plus button */}
        {!searchMode && (
          <button
            ref={plusRef}
            className={`island-plus ${plusOpen ? 'open' : ''}`}
            onClick={() => { setPlusOpen(!plusOpen); refreshCats(); }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14M5 12h14"/>
            </svg>
          </button>
        )}
      </div>

      {/* Add Film Modal */}
      {showAddFilm && (
        <>
          <div className="sheet-overlay modal-overlay" onClick={() => setShowAddFilm(false)} />
          <div className="modal-sheet">
            <div className="sheet-handle" />
            <div className="modal-title">Новый фильм</div>
            <input
              autoFocus
              className="modal-input"
              placeholder="Название фильма"
              value={newFilmName}
              onChange={e => setNewFilmName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddFilmSubmit()}
            />
            {/* Category selector */}
            <div style={{ background: 'white', borderRadius: 12, overflow: 'hidden', marginBottom: 12 }}>
              {categories.map(cat => (
                <div
                  key={cat.id}
                  onClick={() => setSelectedCatId(cat.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '13px 16px',
                    borderBottom: '1px solid rgba(0,0,0,0.06)',
                    cursor: 'pointer',
                    background: selectedCatId === cat.id ? 'rgba(0,122,255,0.06)' : 'white',
                  }}
                >
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
            <button className="modal-btn primary" onClick={handleAddFilmSubmit}>Добавить</button>
            <button className="modal-btn secondary" onClick={() => setShowAddFilm(false)}>Отмена</button>
          </div>
        </>
      )}

      {/* Add Category Modal */}
      {showAddCategory && (
        <>
          <div className="sheet-overlay modal-overlay" onClick={() => setShowAddCategory(false)} />
          <div className="modal-sheet">
            <div className="sheet-handle" />
            <div className="modal-title">Новая категория</div>
            <input
              autoFocus
              className="modal-input"
              placeholder="Название категории"
              value={newCatName}
              onChange={e => setNewCatName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddCategorySubmit()}
            />
            <div style={{ background: 'white', borderRadius: 12, padding: '12px 16px', marginBottom: 12 }}>
              <div style={{ fontSize: 13, color: 'rgba(0,0,0,0.45)', marginBottom: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Цвет</div>
              <div className="color-picker">
                {CATEGORY_COLORS.map(color => (
                  <div
                    key={color}
                    className={`color-dot ${selectedColor === color ? 'selected' : ''}`}
                    style={{ background: color }}
                    onClick={() => setSelectedColor(color)}
                  />
                ))}
              </div>
            </div>
            <button className="modal-btn primary" onClick={handleAddCategorySubmit}>Создать</button>
            <button className="modal-btn secondary" onClick={() => setShowAddCategory(false)}>Отмена</button>
          </div>
        </>
      )}
    </>
  );
}
