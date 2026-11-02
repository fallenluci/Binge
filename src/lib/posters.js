import { getCategories, updateFilm } from '../store';

/**
 * Film posters from TMDB (through our /api/tmdb function, see api/tmdb.js).
 * A film keeps the TMDB poster path in `poster`; `posterChecked` marks that the
 * search was done (so films without a match aren't searched again and again);
 * `posterManual` — the user picked it in "Выбрать постер".
 */
export const posterUrl = (path, size = 'w342') => (path ? `/api/tmdb?img=${encodeURIComponent(path)}&s=${size}` : null);

export async function searchPosters(query) {
  const r = await fetch(`/api/tmdb?q=${encodeURIComponent(query)}`);
  if (!r.ok) throw new Error(r.status === 503 ? 'Постеры не настроены: нет ключа TMDB' : 'Не удалось связаться с TMDB');
  const data = await r.json();
  return data.results || [];
}

// Description, runtime, genres… of a film (cached on the film as `info` after the first load)
export async function loadInfo(film) {
  let id = film.tmdbId, type = film.tmdbType;
  if (!id) {
    // Films that got their poster before ids were stored: find the same poster again
    const found = await searchPosters(film.name);
    const hit = found.find((x) => film.poster && x.poster === film.poster) || found[0];
    if (!hit) return { id: null, info: null };
    id = hit.id; type = hit.type;
  }
  const r = await fetch(`/api/tmdb?details=${id}&type=${type || 'movie'}`);
  if (!r.ok) throw new Error('Не удалось загрузить описание');
  return { id, type, info: await r.json() };
}

// Background filler: finds posters for films that were never searched, one by one.
let running = false;
let disabled = false;
export async function fillMissingPosters(onUpdate) {
  if (running || disabled) return;
  running = true;
  try {
    for (;;) {
      const todo = [];
      getCategories().forEach((c) => c.films.forEach((f) => { if (!f.posterChecked) todo.push({ c, f }); }));
      if (!todo.length) break;
      const { c, f } = todo[0];
      let found;
      try {
        found = await searchPosters(f.name);
      } catch {
        disabled = true; // no key / offline / TMDB down — try again on the next app start
        break;
      }
      const hit = found.find((x) => x.poster);
      updateFilm(c.id, f.id, { poster: hit?.poster || null, tmdbId: hit?.id || null, tmdbType: hit?.type || null, posterChecked: true });
      onUpdate?.();
      await new Promise((r) => setTimeout(r, 250)); // be gentle with TMDB
    }
  } finally {
    running = false;
  }
}
