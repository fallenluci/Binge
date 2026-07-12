import { useState } from 'react'
import './ActionSheet.css'

export default function CategoryMenuSheet({ category, onRename, onDelete, onClose }) {
  const [mode, setMode] = useState('menu') // menu | rename | confirmDelete
  const [name, setName] = useState(category.name)

  function submitRename(e) {
    e.preventDefault()
    if (!name.trim()) return
    onRename(name)
    onClose()
  }

  return (
    <div className="sheet-overlay" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        {mode === 'menu' && (
          <>
            <h2>{category.name}</h2>
            <button className="sheet-option" onClick={() => setMode('rename')}>
              Переименовать
            </button>
            <button className="sheet-option is-danger" onClick={() => setMode('confirmDelete')}>
              Удалить категорию
            </button>
            <button className="sheet-option is-muted" onClick={onClose}>
              Отмена
            </button>
          </>
        )}

        {mode === 'rename' && (
          <form onSubmit={submitRename}>
            <h2>Переименовать категорию</h2>
            <input autoFocus value={name} onChange={(e) => setName(e.target.value)} />
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
            <h2>Удалить «{category.name}»?</h2>
            <p className="sheet-hint">Все фильмы внутри категории тоже будут удалены.</p>
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
