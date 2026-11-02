import { useMemo } from 'react';
import { getCategories, ratingColor } from '../store';
import CroppedImage from './CroppedImage';
import { coverCrop } from '../lib/cover';
import { posterUrl } from '../lib/posters';

// Profile statistics in the app's own style: #171717 cards, bold white numbers,
// grey #515151 labels, rating pills in the rating colours.
const CARD = '#171717';
const GREY = '#515151';

const plural = (n, one, few, many) => {
  const m10 = n % 10, m100 = n % 100;
  return m10 === 1 && m100 !== 11 ? one : m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14) ? few : many;
};
const fmt = (x) => (Math.round(x * 10) / 10).toString().replace('.', ',');

export function computeStats(cats) {
  const films = cats.flatMap((c) => c.films.map((f) => ({ ...f, cat: c })));
  const rated = films.filter((f) => f.rating != null);
  const avg = rated.length ? rated.reduce((s, f) => s + f.rating, 0) / rated.length : null;

  // Top 5: highest rating first; equal ratings keep the order they were added in
  const top = [...rated].sort((a, b) => b.rating - a.rating).slice(0, 5);

  // Favourite category: best average among categories with rated films
  // (needs 2+ rated films when any category has them); otherwise the biggest one.
  const perCat = cats.map((c) => {
    const r = c.films.filter((f) => f.rating != null);
    return { cat: c, count: c.films.length, rated: r.length, avg: r.length ? r.reduce((s, f) => s + f.rating, 0) / r.length : null };
  });
  const minRated = perCat.some((p) => p.rated >= 2) ? 2 : 1;
  const ranked = perCat.filter((p) => p.rated >= minRated).sort((a, b) => b.avg - a.avg || b.rated - a.rated);
  const favorite = ranked[0] || [...perCat].sort((a, b) => b.count - a.count).find((p) => p.count > 0) || null;

  return { total: films.length, rated: rated.length, avg, top, favorite };
}

function Tile({ cat, size }) {
  return (
    <div style={{ position: 'relative', overflow: 'hidden', width: size, height: size, borderRadius: size * 0.3, flexShrink: 0, background: cat.color }}>
      {cat.image && <CroppedImage src={cat.image} pos={coverCrop(cat)} style={{ position: 'absolute', inset: 0 }} />}
    </div>
  );
}

export default function ProfileStats({ desktop, onOpenCategory, refreshKey }) {
  const s = useMemo(() => computeStats(getCategories()), [refreshKey]); // eslint-disable-line react-hooks/exhaustive-deps
  const label = { color: GREY, fontSize: 14, fontWeight: 700, margin: '20px 0 8px 4px' };

  const numbers = [
    { value: s.total, caption: plural(s.total, 'фильм', 'фильма', 'фильмов') },
    { value: s.rated, caption: 'оценено' },
    { value: s.avg == null ? '—' : fmt(s.avg), caption: 'средняя', color: s.avg == null ? '#fff' : ratingColor(Math.round(s.avg)) },
  ];

  const statRow = (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: desktop ? 12 : 8 }}>
      {numbers.map((n) => (
        <div key={n.caption} style={{ background: CARD, borderRadius: 22, padding: desktop ? '20px 8px 18px' : '14px 6px 12px', textAlign: 'center' }}>
          <div style={{ color: n.color || '#fff', fontSize: desktop ? 34 : 28, lineHeight: desktop ? '36px' : '30px', fontWeight: 800, letterSpacing: '-0.5px' }}>{n.value}</div>
          <div style={{ color: GREY, fontSize: 12, fontWeight: 700, marginTop: 4 }}>{n.caption}</div>
        </div>
      ))}
    </div>
  );

  const fav = s.favorite && (
    <div>
      <div style={label}>Любимая категория</div>
      <div onClick={() => onOpenCategory?.(s.favorite.cat.id)} style={{ background: CARD, borderRadius: 22, padding: 10, display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer' }}>
        <Tile cat={s.favorite.cat} size={56} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ color: '#fff', fontSize: 18, lineHeight: '22px', fontWeight: 800, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.favorite.cat.name}</div>
          <div style={{ color: GREY, fontSize: 13, fontWeight: 700, marginTop: 3 }}>
            {s.favorite.count} {plural(s.favorite.count, 'фильм', 'фильма', 'фильмов')}
            {s.favorite.avg != null && <> · средняя <span style={{ color: ratingColor(Math.round(s.favorite.avg)) }}>{fmt(s.favorite.avg)}</span></>}
          </div>
        </div>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={GREY} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6, flexShrink: 0 }}><path d="m9 18 6-6-6-6" /></svg>
      </div>
    </div>
  );

  const top = (
    <div>
      <div style={label}>Топ-5</div>
      <div style={{ background: CARD, borderRadius: 22, padding: '6px 14px' }}>
        {s.top.length === 0 ? (
          <div style={{ color: GREY, fontSize: 14, fontWeight: 700, textAlign: 'center', padding: '18px 8px', lineHeight: '19px' }}>
            Оцени пару фильмов —<br />здесь появится твой топ
          </div>
        ) : s.top.map((f, i) => {
          const rc = ratingColor(f.rating);
          return (
            <div key={`${f.cat.id}-${f.id}`} onClick={() => onOpenCategory?.(f.cat.id)} style={{
              display: 'flex', alignItems: 'center', gap: 12, height: 56, cursor: 'pointer',
            }}>
              <span style={{ color: GREY, fontSize: 15, fontWeight: 800, width: 14, textAlign: 'center', flexShrink: 0 }}>{i + 1}</span>
              <Poster path={f.poster} w={30} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: '#fff', fontSize: 16, lineHeight: '19px', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</div>
              </div>
              <span className="rating-pill" style={{ fontSize: 13, minWidth: 30, height: 24, padding: '0 9px', color: rc, background: `${rc}20`, flexShrink: 0 }}>{f.rating}</span>
            </div>
          );
        })}
      </div>
    </div>
  );

  if (s.total === 0) {
    return (
      <div style={{ textAlign: 'center', paddingTop: desktop ? 60 : 50 }}>
        <div style={{ color: GREY, fontSize: 36, lineHeight: '36px', fontWeight: 800 }}>ПУСТО</div>
        <div style={{ color: GREY, fontSize: 13, fontWeight: 700, marginTop: 8 }}>Добавь фильмы — здесь появится статистика</div>
      </div>
    );
  }

  if (desktop) return <Wide s={s} statRow={statRow} label={label} onOpenCategory={onOpenCategory} />;

  return (
    <div>
      {statRow}
      {(
        <>
          {fav}
          {top}
        </>
      )}
    </div>
  );
}

