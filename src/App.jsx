import { useEffect, useRef, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import './index.css';
import HomePage from './pages/HomePage';
import RandPage from './pages/RandPage';
import CategoryPage from './pages/CategoryPage';
import Island from './components/Island';
import AccountSheet from './components/AccountSheet';
import { auth, firebaseEnabled } from './firebase';
import { startSync, stopSync } from './sync';
import { replaceDataFromRemote } from './store';

export default function App() {
  const [page, setPage] = useState('home');
  const [catId, setCatId] = useState(null);
  const [tick, setTick] = useState(0);
  const [user, setUser] = useState(null);
  const [syncStatus, setSyncStatus] = useState('synced');
  const [showAccount, setShowAccount] = useState(false);
  const hadUser = useRef(false);
  const refresh = () => setTick(t => t + 1);

  useEffect(() => {
    if (!firebaseEnabled) return;
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u) {
        hadUser.current = true;
        startSync(u.uid, { onRemoteChange: refresh, onStatus: setSyncStatus });
      } else {
        stopSync();
        if (hadUser.current) {
          // Signed out: the list lives in the cloud now, so clear this device's copy
          // and don't let it leak into the next account that signs in here.
          hadUser.current = false;
          replaceDataFromRemote({ categories: [] });
          setCatId(null);
          refresh();
        }
      }
    });
  }, []);

  const openAccount = () => setShowAccount(true);

  return (
    <div className="app">
      {page === 'home' && <HomePage onOpenCategory={id => setCatId(id)} onProfile={openAccount} refreshKey={tick} />}
      {page === 'rand' && <RandPage key={tick} onOpenCategory={id => setCatId(id)} onProfile={openAccount} />}
      {catId && <CategoryPage categoryId={catId} refreshKey={tick} onBack={() => setCatId(null)} onRefresh={refresh} />}
      {!catId && <Island activePage={page} onChangePage={setPage} onRefresh={refresh} />}
      {showAccount && <AccountSheet user={user} syncStatus={syncStatus} onClose={() => setShowAccount(false)} />}
    </div>
  );
}
