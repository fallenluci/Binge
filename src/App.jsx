import { useState } from 'react';
import './index.css';
import HomePage from './pages/HomePage';
import RandPage from './pages/RandPage';
import CategoryPage from './pages/CategoryPage';
import Island from './components/Island';

export default function App() {
  const [activePage, setActivePage] = useState('home');
  const [openCategoryId, setOpenCategoryId] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = () => setRefreshKey(k => k + 1);

  const handleOpenCategory = (id) => {
    setOpenCategoryId(id);
  };

  const handleCloseCategory = () => {
    setOpenCategoryId(null);
  };

  return (
    <div className="app">
      {/* Pages */}
      {activePage === 'home' && (
        <HomePage
          onOpenCategory={handleOpenCategory}
          refreshKey={refreshKey}
          onRefresh={refresh}
        />
      )}
      {activePage === 'rand' && <RandPage key={refreshKey} />}

      {/* Category page overlay */}
      {openCategoryId && (
        <CategoryPage
          categoryId={openCategoryId}
          onBack={handleCloseCategory}
          onRefresh={refresh}
        />
      )}

      {/* Floating Island — hidden when category is open */}
      {!openCategoryId && (
        <Island
          activePage={activePage}
          onChangePage={setActivePage}
          onRefresh={refresh}
        />
      )}
    </div>
  );
}