// Small poster (2:3) for the phone list; an empty dark slot while there is none
function Poster({ path, w }) {
  return (
    <div style={{ width: w, height: w * 1.5, borderRadius: 6, flexShrink: 0, background: '#2C2C2C', overflow: 'hidden' }}>
      {path && <img src={posterUrl(path, 'w92')} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />}
    </div>
  );
}

// Desktop profile (wide layout): stats row, favourite category as a real home tile,
// top-5 as poster cards with big rank numbers.
function Wide({ s, statRow, label, onOpenCategory }) {
  const fav = s.favorite;
  return (
    <div>
      {statRow}
      <div style={{ display: 'grid', gridTemplateColumns: fav ? '300px 1fr' : '1fr', gap: 16, marginTop: 6 }}>
        {fav && (
          <div>
            <div style={label}>Любимая категория</div>
            <div onClick={() => onOpenCategory?.(fav.cat.id)} style={{
              height: 200, borderRadius: 26, position: 'relative', overflow: 'hidden', cursor: 'pointer', background: fav.cat.color,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '0 18px',
            }}>
              {fav.cat.image && <CroppedImage src={fav.cat.image} pos={coverCrop(fav.cat)} style={{ position: 'absolute', inset: 0 }} />}
              <div style={{ position: 'absolute', inset: 0, background: fav.cat.image ? 'rgba(0,0,0,0.4)' : 'linear-gradient(to bottom, rgba(0,0,0,0.05), rgba(0,0,0,0.25))' }} />
              <div style={{ position: 'relative', color: '#fff', fontSize: 32, lineHeight: '36px', fontWeight: 700, letterSpacing: '-0.5px', textShadow: '0 2px 12px rgba(0,0,0,0.4)' }}>{fav.cat.name}</div>
              <div style={{ position: 'relative', color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: 700, marginTop: 6 }}>
                {fav.count} {plural(fav.count, 'фильм', 'фильма', 'фильмов')}{fav.avg != null && ` · средняя ${fmt(fav.avg)}`}
              </div>
            </div>
          </div>
        )}
        <div>
          <div style={label}>Топ-5</div>
          {s.top.length === 0 ? (
            <div style={{ height: 200, borderRadius: 26, background: CARD, display: 'flex', alignItems: 'center', justifyContent: 'center', color: GREY, fontSize: 15, fontWeight: 700 }}>
              Оцени пару фильмов — здесь появится твой топ
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
              {s.top.map((f, i) => <TopCard key={`${f.cat.id}-${f.id}`} f={f} rank={i + 1} onClick={() => onOpenCategory?.(f.cat.id)} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TopCard({ f, rank, onClick }) {
  const rc = ratingColor(f.rating);
  const has = !!f.poster;
  return (
    <div onClick={onClick} style={{
      height: 200, borderRadius: 22, background: CARD, position: 'relative', overflow: 'hidden', cursor: 'pointer',
      padding: 14, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
    }}>
      {has && <img src={posterUrl(f.poster, 'w342')} alt="" loading="lazy" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />}
      {has && <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0) 30%, rgba(0,0,0,0.85) 100%)' }} />}
      <b style={{
        position: 'absolute', right: -6, top: -34, fontSize: 150, lineHeight: 1, fontWeight: 900, letterSpacing: -8,
        color: has ? 'rgba(255,255,255,0.22)' : '#232323', pointerEvents: 'none',
      }}>{rank}</b>
      <div style={{ position: 'relative', color: '#fff', fontSize: 17, lineHeight: '20px', fontWeight: 800, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', textShadow: has ? '0 1px 8px rgba(0,0,0,0.6)' : 'none' }}>{f.name}</div>
      <div style={{ position: 'relative', color: has ? 'rgba(255,255,255,0.65)' : GREY, fontSize: 12, fontWeight: 700, margin: '4px 0 10px' }}>{f.cat.name}</div>
      <span className="rating-pill" style={{ position: 'relative', alignSelf: 'flex-start', fontSize: 13, minWidth: 30, height: 24, padding: '0 9px', color: rc, background: has ? 'rgba(0,0,0,0.55)' : `${rc}20` }}>{f.rating}</span>
    </div>
  );
}
