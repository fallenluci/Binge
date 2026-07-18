import { useState, useEffect, useRef } from 'react';
import { getCategories } from '../store';

export default function HomePage({ onOpenCategory, refreshKey }) {
  const [cats, setCats] = useState([]);
  const [searchMode, setSearchMode] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const searchInputRef = useRef(null);

  useEffect(() => { setCats(getCategories()); }, [refreshKey]);

  useEffect(() => {
    if (searchMode) {
      // Focus once the morph animation has mostly settled, for a smoother feel
      const t = setTimeout(() => searchInputRef.current?.focus(), 200);
      return () => clearTimeout(t);
    }
  }, [searchMode]);

  const doSearch = (q) => {
    setQuery(q);
    if (!q.trim()) { setResults([]); return; }
    const res = [];
    getCategories().forEach(cat => cat.films.forEach(film => {
      if (film.name.toLowerCase().includes(q.toLowerCase())) res.push({ film, cat });
    }));
    setResults(res);
  };

  const closeSearch = () => { setSearchMode(false); setQuery(''); setResults([]); };
  const EASE = 'cubic-bezier(0.4,0,0.2,1)';

  return (
    <div className="page dotted-bg" style={{ paddingBottom: 140 }}>
      {/* Top bar — search pill morphs from a small circle into the full bar */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '56px 24px 0', gap: 10, overflow: 'hidden' }}>
        {/* Logo — collapses away smoothly when searching */}
        <div style={{
          flexBasis: searchMode ? 0 : 120, flexGrow: 0, flexShrink: 0,
          overflow: 'hidden', whiteSpace: 'nowrap',
          fontSize: 40, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.5px',
          opacity: searchMode ? 0 : 1,
          transition: `flex-basis 0.4s ${EASE}, opacity 0.22s ease`,
        }}>Dori</div>

        {/* Spacer — pushes search+profile to the right edge; collapses when searching */}
        <div style={{
          flexGrow: searchMode ? 0 : 1, flexShrink: 1, flexBasis: 0,
          transition: `flex-grow 0.4s ${EASE}`,
        }} />

        {/* Search pill — grows via flex-grow to fill the freed space */}
        <div
          className="glass"
          onClick={() => !searchMode && setSearchMode(true)}
          style={{
            display: 'flex', alignItems: 'center', height: 42, borderRadius: 999,
            flexBasis: 42, flexGrow: searchMode ? 1 : 0, flexShrink: 0,
            overflow: 'hidden', cursor: searchMode ? 'default' : 'pointer',
            paddingLeft: searchMode ? 16 : 12, paddingRight: searchMode ? 10 : 12,
            transition: `flex-grow 0.4s ${EASE}, padding 0.4s ${EASE}`,
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-dim)" strokeWidth="2.5" strokeLinecap="round" style={{ flexShrink: 0 }}>
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            ref={searchInputRef}
            value={query}
            onChange={e => doSearch(e.target.value)}
            placeholder="Search"
            style={{
              background: 'none', border: 'none', outline: 'none', color: 'var(--text)',
              fontSize: 16, fontFamily: 'inherit', minWidth: 0,
              flex: searchMode ? 1 : '0 0 0px',
              marginLeft: searchMode ? 10 : 0,
              opacity: searchMode ? 1 : 0,
              transition: `opacity 0.2s ease ${searchMode ? '0.15s' : '0s'}, flex-basis 0.3s ${EASE}, margin 0.3s ${EASE}`,
            }}
          />
          <button
            onClick={e => { e.stopPropagation(); closeSearch(); }}
            style={{
              background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', fontSize: 16,
              flexShrink: 0, width: searchMode ? 20 : 0, overflow: 'hidden',
              opacity: searchMode ? 1 : 0,
              transition: `opacity 0.2s ease ${searchMode ? '0.15s' : '0s'}, width 0.3s ${EASE}`,
            }}
          >✕</button>
        </div>

        {/* Profile — collapses away smoothly when searching */}
        <div className="glass" style={{
          flexBasis: searchMode ? 0 : 42, flexGrow: 0, flexShrink: 0,
          height: 42, borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          overflow: 'hidden', opacity: searchMode ? 0 : 1,
          transition: `flex-basis 0.4s ${EASE}, opacity 0.22s ease`,
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="var(--text-dim)" style={{ flexShrink: 0 }}>
            <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
          </svg>
        </div>
      </div>

      {/* Search results — shown directly below the header row */}
      {searchMode && query && (
        <div style={{ padding: '10px 24px 0' }}>
          {results.length > 0 ? (
            <div className="glass" style={{ borderRadius: 16, overflow: 'hidden' }}>
              {results.map(({ film, cat }) => (
                <div key={`${cat.id}-${film.id}`} style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                  <div style={{ fontSize: 15, color: 'var(--text)', fontWeight: 500 }}>{film.name}</div>
                  <div style={{ fontSize: 12, color: cat.color, marginTop: 2 }}>{cat.name}{film.rating !== null ? ` · ${film.rating}/10` : ''}</div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ color: 'var(--text-dim)', fontSize: 14, padding: '4px 4px 10px' }}>Ничего не найдено</div>
          )}
        </div>
      )}

      <div style={{ padding: '20px 16px 0', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {cats.length === 0 && (
          <div className="glass" style={{ borderRadius: 28, padding: '60px 24px', textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🎬</div>
            <div style={{ fontSize: 20, fontWeight: 500, color: 'var(--text)', marginBottom: 6 }}>Пока пусто</div>
            <div style={{ fontSize: 15, color: 'var(--text-dim)' }}>Нажми + чтобы добавить категорию</div>
          </div>
        )}

        {cats.map(cat => {
          const pos = cat.imagePosition || { x: 50, y: 50, scale: 100 };
          const scale = pos.scale ?? 100;
          return (
            <div
              key={cat.id}
              onClick={() => onOpenCategory(cat.id)}
              style={{
                cursor: 'pointer',
                height: 160,
                borderRadius: 28,
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                transition: 'transform 0.2s cubic-bezier(0.25,0.46,0.45,0.94)',
                background: cat.image
                  ? `url(${cat.image}) ${pos.x}% ${pos.y}%/${scale}% no-repeat`
                  : cat.color,
              }}
              onTouchStart={e => e.currentTarget.style.transform = 'scale(0.97)'}
              onTouchEnd={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              <div style={{
                position: 'absolute', inset: 0,
                background: cat.image ? 'rgba(0,0,0,0.4)' : 'linear-gradient(to bottom, rgba(0,0,0,0.05), rgba(0,0,0,0.25))',
              }} />
              <span style={{
                position: 'relative', zIndex: 1, fontSize: 28, fontWeight: 700, color: '#fff',
                letterSpacing: '-0.5px', textAlign: 'center', padding: '0 20px',
                textShadow: '0 2px 12px rgba(0,0,0,0.4)',
              }}>{cat.name}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
