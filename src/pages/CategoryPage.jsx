import { useState } from 'react'
import { useBingeStore } from '../store/useBingeStore'
import { categoryGradient } from '../lib/colors'
import { movieWord } from '../lib/pluralize'
import MovieMenuSheet from '../components/MovieMenuSheet'
import RenameSheet from '../components/RenameSheet'
import AddMovieSheet from './AddMovieSheet'
import './CategoryPage.css'

export default function CategoryPage({ categoryId, onBack }) {
  const category = useBingeStore((s) => s.categories.find((c) => c.id === categoryId))
  const movies = useBingeStore((s) => s.movies.filter((m) => m.categoryId === categoryId))
  const addMovie = useBingeStore((s) => s.addMovie)
  const renameCategory = useBingeStore((s) => s.renameCategory)
  const renameMovie = useBingeStore((s) => s.renameMovie)
  const rateMovie = useBingeStore((s) => s.rateMovie)
  const deleteMovie = useBingeStore((s) => s.deleteMovie)

  const [menuMovieId, setMenuMovieId] = useState(null)
  const [renamingCategory, setRenamingCategory] = useState(false)
  const [showAddMovie, setShowAddMovie] = useState(false)

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

  return (
    <div className="category-page" style={{ background: categoryGradient(category) }}>
      <div className="category-page-header">
        <button className="category-page-back" onClick={onBack} aria-label="Назад">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <h1>
          {category.name}
          <button
            className="category-page-edit-btn"
            onClick={() => setRenamingCategory(true)}
            aria-label="Переименовать категорию"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 20h9" strokeLinecap="round" />
              <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </h1>
        <span className="category-page-count">
          {movies.length} {movieWord(movies.length)}
        </span>
      </div>

      <div className="movie-list">
        {movies.length === 0 && <p className="movie-list-empty">В этой категории пока нет фильмов.</p>}
        {movies.map((movie, index) => (
          <div key={movie.id} className="movie-row" onClick={() => setMenuMovieId(movie.id)}>
            <span className="movie-row-title">
              <span className="movie-row-index">{index + 1}.</span> {movie.title}
            </span>
            {movie.rating !== null && movie.rating !== undefined ? (
              <span className="movie-row-rating">{movie.rating}</span>
            ) : (
              <span className="movie-row-unrated">Не оценён</span>
            )}
          </div>
        ))}
      </div>

      <button className="category-page-add-fab" onClick={() => setShowAddMovie(true)} aria-label="Добавить фильм">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 5v14M5 12h14" strokeLinecap="round" />
        </svg>
      </button>

      {showAddMovie && (
        <AddMovieSheet onCreate={(title) => addMovie(categoryId, title)} onClose={() => setShowAddMovie(false)} />
      )}

      {menuMovie && (
        <MovieMenuSheet
          movie={menuMovie}
          category={category}
          onRate={(rating) => rateMovie(menuMovie.id, rating)}
          onRename={(title) => renameMovie(menuMovie.id, title)}
          onDelete={() => deleteMovie(menuMovie.id)}
          onClose={() => setMenuMovieId(null)}
        />
      )}

      {renamingCategory && (
        <RenameSheet
          title="Переименовать категорию"
          initialValue={category.name}
          onSave={(name) => renameCategory(category.id, name)}
          onClose={() => setRenamingCategory(false)}
        />
      )}
    </div>
  )
}
