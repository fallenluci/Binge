import { useEffect, useRef, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import './index.css';
import HomePage from './pages/HomePage';
import RandPage from './pages/RandPage';
import CategoryPage from './pages/CategoryPage';
import Island from './components/Island';
import AccountSheet from './components/AccountSheet';
import AuthScreen from './pages/AuthScreen';
import ProfilePage from './pages/ProfilePage';
import { subscribeProfile } from './profile';
import { auth, firebaseEnabled } from './firebase';
import { startSync, stopSync } from './sync';
import { replaceDataFromRemote } from './store';

export default function App() {
  const [page, setPage] = useState('home');
  const [catId, setCatId] = useState(null);
  const [tick, setTick] = useState(0);
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(!firebaseEnabled);
  const [dataReady, setDataReady] = useState(!firebaseEnabled);
  const [syncStatus, setSyncStatus] = useState('synced');
  const [showAccount, setShowAccount] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [profile, setProfile] = useState(null);
  const unsubProfile = useRef(null);
  const hadUser = useRef(false);
  const refresh = () => setTick(t => t + 1);

  useEffect(() => {
    if (!firebaseEnabled) return;
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthReady(true);
      if (u) {
        hadUser.current = true;
        setDataReady(false);
        // Wait for the first download so a new device doesn't flash a stale/empty list;
        // give up after 3 s (slow or no network) and show the offline copy.
        const sync = startSync(u.uid, { onRemoteChange: refresh, onStatus: setSyncStatus });
        unsubProfile.current?.();
        unsubProfile.current = subscribeProfile(u.uid, setProfile);
        Promise.race([sync, new Promise(r => setTimeout(r, 3000))]).finally(() => { setDataReady(true); refresh(); });
      } else {
        stopSync();
        unsubProfile.current?.();
        unsubProfile.current = null;
        setProfile(null);
        setShowProfile(false);
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

  // With accounts the avatar opens the profile page; local-only mode keeps the info sheet.
  const openAccount = () => (firebaseEnabled ? setShowProfile(true) : setShowAccount(true));

  // Firebase restores the session asynchronously — show a blank screen for that
  // split second instead of flashing the login form at a signed-in user.
  if (!authReady) return <div className="app" style={{ background: '#000' }} />;
  // Welcome screen: sign in or register before using the app.
  if (firebaseEnabled && !user) return <div className="app"><AuthScreen /></div>;
  if (!dataReady) return <div className="app" style={{ background: '#000' }} />;

  return (
    <div className="app">
      {page === 'home' && <HomePage onOpenCategory={id => setCatId(id)} onProfile={openAccount} profile={profile} refreshKey={tick} />}
      {page === 'rand' && <RandPage key={tick} onOpenCategory={id => setCatId(id)} onProfile={openAccount} profile={profile} />}
      {catId && <CategoryPage categoryId={catId} refreshKey={tick} onBack={() => setCatId(null)} onRefresh={refresh} />}
      {showProfile && user && <ProfilePage user={user} profile={profile} onClose={() => setShowProfile(false)} />}
      {!catId && !showProfile && <Island activePage={page} onChangePage={setPage} onRefresh={refresh} />}
      {showAccount && <AccountSheet user={user} syncStatus={syncStatus} onClose={() => setShowAccount(false)} />}
    </div>
  );
}
