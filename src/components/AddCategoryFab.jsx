import './AddCategoryFab.css'

export default function AddCategoryFab({ onClick }) {
  return (
    <button className="add-category-fab" onClick={onClick} aria-label="Добавить категорию">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 5v14M5 12h14" strokeLinecap="round" />
      </svg>
    </button>
  )
}
