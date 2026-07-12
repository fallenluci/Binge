import { useEffect, useRef, useState } from 'react'
import './Drum.css'

const ITEM_HEIGHT = 44
const VISIBLE_HEIGHT = ITEM_HEIGHT * 3

/**
 * items: array of { value, label }
 * value: currently selected value
 * onChange: called with the new value as the user scrolls/snaps
 */
export default function Drum({ items, value, onChange }) {
  const containerRef = useRef(null)
  const selectedIndex = Math.max(0, items.findIndex((it) => it.value === value))
  const [internalIndex, setInternalIndex] = useState(selectedIndex)
  const scrollTimeout = useRef(null)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    el.scrollTop = selectedIndex * ITEM_HEIGHT
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleScroll() {
    const el = containerRef.current
    if (!el) return
    clearTimeout(scrollTimeout.current)
    scrollTimeout.current = setTimeout(() => {
      const index = Math.round(el.scrollTop / ITEM_HEIGHT)
      const clamped = Math.min(items.length - 1, Math.max(0, index))
      setInternalIndex(clamped)
      onChange(items[clamped].value)
    }, 80)
  }

  return (
    <div className="drum-wrapper" style={{ height: VISIBLE_HEIGHT }}>
      <div className="drum-highlight" style={{ height: ITEM_HEIGHT }} />
      <div
        className="drum-scroll"
        ref={containerRef}
        onScroll={handleScroll}
        style={{ paddingTop: ITEM_HEIGHT, paddingBottom: ITEM_HEIGHT }}
      >
        {items.map((it, i) => (
          <div
            key={it.value ?? 'none'}
            className={`drum-item ${i === internalIndex ? 'is-selected' : ''}`}
            style={{ height: ITEM_HEIGHT }}
          >
            {it.label}
          </div>
        ))}
      </div>
    </div>
  )
}
