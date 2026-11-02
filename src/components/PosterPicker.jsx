import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { posterUrl, searchPosters } from '../lib/posters';

/**
 * "Выбрать постер": search TMDB (prefilled with the film's name), tap a poster to use it.
 * onPick(result | null) — result is { id, type, poster, … } from the search
 */
export default function PosterPicker({ film, onPick, onClose }) {
  const [query, setQuery] = useState(film.name);
  const [state, setState] = useState({ loading: true, results: [], error: '' });

  const run = async (q) => {
    if (!q.trim()) return;
    setState((s) => ({ ...s, loading: true, error: '' }));
    try {
      const results = (await searchPosters(q)).filter((r) => r.poster);
      setState({ loading: false, results, error: results.length ? '' : 'Ничего не нашлось — попробуй другое название, можно на английском' });
    } catch (e) {
      setState({ loading: false, results: [], error: e.message });
    }
  };
  useEffect(() => { run(film.name); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const stop = (e) => e.stopPropagation();
  return createPortal(
    <div onTouchStart={stop} onTouchMove={stop} onTouchEnd={stop} onClick={stop}>
      <div className="sheet-backdrop" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 520, animation: 'fadeIn 0.2s ease' }} onClick={onClose} />
      <div className="glass sheet-panel" style={{
        position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 520,
        borderRadius: '28px 28px 0 0', padding: '14px 22px 28px', zIndex: 521, maxHeight: '88dvh', display: 'flex', flexDirection: 'column',
        animation: 'slideUp 0.35s cubic-bezier(0.34,1.26,0.64,1)',
      }}>
        <div className="sheet-handle" style={{ width: 36, height: 4, borderRadius: 2, margin: '0 auto 18px', flexShrink: 0 }} />
        <div className="d-title" style={{ marginBottom: 16 }}>Постер</div>
        <form onSubmit={(e) => { e.preventDefault(); run(query); }} style={{ display: 'flex', gap: 8, marginBottom: 14, flexShrink: 0 }}>
          <input className="d-field" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Название фильма" />
          <button type="submit" className="d-btn" style={{ width: 46, flexShrink: 0, padding: 0 }} aria-label="Искать">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
          </button>
        </form>

        <div style={{ overflowY: 'auto', minHeight: 160, margin: '0 -4px', padding: '0 4px' }}>
          {state.loading ? (
            <div className="d-label" style={{ textAlign: 'center', padding: '50px 0' }}>Ищу…</div>
          ) : state.error ? (
            <div className="d-label" style={{ textAlign: 'center', padding: '40px 10px', lineHeight: '19px' }}>{state.error}</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              {state.results.map((r) => {
                const on = r.poster === film.poster;
                return (
                  <button key={`${r.type}-${r.id}`} type="button" onClick={() => onPick(r)} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}>
                    <div style={{ aspectRatio: '2 / 3', borderRadius: 14, overflow: 'hidden', background: '#2C2C2C', boxShadow: on ? '0 0 0 3px #171717, 0 0 0 5px #351E88' : 'none' }}>
                      <img src={posterUrl(r.poster, 'w185')} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                    </div>
                    <div style={{ color: '#fff', fontSize: 13, fontWeight: 700, lineHeight: '16px', marginTop: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.title}</div>
                    <div style={{ color: '#515151', fontSize: 12, fontWeight: 700 }}>{[r.year, r.type === 'tv' ? 'сериал' : ''].filter(Boolean).join(' · ')}</div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 16, flexShrink: 0 }}>
          {film.poster && <button type="button" className="d-btn danger" onClick={() => onPick(null)}>Убрать постер</button>}
          <button type="button" className="d-btn ghost" onClick={onClose}>Отмена</button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
