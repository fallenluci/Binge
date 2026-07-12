import { useState } from 'react'
import CategoryGrid from '../components/CategoryGrid'
import RenameSheet from '../components/RenameSheet'
import ConfirmSheet from '../components/ConfirmSheet'
import { useBingeStore } from '../store/useBingeStore'
import './Home.css'

export default function Home({ onOpenCategory }) {
  const categories = useBingeStore((s) => s.categories)
  const movies = useBingeStore((s) => s.movies)
  const renameCategory = useBingeStore((s) => s.renameCategory)
  const deleteCategory = useBingeStore((s) => s.deleteCategory)
  const [renameCategoryId, setRenameCategoryId] = useState(null)
  const [deleteCategoryId, setDeleteCategoryId] = useState(null)

  const categoryToRename = categories.find((c) => c.id === renameCategoryId)
  const categoryToDelete = categories.find((c) => c.id === deleteCategoryId)

  return (
    <div className="home-page">
      <header className="home-header">
        <h1>Binge</h1>
        <button className="home-profile-btn" aria-label="Профиль">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <circle cx="12" cy="8" r="3.2" />
            <path d="M5 20c1.2-3.6 4.2-5.5 7-5.5s5.8 1.9 7 5.5" strokeLinecap="round" />
          </svg>
        </button>
      </header>

      <CategoryGrid
        categories={categories}
        movies={movies}
        onOpenCategory={onOpenCategory}
        onRenameCategory={setRenameCategoryId}
        onDeleteCategory={setDeleteCategoryId}
      />

      {categoryToRename && (
        <RenameSheet
          title="Переименовать категорию"
          initialValue={categoryToRename.name}
          onSave={(name) => renameCategory(categoryToRename.id, name)}
          onClose={() => setRenameCategoryId(null)}
        />
      )}

      {categoryToDelete && (
        <ConfirmSheet
          title={`Удалить «${categoryToDelete.name}»?`}
          message="Все фильмы внутри категории тоже будут удалены."
          onConfirm={() => deleteCategory(categoryToDelete.id)}
          onClose={() => setDeleteCategoryId(null)}
        />
      )}
    </div>
  )
}
