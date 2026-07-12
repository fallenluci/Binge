import { useState } from 'react'
import RatingDrum from './RatingDrum'
import './ActionSheet.css'

export default function MovieMenuSheet({ movie, category, onRate, onRename, onDelete, onClose }) {
  const [mode, setMode] = useState('menu') // menu | rate | rename | confirmDelete
  const [title, setTitle] = useState(movie.title)

  function submitRename(e) {
    e.preventDefault()
    if (!title.trim()) return
    onRename(title)
    onClose()
  }

  if (mode === 'rate') {
    return (
      <RatingDrum
        category={category}
        initialValue={movie.rating ?? 7}
        onRate={(rating) => {
          onRate(rating)
          onClose()
        }}
        onClose={onClose}
      />
    )
  }

  return (
    <div className="sheet-overlay" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        {mode === 'menu' && (
          <>
            <h2>{movie.title}</h2>
            <button className="sheet-option" onClick={() => setMode('rate')}>
              {movie.rating !== null && movie.rating !== undefined ? `Оценка: ${movie.rating}` : 'Поставить оценку'}
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
