import { useState, useEffect } from 'react';
import { getCategories } from '../store';

export default function HomePage({ onOpenCategory, refreshKey }) {
  const [cats, setCats] = useState([]);
  const [searchMode, setSearchMode] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);

  useEffect(() => { setCats(getCategories()); }, [refreshKey]);

  const doSearch = (q) => {
    setQuery(q);
    if (!q.trim()) { setResults([]); return; }
    const res = [];
    getCategories().forEach(cat => cat.films.forEach(film => {
      if (film.name.toLowerCase().includes(q.toLowerCase())) res.push({ film, cat });
    }));
    setResults(res);
  };

  return (
    <div className="page dotted-bg" style={{ paddingBottom: 140 }}>
      {/* Top bar — replaced entirely by search input when in search mode */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '56px 24px 0', gap: 10 }}>
        {searchMode ? (
          <div className="glass" style={{ borderRadius: 100, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10, flex: 1, height: 42 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-dim)" strokeWidth="2.5" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input autoFocus value={query} onChange={e => doSearch(e.target.value)} placeholder="Search"
              style={{ background: 'none', border: 'none', outline: 'none', color: 'var(--text)', fontSize: 16, flex: 1, fontFamily: 'inherit' }} />
            <button onClick={() => { setSearchMode(false); setQuery(''); setResults([]); }} style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', fontSize: 16, flexShrink: 0 }}>✕</button>
          </div>
        ) : (
          <>
            <div style={{ fontSize: 40, fontWeight: 700, color: 'var(--text)', letterSpacing: '-1.5px' }}>Dori</div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setSearchMode(true)} className="glass" style={{
                width: 42, height: 42, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text)" strokeWidth="2.3" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              </button>
              <div className="glass" style={{
                width: 42, height: 42, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="var(--text-dim)"><path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/></svg>
              </div>
            </div>
          </>
        )}
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
            <div style={{ fontSize: 20, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>Пока пусто</div>
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
