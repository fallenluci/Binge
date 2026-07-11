import { useEffect, useRef, useState } from 'react'
import { categoryGradient } from '../lib/colors'
import { movieWord } from '../lib/pluralize'
import './CategoryStack.css'

const STEP = 96 // px of drag needed to move from one category to the next
const COLLAPSED_OVERLAP = 26 // how much a collapsed card above overlaps the one below it
const BELOW_DISTANCE = 170 // how far the "not yet active" next card sits below, off-view
const FAN_OFFSET = 16 // horizontal fan shift per step
const SCALE_STEP = 0.045

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

export default function CategoryStack({ categories, movies, onOpenCategory, onCategoryMenu }) {
  const [scroll, setScroll] = useState(0) // virtual drag position, 0..maxScroll
  const [isDragging, setIsDragging] = useState(false)
  const dragState = useRef({ startY: 0, startScroll: 0 })

  const maxScroll = Math.max(0, (categories.length - 1) * STEP)

  useEffect(() => {
    // Keep scroll in range if categories are added/removed
    setScroll((s) => clamp(s, 0, maxScroll))
  }, [maxScroll])

  function handlePointerDown(e) {
    if (categories.length <= 1) return
    setIsDragging(true)
    dragState.current = { startY: e.clientY, startScroll: scroll }
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  function handlePointerMove(e) {
    if (!isDragging) return
    const delta = e.clientY - dragState.current.startY
    const next = clamp(dragState.current.startScroll - delta, 0, maxScroll)
    setScroll(next)
  }

  function handlePointerUp() {
    if (!isDragging) return
    setIsDragging(false)
    const snapped = clamp(Math.round(scroll / STEP) * STEP, 0, maxScroll)
    setScroll(snapped)
  }

  if (categories.length === 0) {
    return (
      <div className="category-stack-empty">
        <p>Пока нет ни одной категории.</p>
        <p className="hint">Нажми «Добавить», чтобы создать первую.</p>
      </div>
    )
  }

  return (
    <div
      className="category-stack"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {categories.map((cat, i) => {
        const t = clamp(scroll / STEP - i, -1, 1)
        const revealed = 1 - Math.abs(t) // 1 = fully active, 0 = fully collapsed/hidden

        const translateY = t >= 0 ? -(t * COLLAPSED_OVERLAP) : -t * BELOW_DISTANCE
        const translateX = t * FAN_OFFSET
        const scale = 1 - Math.abs(t) * SCALE_STEP
        const zIndex = Math.round(revealed * 1000) + i

        const categoryMovies = movies.filter((m) => m.categoryId === cat.id)
        const preview = categoryMovies.slice(0, 3)

        return (
          <div
            key={cat.id}
            className="category-card"
            style={{
              background: categoryGradient(cat),
              transform: `translate(${translateX}px, ${translateY}px) scale(${scale})`,
              zIndex,
              transition: isDragging ? 'none' : 'transform 0.32s cubic-bezier(0.22, 1, 0.36, 1)',
              paddingTop: 12 + revealed * 6,
              paddingBottom: 12 + revealed * 8,
            }}
            onClick={() => !isDragging && onOpenCategory(cat.id)}
          >
            <div className="category-card-header">
              <span className="category-name" style={{ fontSize: 16 + revealed * 3 }}>
                {cat.name}
              </span>
              <div className="category-meta" style={{ opacity: revealed }}>
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
            </div>

            {preview.length > 0 && (
              <div className="category-preview" style={{ opacity: revealed, maxHeight: revealed * 80 }}>
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
    </div>
  )
}
