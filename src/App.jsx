import { useEffect, useRef, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import './index.css';
import HomePage from './pages/HomePage';
import RandPage from './pages/RandPage';
import CategoryPage from './pages/CategoryPage';
import Island from './components/Island';
import AccountSheet from './components/AccountSheet';
import AuthScreen from './pages/AuthScreen';
import Splash from './components/Splash';
import ProfilePage from './pages/ProfilePage';
import { subscribeProfile } from './profile';
import { auth, firebaseEnabled } from './firebase';
import { startSync, stopSync } from './sync';
import { replaceDataFromRemote } from './store';
import { fillMissingPosters } from './lib/posters';

const SPLASH_MIN_MS = 1000;
// Launch splash only on phones (touch screen or narrow window).
const IS_MOBILE = typeof window !== 'undefined' &&
  (window.matchMedia?.('(pointer: coarse)').matches || window.innerWidth < 768);

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
  const [splash, setSplash] = useState(IS_MOBILE ? 'shown' : 'gone'); // shown | leaving | gone
  const [splashMinDone, setSplashMinDone] = useState(!IS_MOBILE);
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

  // Find TMDB posters for films that don't have one yet (new films, old lists), in the background
  useEffect(() => {
    if (dataReady) fillMissingPosters(refresh);
  }, [dataReady, tick]);

  // Count the 1 s from the moment the splash is actually on screen (after its image decoded).
  const splashTimer = useRef(null);
  const onSplashShown = () => {
    clearTimeout(splashTimer.current);
    splashTimer.current = setTimeout(() => setSplashMinDone(true), SPLASH_MIN_MS);
  };
  useEffect(() => () => clearTimeout(splashTimer.current), []);

  // The next screen is ready once we know who is signed in (and, if someone is, their list loaded).
  const nextScreenReady = authReady && (!user || dataReady);
  useEffect(() => {
    if (splash !== 'shown' || !splashMinDone || !nextScreenReady) return;
    setSplash('leaving');
    const t = setTimeout(() => setSplash('gone'), 450);
    return () => clearTimeout(t);
  }, [splash, splashMinDone, nextScreenReady]);

  // With accounts the avatar opens the profile page; local-only mode keeps the info sheet.
  const openAccount = () => (firebaseEnabled ? setShowProfile(true) : setShowAccount(true));

  const splashLayer = splash !== 'gone' && <Splash leaving={splash === 'leaving'} onShown={onSplashShown} />;

  // Firebase restores the session asynchronously — show a blank screen for that
  // split second instead of flashing the login form at a signed-in user.
  if (!authReady) return <div className="app" style={{ background: '#000' }}>{splashLayer}</div>;
  // Welcome screen: sign in or register before using the app.
  if (firebaseEnabled && !user) return <div className="app"><AuthScreen fromSplash={splash !== 'gone'} />{splashLayer}</div>;
  if (!dataReady) return <div className="app" style={{ background: '#000' }}>{splashLayer}</div>;

  return (
    <div className="app">
      {/* Both tabs stay mounted and are only shown/hidden: switching is instant,
          with no re-render of the list and no re-decoding of the mascot image */}
      <div style={{ display: page === 'home' ? 'block' : 'none' }}>
        <HomePage onOpenCategory={id => setCatId(id)} onProfile={openAccount} onRefresh={refresh} profile={profile} refreshKey={tick} />
      </div>
      <div style={{ display: page === 'rand' ? 'block' : 'none' }}>
        <RandPage onOpenCategory={id => setCatId(id)} onProfile={openAccount} onRefresh={refresh} profile={profile} refreshKey={tick} />
      </div>
      {catId && <CategoryPage categoryId={catId} refreshKey={tick} onBack={() => setCatId(null)} onRefresh={refresh} />}
      {showProfile && user && <ProfilePage user={user} profile={profile} refreshKey={tick} onClose={() => setShowProfile(false)} onOpenCategory={id => { setShowProfile(false); setCatId(id); }} />}
      {!catId && !showProfile && <Island activePage={page} onChangePage={setPage} onRefresh={refresh} />}
      {showAccount && <AccountSheet user={user} syncStatus={syncStatus} onClose={() => setShowAccount(false)} />}
      {splashLayer}
    </div>
  );
}
