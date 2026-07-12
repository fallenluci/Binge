import { categoryGradient } from '../lib/colors'
import './CategoryGrid.css'

export default function CategoryGrid({ categories, movies, onOpenCategory, onRenameCategory, onDeleteCategory }) {
  if (categories.length === 0) {
    return (
      <div className="category-grid-empty">
        <p>Пока нет ни одной категории.</p>
        <p className="hint">Нажми круглую «+» рядом с навигацией, чтобы создать первую.</p>
      </div>
    )
  }

  return (
    <div className="category-grid">
      {categories.map((cat) => {
        const categoryMovies = movies.filter((m) => m.categoryId === cat.id)
        const preview = categoryMovies.slice(0, 3)

        return (
          <button
            key={cat.id}
            type="button"
            className="category-tile"
            style={{ background: categoryGradient(cat) }}
            onClick={() => onOpenCategory(cat.id)}
          >
            <div className="category-tile-header">
              <span className="category-tile-name">
                {cat.name}
                <span
                  className="category-tile-icon-btn"
                  role="button"
                  tabIndex={0}
                  onClick={(e) => {
                    e.stopPropagation()
                    onRenameCategory(cat.id)
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.stopPropagation()
                      onRenameCategory(cat.id)
                    }
                  }}
                  aria-label={`Переименовать категорию ${cat.name}`}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 20h9" strokeLinecap="round" />
                    <path
                      d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
              </span>
              <span
                className="category-tile-icon-btn category-tile-delete"
                role="button"
                tabIndex={0}
                onClick={(e) => {
                  e.stopPropagation()
                  onDeleteCategory(cat.id)
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.stopPropagation()
                    onDeleteCategory(cat.id)
                  }
                }}
                aria-label={`Удалить категорию ${cat.name}`}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
                </svg>
              </span>
            </div>

            {preview.length > 0 && (
              <div className="category-tile-preview">
                {preview.map((m) => (
                  <span key={m.id} className="category-tile-movie">
                    {m.title}
                  </span>
                ))}
              </div>
            )}
          </button>
        )
      })}
    </div>
  )
}
