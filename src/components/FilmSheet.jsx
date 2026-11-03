import { useEffect, useState } from 'react';
import { ratingColor, updateFilm } from '../store';
import { loadInfo, posterUrl } from '../lib/posters';
import { useIsDesktop } from '../lib/useIsDesktop';

export const fmtRuntime = (min) => {
  if (!min) return '';
  const h = Math.floor(min / 60), m = min % 60;
  return h ? `${h} ч${m ? ` ${m} мин` : ''}` : `${m} мин`;
};
const seasonsWord = (n) => (n % 10 === 1 && n % 100 !== 11 ? 'сезон' : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 12 || n % 100 > 14) ? 'сезона' : 'сезонов');

/**
 * Film menu ("variant 1"): poster on the left with title, year, runtime, genres and
 * ratings next to it, the TMDB description below, then the actions.
 * Description & co. are loaded from TMDB once and kept on the film (`info`).
 */
// readOnly — opened from a profile: just the info, no editing; onOpenCategory adds a link to its category
export default function FilmSheet({ film, categoryId, onRate, onPoster, onRename, onDelete, onClose, onChanged, readOnly, onOpenCategory, categoryName, onAdd }) {
  const desktop = useIsDesktop(); // desktop: a bigger window with a bigger poster
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(film.name);
  const [info, setInfo] = useState(film.info || null);
  const [loading, setLoading] = useState(!film.info);

  useEffect(() => {
    if (film.info) return;
    let alive = true;
    loadInfo(film)
      .then(({ id, type, info: i }) => {
        if (!alive) return;
        setInfo(i);
        // Keep it on my own film; someone else's film (public profile) is only shown
        if (i && categoryId) { updateFilm(categoryId, film.id, { info: i, tmdbId: id, tmdbType: type }); onChanged?.(); }
      })
      .catch(() => {})
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const saveName = () => {
    const n = name.trim();
    setEditing(false);
    if (n && n !== film.name) onRename(n);
  };

  const rc = film.rating != null ? ratingColor(film.rating) : null;
  const meta1 = info && [info.year, info.runtime ? (info.seasons ? `серии по ${fmtRuntime(info.runtime)}` : fmtRuntime(info.runtime)) : '', info.seasons ? `${info.seasons} ${seasonsWord(info.seasons)}` : ''].filter(Boolean).join(' · ');
  const genres = info?.genres?.slice(0, 3).join(', ');
  const icon = (d, size = 18, color = '#fff') => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">{d}</svg>;
  const posterPath = <><rect x="4" y="2" width="16" height="20" rx="3" /><path d="m4 16 4.5-4.5a2 2 0 0 1 2.8 0L18 18" /><circle cx="15" cy="7.5" r="1.5" /></>;
  const roundIcon = { width: 46, height: 46, flexShrink: 0, padding: 0, borderRadius: '50%' };

  return (
    <>
      <div className="sheet-backdrop" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 300 }} onClick={onClose} />
      <div className="glass sheet-panel film-sheet" style={{
        position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: 430, borderRadius: '28px 28px 0 0',
        padding: '14px 22px 34px', zIndex: 301, animation: 'slideUp 0.32s cubic-bezier(0.34,1.26,0.64,1)', maxHeight: '88dvh', overflowY: 'auto',
      }}>
        <div className="sheet-handle" style={{ width: 36, height: 4, borderRadius: 2, margin: '0 auto 18px' }} />

        <div style={{ display: 'flex', gap: desktop ? 22 : 16 }}>
          {film.poster && (
            <div onClick={readOnly ? undefined : onPoster} style={{ position: 'relative', flexShrink: 0, cursor: readOnly ? 'default' : 'pointer' }}>
              <img src={posterUrl(film.poster, desktop ? 'w342' : 'w185')} alt="" style={{ width: desktop ? 170 : 96, height: desktop ? 255 : 144, borderRadius: desktop ? 16 : 12, objectFit: 'cover', display: 'block', background: '#2C2C2C' }} />
              {/* Tap the poster to pick another one */}
              {!readOnly && <div style={{ position: 'absolute', right: 5, bottom: 5, width: 26, height: 26, borderRadius: '50%', background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{icon(posterPath, 14)}</div>}
            </div>
          )}
          <div style={{ flex: 1, minWidth: 0, paddingTop: film.poster ? 4 : 0 }}>
            {editing ? (
              <input autoFocus className="d-field" value={name} onChange={(e) => setName(e.target.value)} maxLength={120}
                onKeyDown={(e) => { if (e.key === 'Enter') saveName(); if (e.key === 'Escape') { e.stopPropagation(); setName(film.name); setEditing(false); } }}
                onBlur={saveName} style={{ fontSize: desktop ? 24 : 20, fontWeight: 800 }} />
            ) : (
              // My own film: tap the title to rename it right here
              <div onClick={readOnly || !onRename ? undefined : () => { setName(film.name); setEditing(true); }}
                title={readOnly ? undefined : 'Нажми, чтобы переименовать'} style={{
                  color: '#fff', fontSize: desktop ? 32 : 24, lineHeight: desktop ? '38px' : '30px', fontWeight: 800, letterSpacing: '-0.3px', overflowWrap: 'anywhere',
                  cursor: readOnly ? 'default' : 'text',
                  ...(readOnly ? {} : { textDecoration: 'underline dashed #3A3A3C', textDecorationThickness: 1.5, textUnderlineOffset: 5 }),
                }}>{film.name}</div>
            )}
            {info?.original && info.original.toLowerCase() !== film.name.toLowerCase() && (
              <div style={{ color: '#515151', fontSize: desktop ? 15 : 13, fontWeight: 700, marginTop: 3 }}>{info.original}</div>
            )}
            {meta1 && <div style={{ color: '#8E8E93', fontSize: desktop ? 16 : 14, fontWeight: 700, marginTop: desktop ? 12 : 8 }}>{meta1}</div>}
            {genres && <div style={{ color: '#8E8E93', fontSize: desktop ? 16 : 14, fontWeight: 700, marginTop: 2 }}>{genres}</div>}
            {(rc || info?.vote) && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 12 }}>
                {rc && <span className="rating-pill" style={{ fontSize: 13, minWidth: 30, height: 24, padding: '0 9px', color: rc, background: `${rc}20` }}>{film.rating}</span>}
                {info?.vote && <span style={{ color: '#8E8E93', fontSize: desktop ? 15 : 13, fontWeight: 700 }}><span style={{ color: '#F5C451' }}>★</span> {String(info.vote).replace('.', ',')} TMDB</span>}
              </div>
            )}
          </div>
        </div>

        {/* Description */}
        {loading ? (
          <div style={{ margin: '18px 0 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[100, 94, 70].map((w) => <div key={w} style={{ height: 12, width: `${w}%`, borderRadius: 6, background: '#232323' }} />)}
          </div>
        ) : info?.overview ? (
          <div style={{ margin: desktop ? '24px 0 26px' : '18px 0 22px', color: '#DCDCE0', fontSize: desktop ? 17 : 16, lineHeight: desktop ? '26px' : '24px', fontWeight: 500 }}>{info.overview}</div>
        ) : (
          <div style={{ height: 20 }} />
        )}

        {readOnly ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {/* A film a friend sent in the chat: add it to one of my categories */}
            {onAdd && <button className="d-btn primary" onClick={onAdd}>Добавить себе</button>}
            {onOpenCategory && (
              <button className="d-btn" onClick={onOpenCategory}>
                {categoryName ? `Открыть категорию · ${categoryName}` : 'Открыть категорию'}
              </button>
            )}
          </div>
        ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button className="d-btn primary" onClick={onRate} style={{ flex: 1, minWidth: 0, borderRadius: 23 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
            {film.rating != null ? 'Изменить оценку' : 'Оценить'}
          </button>
          <button type="button" aria-label="Постер" title="Постер" className="d-btn" onClick={onPoster} style={roundIcon}>{icon(posterPath)}</button>
          <button type="button" aria-label="Удалить фильм" title="Удалить фильм" className="d-btn danger" onClick={onDelete} style={roundIcon}>
            {icon(<><path d="M3 6h18" /><path d="M8 6V4h8v2" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /></>, 20, '#FF453A')}
          </button>
        </div>
        )}
      </div>
    </>
  );
}
