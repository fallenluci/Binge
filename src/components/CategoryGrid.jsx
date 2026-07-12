import { categoryGradient } from '../lib/colors'
import './CategoryGrid.css'

export default function CategoryGrid({ categories, movies, onOpenCategory, onCategoryMenu }) {
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
              <span className="category-tile-name">{cat.name}</span>
              <span
                className="category-tile-menu-btn"
                role="button"
                tabIndex={0}
                onClick={(e) => {
                  e.stopPropagation()
                  onCategoryMenu(cat.id)
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.stopPropagation()
                    onCategoryMenu(cat.id)
                  }
                }}
                aria-label={`Меню категории ${cat.name}`}
              >
                <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                  <circle cx="5" cy="12" r="1.8" />
                  <circle cx="12" cy="12" r="1.8" />
                  <circle cx="19" cy="12" r="1.8" />
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
