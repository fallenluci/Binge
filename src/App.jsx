import { useState } from 'react'
import Home from './pages/Home'
import RandomizerPage from './pages/RandomizerPage'
import SearchPage from './pages/SearchPage'
import CategoryPage from './pages/CategoryPage'
import BottomNav from './components/BottomNav'
import AddCategoryFab from './components/AddCategoryFab'
import AddCategoryModal from './components/AddCategoryModal'
import { useBingeStore } from './store/useBingeStore'

export default function App() {
  const [tab, setTab] = useState('home')
  const [openCategoryId, setOpenCategoryId] = useState(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const addCategory = useBingeStore((s) => s.addCategory)

  function handleOpenCategory(categoryId) {
    setOpenCategoryId(categoryId)
  }

  function handleBackFromCategory() {
    setOpenCategoryId(null)
  }

  if (openCategoryId) {
    return <CategoryPage categoryId={openCategoryId} onBack={handleBackFromCategory} />
  }

  return (
    <>
      {tab === 'home' && <Home onOpenCategory={handleOpenCategory} />}
      {tab === 'random' && <RandomizerPage />}
      {tab === 'search' && <SearchPage onOpenCategory={handleOpenCategory} />}

      <BottomNav active={tab} onChange={setTab} />
      <AddCategoryFab onClick={() => setShowAddModal(true)} />

      {showAddModal && (
        <AddCategoryModal onCreate={addCategory} onClose={() => setShowAddModal(false)} />
      )}
    </>
  )
}
