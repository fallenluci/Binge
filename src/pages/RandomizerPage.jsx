import { useEffect, useRef, useState } from 'react'
import { useBingeStore } from '../store/useBingeStore'
import Drum from '../components/Drum'
import { categoryGradient } from '../lib/colors'
import '../components/ActionSheet.css'
import './RandomizerPage.css'

const BASE_POSITIONS = [
  { x: 58, y: 40 },
  { x: 76, y: 26 },
  { x: 26, y: 36 },
  { x: 34, y: 64 },
  { x: 62, y: 66 },
  { x: 45, y: 22 },
]

function buildBubbles(categories) {
  const maxCount = Math.max(1, ...categories.map((c) => c.movieCount))
  return categories.map((cat, i) => ({
    id: cat.id,
    name: cat.name,
    gradient: categoryGradient(cat),
    size: 46 + (cat.movieCount / maxCount) * 74,
    x: BASE_POSITIONS[i % BASE_POSITIONS.length].x + (Math.random() - 0.5) * 8,
    y: BASE_POSITIONS[i % BASE_POSITIONS.length].y + (Math.random() - 0.5) * 8,
    vx: 0,
    vy: 0,
  }))
}

export default function RandomizerPage() {
  const categories = useBingeStore((s) => s.categories)
  const movies = useBingeStore((s) => s.movies)

  const categoriesWithCounts = categories.map((c) => ({
    ...c,
    movieCount: movies.filter((m) => m.categoryId === c.id).length,
  }))

  const [bubbles, setBubbles] = useState(() => buildBubbles(categoriesWithCounts))
  const [spinning, setSpinning] = useState(false)
  const [result, setResult] = useState(null)
  const [filterCategoryId, setFilterCategoryId] = useState(null) // null = all
  const [showConfig, setShowConfig] = useState(false)
  const animRef = useRef(null)

  // Rebuild bubbles if categories change materially (added/removed), keep it simple.
  useEffect(() => {
    setBubbles(buildBubbles(categoriesWithCounts))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categories.length])

  const filterItems = [
    { value: null, label: 'Все категории' },
    ...categories.map((c) => ({ value: c.id, label: c.name })),
  ]
  const activeFilterLabel = filterItems.find((it) => it.value === filterCategoryId)?.label ?? 'Все категории'

  function handleSpin() {
    if (spinning || bubbles.length === 0) return
    setResult(null)
    setSpinning(true)
    if (animRef.current) cancelAnimationFrame(animRef.current)

    let bubs = bubbles.map((b) => ({
      ...b,
      vx: (Math.random() - 0.5) * 3.2,
      vy: (Math.random() - 0.5) * 3.2,
    }))
    let start = null
    const duration = 2400

    function tick(ts) {
      if (!start) start = ts
      const elapsed = ts - start
      const speed = Math.max(0.05, 1 - (elapsed / duration) * 0.95)
      bubs = bubs.map((b) => {
        let nx = b.x + b.vx * speed
        let ny = b.y + b.vy * speed
        let nvx = b.vx
        let nvy = b.vy
        if (nx < 8 || nx > 92) {
          nvx = -nvx
          nx = Math.max(8, Math.min(92, nx))
        }
        if (ny < 6 || ny > 82) {
          nvy = -nvy
          ny = Math.max(6, Math.min(82, ny))
        }
        return { ...b, x: nx, y: ny, vx: nvx, vy: nvy }
      })
      setBubbles(bubs)
      if (elapsed < duration) {
        animRef.current = requestAnimationFrame(tick)
      } else {
        setSpinning(false)
        pickResult()
      }
    }
    animRef.current = requestAnimationFrame(tick)
  }

  function pickResult() {
    const pool = filterCategoryId ? movies.filter((m) => m.categoryId === filterCategoryId) : movies
    if (pool.length === 0) {
      setResult({ empty: true })
      return
    }
    const movie = pool[Math.floor(Math.random() * pool.length)]
    const cat = categories.find((c) => c.id === movie.categoryId)
    setResult({ movie, category: cat })
  }

  return (
    <div className="randomizer-page">
      <header className="randomizer-header">
        <h1>Рандомайзер</h1>
        <span className="randomizer-scope">{activeFilterLabel}</span>
      </header>

      <div className="randomizer-bubbles" onClick={handleSpin}>
        {bubbles.map((b) => (
          <div
            key={b.id}
            className="randomizer-bubble"
            style={{
              left: `${b.x}%`,
              top: `${b.y}%`,
              width: b.size,
              height: b.size,
              background: b.gradient,
              transition: spinning ? 'none' : 'left 0.6s ease, top 0.6s ease',
            }}
          >
            <span className="randomizer-bubble-label">{b.name}</span>
          </div>
        ))}

        {bubbles.length === 0 && (
          <div className="randomizer-bubbles-empty">
            <p>Пока нет категорий.</p>
            <p className="hint">Добавь их на главной, чтобы рандомить фильмы.</p>
          </div>
        )}

        {bubbles.length > 0 && !spinning && !result && (
          <p className="randomizer-hint">Нажми на пузыри</p>
        )}
        {spinning && <p className="randomizer-hint">Выбираем...</p>}
      </div>

      <div className="randomizer-bottom">
        {result?.empty && <p className="randomizer-empty">В этой категории пока нет фильмов.</p>}

        {result?.movie && (
          <div className="randomizer-result" style={{ background: categoryGradient(result.category ?? { color: '#7350c9', angle: 40 }) }}>
            <span className="randomizer-result-title">{result.movie.title}</span>
            {result.category && <span className="randomizer-result-category">{result.category.name}</span>}
          </div>
        )}

        <button className="randomizer-configure" onClick={() => setShowConfig(true)}>
          Настроить
        </button>
      </div>

      {showConfig && (
        <div className="sheet-overlay" onClick={() => setShowConfig(false)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()}>
            <h2>Выбрать категорию</h2>
            <Drum items={filterItems} value={filterCategoryId} onChange={setFilterCategoryId} />
            <div className="sheet-actions">
              <button className="btn-primary" onClick={() => setShowConfig(false)}>
                Готово
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
