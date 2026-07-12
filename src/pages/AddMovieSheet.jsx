import { useState } from 'react'
import '../components/ActionSheet.css'

export default function AddMovieSheet({ onCreate, onClose }) {
  const [title, setTitle] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    if (!title.trim()) return
    onCreate(title)
    setTitle('')
    onClose()
  }

  return (
    <div className="sheet-overlay" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <h2>Добавить фильм</h2>
        <form onSubmit={handleSubmit}>
          <input
            autoFocus
            type="text"
            placeholder="Название фильма"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <div className="sheet-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Отмена
            </button>
            <button type="submit" className="btn-primary">
              Добавить
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
