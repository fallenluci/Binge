import { useState } from 'react'
import Drum from './Drum'
import './ActionSheet.css'

const RATING_ITEMS = [
  { value: null, label: 'Без оценки' },
  ...Array.from({ length: 10 }, (_, i) => ({ value: i + 1, label: String(i + 1) })),
]

export default function MovieMenuSheet({ movie, onRate, onRename, onDelete, onClose }) {
  const [mode, setMode] = useState('menu') // menu | rate | rename | confirmDelete
  const [title, setTitle] = useState(movie.title)
  const [rating, setRating] = useState(movie.rating)

  function submitRename(e) {
    e.preventDefault()
    if (!title.trim()) return
    onRename(title)
    onClose()
  }

  return (
    <div className="sheet-overlay" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        {mode === 'menu' && (
          <>
            <h2>{movie.title}</h2>
            <button className="sheet-option" onClick={() => setMode('rate')}>
              {movie.rating ? `Оценка: ${movie.rating}` : 'Поставить оценку'}
            </button>
            <button className="sheet-option" onClick={() => setMode('rename')}>
              Переименовать
            </button>
            <button className="sheet-option is-danger" onClick={() => setMode('confirmDelete')}>
              Удалить
            </button>
            <button className="sheet-option is-muted" onClick={onClose}>
              Отмена
            </button>
          </>
        )}

        {mode === 'rate' && (
          <>
            <h2>Оценка</h2>
            <Drum items={RATING_ITEMS} value={rating} onChange={setRating} />
            <div className="sheet-actions">
              <button className="btn-secondary" onClick={onClose}>
                Отмена
              </button>
              <button
                className="btn-primary"
                onClick={() => {
                  onRate(rating)
                  onClose()
                }}
              >
                Сохранить
              </button>
            </div>
          </>
        )}

        {mode === 'rename' && (
          <form onSubmit={submitRename}>
            <h2>Переименовать фильм</h2>
            <input autoFocus value={title} onChange={(e) => setTitle(e.target.value)} />
            <div className="sheet-actions">
              <button type="button" className="btn-secondary" onClick={onClose}>
                Отмена
              </button>
              <button type="submit" className="btn-primary">
                Сохранить
              </button>
            </div>
          </form>
        )}

        {mode === 'confirmDelete' && (
          <>
            <h2>Удалить «{movie.title}»?</h2>
            <div className="sheet-actions">
              <button className="btn-secondary" onClick={onClose}>
                Отмена
              </button>
              <button
                className="btn-danger"
                onClick={() => {
                  onDelete()
                  onClose()
                }}
              >
                Удалить
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
