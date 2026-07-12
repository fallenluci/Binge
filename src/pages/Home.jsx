import { useState } from 'react'
import CategoryGrid from '../components/CategoryGrid'
import CategoryMenuSheet from '../components/CategoryMenuSheet'
import { useBingeStore } from '../store/useBingeStore'
import './Home.css'

export default function Home({ onOpenCategory }) {
  const categories = useBingeStore((s) => s.categories)
  const movies = useBingeStore((s) => s.movies)
  const renameCategory = useBingeStore((s) => s.renameCategory)
  const deleteCategory = useBingeStore((s) => s.deleteCategory)
  const [menuCategoryId, setMenuCategoryId] = useState(null)

  const menuCategory = categories.find((c) => c.id === menuCategoryId)

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
        onCategoryMenu={setMenuCategoryId}
      />

      {menuCategory && (
        <CategoryMenuSheet
          category={menuCategory}
          onRename={(name) => renameCategory(menuCategory.id, name)}
          onDelete={() => deleteCategory(menuCategory.id)}
          onClose={() => setMenuCategoryId(null)}
        />
      )}
    </div>
  )
}
