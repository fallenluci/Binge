import { useState, useRef } from 'react';
import { getCategories, importCategories } from '../store';
import { parseFilmList, readTextFile } from '../lib/importList';
import ImportDialog from './ImportDialog';
import CroppedImage from './CroppedImage';
import { useIsDesktop } from '../lib/useIsDesktop';

const EASE = 'cubic-bezier(0.32,0.72,0,1)'; // iOS-like: quick start, long soft finish
const DUR = '0.42s';

/**
 * Shared header for Home and Random: logo, morphing search pill, profile button
 * and the search results list. Keeping it in one place guarantees the icons look
 * identical on every page and search works everywhere.
 *
 * floatingResults — render results as an overlay under the header instead of in
 * the page flow (Random has full-screen centered content that must not shift).
 */
export default function TopBar({ onOpenCategory, onProfile, onRefresh, profile, badge = 0, floatingResults = false }) {
  const [searchMode, setSearchMode] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const searchInputRef = useRef(null);
  const desktop = useIsDesktop();
  // Desktop only: import categories and films from a .txt list
  const importRef = useRef(null);
  const [importing, setImporting] = useState(null); // { fileName, groups, summary }

  const onImportFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const groups = parseFilmList(await readTextFile(file));
    setImporting({ fileName: file.name, groups, summary: groups.length ? importCategories(groups, { dryRun: true }) : null });
  };
  const confirmImport = () => {
    importCategories(importing.groups);
    setImporting(null);
    onRefresh?.();
  };

  const doSearch = (q) => {
    setQuery(q);
    if (!q.trim()) { setResults([]); return; }
    const res = [];
    getCategories().forEach(cat => cat.films.forEach(film => {
      if (film.name.toLowerCase().includes(q.toLowerCase())) res.push({ film, cat });
    }));
    setResults(res);
  };

  // Focus right inside the tap (iOS only opens the keyboard from a user gesture)
  const openSearch = () => { if (searchMode) return; setSearchMode(true); searchInputRef.current?.focus({ preventScroll: true }); };
  const closeSearch = () => { searchInputRef.current?.blur(); setSearchMode(false); setQuery(''); setResults([]); };

  const resultsBlock = searchMode && query && (
    <div style={floatingResults
      ? { position: 'absolute', top: '100%', left: 0, right: 0, padding: desktop ? '10px 0 0' : '10px 24px 0', maxHeight: '55dvh', overflowY: 'auto' }
      : { padding: desktop ? '12px 0 0' : '10px 24px 0' }}>
      {results.length > 0 ? (
        <div className="glass" style={{ borderRadius: 16, overflow: 'hidden' }}>
          {results.map(({ film, cat }) => (
            <div
              key={`${cat.id}-${film.id}`}
              onClick={() => { onOpenCategory?.(cat.id); closeSearch(); }}
              style={{ padding: '12px 16px', cursor: 'pointer' }}
            >
              <div style={{ fontSize: 15, color: 'var(--text)', fontWeight: 500 }}>{film.name}</div>
              <div style={{ fontSize: 12, color: cat.color, marginTop: 2 }}>{cat.name}{film.rating !== null ? ` · ${film.rating}/10` : ''}</div>
            </div>
          ))}
        </div>
      ) : (
        <div className={floatingResults ? 'glass' : undefined} style={floatingResults
          ? { color: 'var(--text-dim)', fontSize: 14, padding: '12px 16px', borderRadius: 16 }
          : { color: 'var(--text-dim)', fontSize: 14, padding: '4px 4px 10px' }}>Ничего не найдено</div>
      )}
    </div>
  );

  return (
    // Desktop (Figma 1440 frame): 769px column, buttons 147px from the top, larger logo
    <div style={{ position: 'relative', zIndex: 5, ...(desktop && { maxWidth: 769, margin: '0 auto' }) }}>
      {/* Top bar. The row itself never changes size — only opacity and a clip-path
          animate (both cheap for the browser), so opening search is smooth: the
          search circle grows into the full bar over the faded logo and buttons. */}
      <div style={{ padding: desktop ? 'calc(min(147px, 14.4dvh) - 15px) 0 0' : 'calc(56px + var(--top-shift)) 24px 0' }}>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <div style={{
            flexShrink: 0, whiteSpace: 'nowrap',
            fontSize: desktop ? 60 : 40, fontWeight: 800, color: 'var(--text)', letterSpacing: desktop ? '-0.75px' : '-0.5px',
            opacity: searchMode ? 0 : 1, transition: 'opacity 0.25s ease',
          }}>Dori</div>

          <div style={{ flex: 1 }} />

          {/* Import from .txt (desktop only) */}
          {desktop && (
            <button onClick={() => importRef.current?.click()} aria-label="Загрузить список из файла" title="Загрузить список из .txt" className="glass" style={{
              width: 42, height: 42, flexShrink: 0, marginRight: 10, borderRadius: '50%', border: 'none', padding: 0, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              opacity: searchMode ? 0 : 1, pointerEvents: searchMode ? 'none' : 'auto', transition: 'opacity 0.25s ease',
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-dim)" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20V5M5.5 11.5 12 5l6.5 6.5" />
              </svg>
            </button>
          )}

          {/* Place of the search circle in the row (the real one is the overlay below) */}
          <div style={{ width: 42, height: 42, flexShrink: 0, marginRight: 10 }} />

          <div style={{ position: 'relative', flexShrink: 0 }}>
          <button onClick={onProfile} aria-label="Профиль" className="glass" style={{
          width: 42, flexShrink: 0,
          height: 42, borderRadius: '50%', border: 'none', padding: 0, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          overflow: 'hidden', opacity: searchMode ? 0 : 1, pointerEvents: searchMode ? 'none' : 'auto',
          transition: `opacity 0.25s ease`,
        }}>
          {profile?.avatar ? (
            <CroppedImage src={profile.avatar} pos={profile.avatarPos} style={{ width: 42, height: 42, borderRadius: '50%', flexShrink: 0 }} />
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="var(--text-dim)" style={{ flexShrink: 0 }}>
              <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
            </svg>
          )}
        </button>
          {/* Friend requests / categories sent to me */}
          {badge > 0 && !searchMode && <span style={{ position: 'absolute', top: -2, right: -2, minWidth: 18, height: 18, padding: '0 5px', borderRadius: 9, background: '#FF3B30', color: '#fff', fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 0 2px #000', pointerEvents: 'none' }}>{badge}</span>}
          </div>

          {/* Search: one full-width bar, clipped to the 42px circle while closed */}
          <div
            className="glass"
            onClick={openSearch}
            style={{
              position: 'absolute', left: 0, right: 0, top: '50%', height: 42, marginTop: -21, borderRadius: 21,
              cursor: searchMode ? 'default' : 'pointer',
              clipPath: searchMode ? 'inset(0 0 0 0 round 21px)' : 'inset(0 52px 0 calc(100% - 94px) round 21px)',
              WebkitClipPath: searchMode ? 'inset(0 0 0 0 round 21px)' : 'inset(0 52px 0 calc(100% - 94px) round 21px)',
              transition: `clip-path ${DUR} ${EASE}, -webkit-clip-path ${DUR} ${EASE}`,
              willChange: 'clip-path',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-dim)" strokeWidth="2.5" strokeLinecap="round"
              style={{ position: 'absolute', top: 13, left: searchMode ? 16 : 'calc(100% - 81px)', transition: `left ${DUR} ${EASE}` }}>
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              ref={searchInputRef}
              value={query}
              onChange={e => doSearch(e.target.value)}
              onKeyDown={e => e.key === 'Escape' && closeSearch()}
              placeholder="Search"
              tabIndex={searchMode ? 0 : -1}
              style={{
                position: 'absolute', left: 42, right: 40, top: 0, height: 42,
                background: 'none', border: 'none', outline: 'none', color: 'var(--text)',
                fontSize: 16, fontFamily: 'inherit', padding: 0,
                opacity: searchMode ? 1 : 0, pointerEvents: searchMode ? 'auto' : 'none',
                transition: `opacity 0.2s ease ${searchMode ? '0.22s' : '0s'}`,
              }}
            />
            <button
              aria-label="Закрыть поиск"
              onClick={e => { e.stopPropagation(); closeSearch(); }}
              tabIndex={searchMode ? 0 : -1}
              style={{
                position: 'absolute', right: 6, top: 6, width: 30, height: 30, borderRadius: '50%',
                background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', fontSize: 16,
                opacity: searchMode ? 1 : 0, pointerEvents: searchMode ? 'auto' : 'none',
                transition: `opacity 0.2s ease ${searchMode ? '0.22s' : '0s'}`,
              }}
            >✕</button>
          </div>
        </div>
      </div>

      {resultsBlock}

      {desktop && <input ref={importRef} type="file" accept=".txt,text/plain" hidden onChange={onImportFile} />}
      {importing && (
        <ImportDialog
          fileName={importing.fileName}
          summary={importing.summary}
          onConfirm={confirmImport}
          onClose={() => setImporting(null)}
        />
      )}
    </div>
  );
}
