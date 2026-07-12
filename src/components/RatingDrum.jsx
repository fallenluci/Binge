import { useRef, useState } from 'react'
import { categoryGradient } from '../lib/colors'
import './RatingDrum.css'

const ITEM_HEIGHT = 84
const VALUES = Array.from({ length: 11 }, (_, i) => i) // 0..10

export default function RatingDrum({ category, initialValue, onRate, onClose }) {
  const startIndex = initialValue ?? 7
  const [offset, setOffset] = useState(-startIndex * ITEM_HEIGHT)
  const [selected, setSelected] = useState(startIndex)
  const [dragging, setDragging] = useState(false)
  const drag = useRef({ startY: 0, startOffset: 0 })

  function clampOffset(value) {
    return Math.max(-(VALUES.length - 1) * ITEM_HEIGHT, Math.min(0, value))
  }

  function handlePointerDown(e) {
    setDragging(true)
    drag.current = { startY: e.clientY, startOffset: offset }
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  function handlePointerMove(e) {
    if (!dragging) return
    const delta = e.clientY - drag.current.startY
    const next = clampOffset(drag.current.startOffset + delta)
    setOffset(next)
    setSelected(Math.round(-next / ITEM_HEIGHT))
  }

  function handlePointerUp() {
    if (!dragging) return
    setDragging(false)
    const snappedIndex = Math.max(0, Math.min(VALUES.length - 1, Math.round(-offset / ITEM_HEIGHT)))
    setOffset(-snappedIndex * ITEM_HEIGHT)
    setSelected(snappedIndex)
  }

  return (
    <div className="rating-drum-page">
      <div className="rating-drum-bg" style={{ background: categoryGradient(category) }} />

      <button className="rating-drum-close" onClick={onClose} aria-label="Закрыть">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
        </svg>
      </button>

      <div
        className="rating-drum-track"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <div
          className="rating-drum-list"
          style={{
            transform: `translateY(${offset}px)`,
            transition: dragging ? 'none' : 'transform 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
          }}
        >
          {VALUES.map((v) => {
            const diff = Math.abs(v - selected)
            return (
              <div
                key={v}
                className="rating-drum-item"
                style={{
                  height: ITEM_HEIGHT,
                  fontSize: diff === 0 ? 108 : diff === 1 ? 56 : 40,
                  opacity: diff === 0 ? 1 : diff === 1 ? 0.45 : 0.16,
                  fontWeight: diff === 0 ? 800 : 700,
                }}
              >
                {v}
              </div>
            )
          })}
        </div>
        <div className="rating-drum-fade rating-drum-fade-top" />
        <div className="rating-drum-fade rating-drum-fade-bottom" />
      </div>

      <div className="rating-drum-actions">
        <button className="rating-drum-clear" onClick={() => onRate(null)}>
          Без оценки
        </button>
        <button className="rating-drum-save" onClick={() => onRate(selected)}>
          Сохранить
        </button>
      </div>
    </div>
  )
}
