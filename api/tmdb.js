/**
 * Vercel serverless function: the app talks to TMDB through here.
 * TMDB isn't reachable from Russia, Vercel's servers are — so the phone only
 * ever talks to binge-gold.vercel.app. The key stays on the server
 * (Vercel → Settings → Environment Variables → TMDB_API_KEY, no VITE_ prefix).
 *
 *   GET /api/tmdb?q=Акира            → up to 12 matches: { id, type, title, year, poster }
 *   GET /api/tmdb?img=/abc.jpg&s=w342 → the poster image itself (cached for a year)
 *   GET /api/tmdb?details=603&type=movie → { overview, runtime, genres, vote, original, year }
 */
const API = 'https://api.themoviedb.org/3';
const SIZES = new Set(['w92', 'w154', 'w185', 'w342', 'w500', 'w780']);

function auth() {
  const key = (process.env.TMDB_API_KEY || '').trim();
  if (!key) return null;
  // v4 "API Read Access Token" (a JWT) goes in a header, the short v3 key in the URL
  return key.startsWith('eyJ') ? { headers: { Authorization: `Bearer ${key}` }, param: '' } : { headers: {}, param: `&api_key=${key}` };
}

async function search(query, a) {
  const url = `${API}/search/multi?query=${encodeURIComponent(query)}&language=ru-RU&include_adult=false&page=1${a.param}`;
  const r = await fetch(url, { headers: a.headers });
  if (!r.ok) throw new Error(`TMDB ${r.status}`);
  const data = await r.json();
  return (data.results || [])
    .filter((x) => x.media_type === 'movie' || x.media_type === 'tv')
    .map((x) => ({
      id: x.id,
      type: x.media_type,
      title: x.title || x.name || '',
      original: x.original_title || x.original_name || '',
      year: (x.release_date || x.first_air_date || '').slice(0, 4),
      poster: x.poster_path || null,
      popularity: x.popularity || 0,
    }));
}

async function details(id, type, a) {
  const r = await fetch(`${API}/${type}/${id}?language=ru-RU${a.param}`, { headers: a.headers });
  if (!r.ok) throw new Error(`TMDB ${r.status}`);
  const x = await r.json();
  return {
    overview: x.overview || '',
    // movies have runtime; series — the length of an episode and the number of seasons
    runtime: type === 'movie' ? (x.runtime || null) : ((x.episode_run_time || [])[0] || null),
    seasons: type === 'tv' ? (x.number_of_seasons || null) : null,
    genres: (x.genres || []).map((g) => g.name.toLowerCase()),
    vote: x.vote_count ? Math.round(x.vote_average * 10) / 10 : null,
    original: x.original_title || x.original_name || '',
    year: (x.release_date || x.first_air_date || '').slice(0, 4),
  };
}

export default async function handler(req, res) {
  const { q, img, s } = req.query;

  if (req.query.details) {
    const a = auth();
    if (!a) return res.status(503).json({ error: 'TMDB_API_KEY is not set' });
    const id = Number(req.query.details);
    const type = req.query.type === 'tv' ? 'tv' : 'movie';
    if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: 'bad id' });
    try {
      res.setHeader('Cache-Control', 'public, s-maxage=604800');
      return res.status(200).json(await details(id, type, a));
    } catch (e) {
      return res.status(502).json({ error: String(e.message || e) });
    }
  }

  if (img) {
    const size = SIZES.has(s) ? s : 'w342';
    if (!/^\/[A-Za-z0-9_-]+\.(jpg|jpeg|png|webp)$/.test(img)) return res.status(400).end();
    const r = await fetch(`https://image.tmdb.org/t/p/${size}${img}`);
    if (!r.ok) return res.status(r.status).end();
    res.setHeader('Content-Type', r.headers.get('content-type') || 'image/jpeg');
    // The same path never changes — let browsers and Vercel's CDN keep it
    res.setHeader('Cache-Control', 'public, max-age=31536000, s-maxage=31536000, immutable');
    return res.status(200).send(Buffer.from(await r.arrayBuffer()));
  }

  if (typeof q === 'string' && q.trim()) {
    const a = auth();
    if (!a) return res.status(503).json({ error: 'TMDB_API_KEY is not set' });
    try {
      let results = await search(q.trim(), a);
      // "Шерлок Холмс (две части…)" → try again without the note in brackets
      if (!results.length && /[([]/.test(q)) {
        const plain = q.replace(/[([].*?[)\]]/g, '').trim();
        if (plain) results = await search(plain, a);
      }
      // Ones with a poster first; otherwise keep TMDB's relevance order
      results.sort((x, y) => (y.poster ? 1 : 0) - (x.poster ? 1 : 0));
      res.setHeader('Cache-Control', 'public, s-maxage=86400');
      return res.status(200).json({ results: results.slice(0, 12) });
    } catch (e) {
      return res.status(502).json({ error: String(e.message || e) });
    }
  }

  return res.status(400).json({ error: 'q or img required' });
}
