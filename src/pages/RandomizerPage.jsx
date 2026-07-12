import { useState } from 'react'
import { useBingeStore } from '../store/useBingeStore'
import Drum from '../components/Drum'
import { categoryGradient } from '../lib/colors'
import '../components/ActionSheet.css'
import './RandomizerPage.css'

export default function RandomizerPage() {
  const categories = useBingeStore((s) => s.categories)
  const movies = useBingeStore((s) => s.movies)
  const [filterCategoryId, setFilterCategoryId] = useState(null) // null = all
  const [showConfig, setShowConfig] = useState(false)
  const [result, setResult] = useState(null)

  const pool = filterCategoryId ? movies.filter((m) => m.categoryId === filterCategoryId) : movies

  const filterItems = [
    { value: null, label: 'Все категории' },
    ...categories.map((c) => ({ value: c.id, label: c.name })),
  ]

  const activeFilterLabel = filterItems.find((it) => it.value === filterCategoryId)?.label ?? 'Все категории'

  function handleRandomize() {
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
      <h1>Рандомайзер</h1>
      <p className="randomizer-scope">{activeFilterLabel}</p>

      <div className="randomizer-center">
        <button className="randomizer-btn" onClick={handleRandomize}>
          Случайный
          <br />
          фильм
        </button>

        {result?.empty && <p className="randomizer-empty">В этой категории пока нет фильмов.</p>}

        {result?.movie && (
          <div
            className="randomizer-result"
            style={{ background: categoryGradient(result.category ?? { color: '#7350c9', angle: 40 }) }}
          >
            <span className="randomizer-result-title">{result.movie.title}</span>
            {result.category && <span className="randomizer-result-category">{result.category.name}</span>}
          </div>
        )}
      </div>

      <button className="randomizer-configure" onClick={() => setShowConfig(true)}>
        Настроить
      </button>

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
