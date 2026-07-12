import { useState } from 'react'
import './ActionSheet.css'

export default function AddCategoryModal({ onCreate, onClose }) {
  const [name, setName] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim()) return
    onCreate(name)
    setName('')
    onClose()
  }

  return (
    <div className="sheet-overlay" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <h2>Новая категория</h2>
        <form onSubmit={handleSubmit}>
          <input
            autoFocus
            type="text"
            placeholder="Название категории"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <div className="sheet-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Отмена
            </button>
            <button type="submit" className="btn-primary">
              Создать
            </button>
          </div>
        </form>
        <p className="sheet-hint" style={{ marginTop: 14 }}>
          Цвет и градиент подберутся автоматически, без повторов.
        </p>
      </div>
    </div>
  )
}
