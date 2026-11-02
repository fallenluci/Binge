import { useState, useEffect, useRef } from 'react';
import { getCategories, importCategories } from '../store';
import { parseFilmList, readTextFile } from '../lib/importList';
import ImportDialog from './ImportDialog';
import CroppedImage from './CroppedImage';
import { useIsDesktop } from '../lib/useIsDesktop';

const EASE = 'cubic-bezier(0.4,0,0.2,1)';

/**
 * Shared header for Home and Random: logo, morphing search pill, profile button
 * and the search results list. Keeping it in one place guarantees the icons look
 * identical on every page and search works everywhere.
 *
 * floatingResults — render results as an overlay under the header instead of in
 * the page flow (Random has full-screen centered content that must not shift).
 */
export default function TopBar({ onOpenCategory, onProfile, onRefresh, profile, floatingResults = false }) {
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
      {/* Top bar — search pill morphs from a small circle into the full bar */}
      <div style={{ display: 'flex', alignItems: 'center', padding: desktop ? 'calc(min(147px, 14.4dvh) - 15px) 0 0' : 'calc(56px + var(--top-shift)) 24px 0', overflow: 'hidden' }}>
        {/* Logo — collapses away smoothly when searching */}
        <div style={{
          flexBasis: searchMode ? 0 : (desktop ? 170 : 120), flexGrow: 0, flexShrink: 0,
          overflow: 'hidden', whiteSpace: 'nowrap',
          fontSize: desktop ? 60 : 40, fontWeight: 800, color: 'var(--text)', letterSpacing: desktop ? '-0.75px' : '-0.5px',
          opacity: searchMode ? 0 : 1,
          marginRight: searchMode ? 0 : 10,
          transition: `flex-basis 0.4s ${EASE}, opacity 0.22s ease, margin 0.4s ${EASE}`,
        }}>Dori</div>

        {/* Spacer — pushes search+profile to the right edge; collapses when searching */}
        <div style={{
          flexGrow: searchMode ? 0 : 1, flexShrink: 1, flexBasis: 0,
          transition: `flex-grow 0.4s ${EASE}`,
        }} />

        {/* Import from .txt (desktop only) — collapses away when searching like the profile button */}
        {desktop && (
          <button onClick={() => importRef.current?.click()} aria-label="Загрузить список из файла" title="Загрузить список из .txt" className="glass" style={{
            flexBasis: searchMode ? 0 : 42, flexGrow: 0, flexShrink: 0, marginRight: searchMode ? 0 : 10,
            height: 42, borderRadius: '50%', border: 'none', padding: 0, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            overflow: 'hidden', opacity: searchMode ? 0 : 1,
            transition: `flex-basis 0.4s ${EASE}, margin 0.4s ${EASE}, opacity 0.22s ease`,
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-dim)" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <path d="M12 20V5M5.5 11.5 12 5l6.5 6.5" />
            </svg>
          </button>
        )}

        {/* Search pill — grows via flex-grow to fill the freed space */}
        <div
          className="glass"
          onClick={() => !searchMode && setSearchMode(true)}
          style={{
            display: 'flex', alignItems: 'center', height: 42, borderRadius: 999,
            flexBasis: 42, flexGrow: searchMode ? 1 : 0, flexShrink: 0,
            overflow: 'hidden', cursor: searchMode ? 'default' : 'pointer',
            paddingLeft: searchMode ? 16 : 12, paddingRight: searchMode ? 10 : 12,
            marginRight: searchMode ? 0 : 10,
            transition: `flex-grow 0.4s ${EASE}, padding 0.4s ${EASE}, margin 0.4s ${EASE}`,
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
        <button onClick={onProfile} aria-label="Профиль" className="glass" style={{
          flexBasis: searchMode ? 0 : 42, flexGrow: 0, flexShrink: 0,
          height: 42, borderRadius: '50%', border: 'none', padding: 0, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          overflow: 'hidden', opacity: searchMode ? 0 : 1,
          transition: `flex-basis 0.4s ${EASE}, opacity 0.22s ease`,
        }}>
          {profile?.avatar ? (
            <CroppedImage src={profile.avatar} pos={profile.avatarPos} style={{ width: 42, height: 42, borderRadius: '50%', flexShrink: 0 }} />
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="var(--text-dim)" style={{ flexShrink: 0 }}>
              <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
            </svg>
          )}
        </button>
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
