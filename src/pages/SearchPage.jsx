import { useMemo, useState } from 'react'
import { useBingeStore } from '../store/useBingeStore'
import './SearchPage.css'

export default function SearchPage({ onOpenCategory }) {
  const categories = useBingeStore((s) => s.categories)
  const movies = useBingeStore((s) => s.movies)
  const [query, setQuery] = useState('')

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return []
    return movies
      .filter((m) => m.title.toLowerCase().includes(q))
      .map((m) => ({ movie: m, category: categories.find((c) => c.id === m.categoryId) }))
  }, [query, movies, categories])

  return (
    <div className="search-page">
      <h1>Поиск</h1>
      <input
        className="search-input"
        type="text"
        placeholder="Название фильма..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        autoFocus
      />

      {query.trim() && results.length === 0 && <p className="search-empty">Ничего не найдено.</p>}

      <div className="search-results">
        {results.map(({ movie, category }) => (
          <button
            key={movie.id}
            className="search-result"
            onClick={() => category && onOpenCategory(category.id)}
          >
            <span className="search-result-title">{movie.title}</span>
            <span className="search-result-category">{category?.name ?? '—'}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
