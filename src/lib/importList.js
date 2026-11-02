/**
 * Import of a plain-text film list (desktop only).
 *
 *   [Аниме]
 *   Акира
 *   Форма голоса
 *
 *   [Ужасы]
 *   Сияние
 *
 * A line in square brackets starts a category; every other non-empty line is a film
 * of the category above it. Films listed before the first header go to "Без категории".
 */
export const UNSORTED = 'Без категории';

export function parseFilmList(text) {
  const groups = [];
  let current = null;
  const groupFor = (name) => {
    const key = name.toLowerCase();
    let g = groups.find((x) => x.name.toLowerCase() === key);
    if (!g) { g = { name, films: [] }; groups.push(g); }
    return g;
  };
  for (const raw of text.replace(/^﻿/, '').split(/\r\n|\r|\n/)) {
    const line = raw.trim();
    if (!line) continue;
    const header = line.match(/^\[(.+)\]$/);
    if (header) {
      const name = header[1].trim();
      if (name) current = groupFor(name);
      continue;
    }
    const g = current || (current = groupFor(UNSORTED));
    // the same film twice in one category counts once
    if (!g.films.some((f) => f.toLowerCase() === line.toLowerCase())) g.films.push(line);
  }
  return groups.filter((g) => g.films.length > 0 || g.name !== UNSORTED);
}

// Notepad on Windows may save in UTF-8 or in the old Windows-1251 Cyrillic encoding.
export async function readTextFile(file) {
  const buf = await file.arrayBuffer();
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(buf);
  } catch {
    return new TextDecoder('windows-1251').decode(buf);
  }
}
