import { useState } from 'react'
import { useBingeStore } from '../store/useBingeStore'
import { categoryGradient } from '../lib/colors'
import { movieWord } from '../lib/pluralize'
import MovieMenuSheet from '../components/MovieMenuSheet'
import './CategoryPage.css'

export default function CategoryPage({ categoryId, onBack }) {
  const category = useBingeStore((s) => s.categories.find((c) => c.id === categoryId))
  const movies = useBingeStore((s) => s.movies.filter((m) => m.categoryId === categoryId))
  const addMovie = useBingeStore((s) => s.addMovie)
  const renameMovie = useBingeStore((s) => s.renameMovie)
  const rateMovie = useBingeStore((s) => s.rateMovie)
  const deleteMovie = useBingeStore((s) => s.deleteMovie)

  const [newTitle, setNewTitle] = useState('')
  const [menuMovieId, setMenuMovieId] = useState(null)

  if (!category) {
    return (
      <div className="category-page">
        <p className="category-page-missing">Категория не найдена.</p>
        <button className="btn-secondary" onClick={onBack}>
          Назад
        </button>
      </div>
    )
  }

  const menuMovie = movies.find((m) => m.id === menuMovieId)

  function handleAdd(e) {
    e.preventDefault()
    if (!newTitle.trim()) return
    addMovie(categoryId, newTitle)
    setNewTitle('')
  }

  return (
    <div className="category-page">
      <div className="category-page-header" style={{ background: categoryGradient(category) }}>
        <button className="category-page-back" onClick={onBack} aria-label="Назад">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <h1>{category.name}</h1>
        <span className="category-page-count">
          {movies.length} {movieWord(movies.length)}
        </span>
      </div>

      <div className="movie-list">
        {movies.length === 0 && <p className="movie-list-empty">В этой категории пока нет фильмов.</p>}
        {movies.map((movie) => (
          <div key={movie.id} className="movie-row" onClick={() => setMenuMovieId(movie.id)}>
            <span className="movie-row-title">{movie.title}</span>
            {movie.rating ? (
              <span className="movie-row-rating">{movie.rating}</span>
            ) : (
              <span className="movie-row-unrated">Не оценён</span>
            )}
          </div>
        ))}
      </div>

      <form className="movie-add-form" onSubmit={handleAdd}>
        <input
          type="text"
          placeholder="Добавить фильм..."
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
        />
        <button type="submit" aria-label="Добавить фильм">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14" strokeLinecap="round" />
          </svg>
        </button>
      </form>

      {menuMovie && (
        <MovieMenuSheet
          movie={menuMovie}
          onRate={(rating) => rateMovie(menuMovie.id, rating)}
          onRename={(title) => renameMovie(menuMovie.id, title)}
          onDelete={() => deleteMovie(menuMovie.id)}
          onClose={() => setMenuMovieId(null)}
        />
      )}
    </div>
  )
}
