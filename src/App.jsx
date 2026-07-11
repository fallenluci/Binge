import { useState } from 'react'
import Home from './pages/Home'
import BottomNav from './components/BottomNav'

// Randomizer, Search and per-category detail screens are the next build step —
// stubbed here so the nav and data layer can be wired end-to-end already.
function ComingSoon({ title }) {
  return (
    <div style={{ minHeight: '100vh', background: '#0d0d0d', color: '#fff', padding: '24px 16px' }}>
      <h1 style={{ fontSize: 22, fontWeight: 600 }}>{title}</h1>
      <p style={{ color: 'rgba(255,255,255,0.5)', marginTop: 8 }}>Экран в разработке.</p>
    </div>
  )
}

export default function App() {
  const [tab, setTab] = useState('home')
  const [openCategoryId, setOpenCategoryId] = useState(null)

  function handleOpenCategory(categoryId) {
    setOpenCategoryId(categoryId)
    // Category detail screen (movie list inside a category) is next on the list.
  }

  return (
    <>
      {tab === 'home' && <Home onOpenCategory={handleOpenCategory} />}
      {tab === 'random' && <ComingSoon title="Рандомайзер" />}
      {tab === 'search' && <ComingSoon title="Поиск" />}
      {tab === 'add' && <ComingSoon title="Добавить" />}

      <BottomNav active={tab} onChange={setTab} />
    </>
  )
}
