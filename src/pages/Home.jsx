import { useState } from 'react'
import CategoryGrid from '../components/CategoryGrid'
import AddCategoryModal from '../components/AddCategoryModal'
import { useBingeStore } from '../store/useBingeStore'
import './Home.css'

export default function Home({ onOpenCategory }) {
  const categories = useBingeStore((s) => s.categories)
  const movies = useBingeStore((s) => s.movies)
  const addCategory = useBingeStore((s) => s.addCategory)
  const deleteCategory = useBingeStore((s) => s.deleteCategory)
  const [showAddModal, setShowAddModal] = useState(false)

  function handleCategoryMenu(categoryId) {
    const category = categories.find((c) => c.id === categoryId)
    if (!category) return
    // Placeholder menu for now — full edit/delete UI comes with the category detail screen.
    const shouldDelete = window.confirm(`Удалить категорию «${category.name}»? Все фильмы внутри тоже удалятся.`)
    if (shouldDelete) deleteCategory(categoryId)
  }

  return (
    <div className="home-page">
      <header className="home-header">
        <h1>Binge</h1>
        <button className="home-add-btn" onClick={() => setShowAddModal(true)} aria-label="Добавить категорию">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M12 5v14M5 12h14" strokeLinecap="round" />
          </svg>
        </button>
      </header>

      <CategoryGrid
        categories={categories}
        movies={movies}
        onOpenCategory={onOpenCategory}
        onCategoryMenu={handleCategoryMenu}
      />

      {showAddModal && (
        <AddCategoryModal onCreate={addCategory} onClose={() => setShowAddModal(false)} />
      )}
    </div>
  )
}
