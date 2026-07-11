import { useEffect, useRef, useState } from 'react'
import { categoryGradient } from '../lib/colors'
import { movieWord } from '../lib/pluralize'
import './CategoryStack.css'

const REVEAL_OFFSET = 150 // px from the bottom of the viewport that "activates" a card

export default function CategoryStack({ categories, movies, onOpenCategory, onCategoryMenu }) {
  const cardRefs = useRef([])
  const [activeId, setActiveId] = useState(categories[0]?.id ?? null)

  useEffect(() => {
    function handleScroll() {
      const viewportBottom = window.innerHeight
      let current = categories[0]?.id ?? null
      cardRefs.current.forEach((el, i) => {
        if (!el || !categories[i]) return
        const rect = el.getBoundingClientRect()
        if (rect.top <= viewportBottom - REVEAL_OFFSET) {
          current = categories[i].id
        }
      })
      setActiveId(current)
    }
    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('resize', handleScroll)
    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleScroll)
    }
  }, [categories])

  if (categories.length === 0) {
    return (
      <div className="category-stack-empty">
        <p>Пока нет ни одной категории.</p>
        <p className="hint">Нажми «Добавить», чтобы создать первую.</p>
      </div>
    )
  }

  return (
    <div className="category-stack">
      {categories.map((cat, i) => {
        const isActive = cat.id === activeId
        const categoryMovies = movies.filter((m) => m.categoryId === cat.id)
        const preview = categoryMovies.slice(0, 3)

        return (
          <div
            key={cat.id}
            ref={(el) => (cardRefs.current[i] = el)}
            className={`category-card ${isActive ? 'is-active' : 'is-collapsed'}`}
            style={{
              background: categoryGradient(cat),
              marginTop: i === 0 ? 0 : -28,
              zIndex: i + 1,
            }}
            onClick={() => onOpenCategory(cat.id)}
          >
            <div className="category-card-header">
              <span className="category-name">{cat.name}</span>
              {isActive && (
                <div className="category-meta">
                  <span className="category-count">
                    {categoryMovies.length} {movieWord(categoryMovies.length)}
                  </span>
                  <button
                    className="category-menu-btn"
                    onClick={(e) => {
                      e.stopPropagation()
                      onCategoryMenu(cat.id)
                    }}
                    aria-label={`Меню категории ${cat.name}`}
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                      <circle cx="5" cy="12" r="1.8" />
                      <circle cx="12" cy="12" r="1.8" />
                      <circle cx="19" cy="12" r="1.8" />
                    </svg>
                  </button>
                </div>
              )}
            </div>

            {isActive && preview.length > 0 && (
              <div className="category-preview">
                {preview.map((m) => (
                  <span key={m.id} className="preview-movie">
                    {m.title}
                  </span>
                ))}
              </div>
            )}
          </div>
        )
      })}
      {/* Spacer so the last card can fully expand above the floating nav */}
      <div className="category-stack-spacer" />
    </div>
  )
}
