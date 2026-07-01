import { useState } from 'react';
import './index.css';
import HomePage from './pages/HomePage';
import RandPage from './pages/RandPage';
import CategoryPage from './pages/CategoryPage';
import Island from './components/Island';

export default function App() {
  const [page, setPage] = useState('home');
  const [catId, setCatId] = useState(null);
  const [tick, setTick] = useState(0);
  const refresh = () => setTick(t => t + 1);

  return (
    <div className="app">
      {page === 'home' && <HomePage onOpenCategory={id => setCatId(id)} refreshKey={tick} />}
      {page === 'rand' && <RandPage key={tick} />}
      {catId && <CategoryPage categoryId={catId} onBack={() => setCatId(null)} onRefresh={refresh} />}
      {!catId && <Island activePage={page} onChangePage={setPage} onRefresh={refresh} />}
    </div>
  );
}
