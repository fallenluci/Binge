import { useState } from 'react'
import './ActionSheet.css'

export default function RenameSheet({ title, initialValue, onSave, onClose }) {
  const [value, setValue] = useState(initialValue)

  function handleSubmit(e) {
    e.preventDefault()
    if (!value.trim()) return
    onSave(value)
    onClose()
  }

  return (
    <div className="sheet-overlay" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <h2>{title}</h2>
        <form onSubmit={handleSubmit}>
          <input autoFocus value={value} onChange={(e) => setValue(e.target.value)} />
          <div className="sheet-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Отмена
            </button>
            <button type="submit" className="btn-primary">
              Сохранить
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
