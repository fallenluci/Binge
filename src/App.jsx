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
import { replaceDataFromRemote, onLocalSave, getCategories } from './store';
import PublicView from './pages/PublicView';
import { schedulePublish, resetPublishCache, subscribeChats, subscribeFriends, subscribeInbox } from './social';
import ChatPage from './pages/ChatPage';
import { Screen } from './lib/screen';
import { fillMissingPosters } from './lib/posters';

const SPLASH_MIN_MS = 1000;
// Launch splash only on phones (touch screen or narrow window).
const IS_MOBILE = typeof window !== 'undefined' &&
  (window.matchMedia?.('(pointer: coarse)').matches || window.innerWidth < 768);

/*
 * Addresses (refresh keeps you where you are; browser back/forward walk through screens):
 *   /            home            /random        the randomizer tab
 *   /c/{id}      my category     /me            my profile
 *   /chats       chats           /chats/{uid}   a conversation
 *   /u/{uid}     someone's profile, /u/{uid}/c/{id} — one of their categories
 */
const parsePath = (path = location.pathname) => {
  let m;
  if ((m = path.match(/^\/c\/([^/]+)\/?$/))) return { cat: decodeURIComponent(m[1]) };
  if (/^\/me\/?$/.test(path)) return { me: true };
  if ((m = path.match(/^\/chats(?:\/([^/]+))?\/?$/))) return { chat: { with: m[1] ? decodeURIComponent(m[1]) : null } };
  if (/^\/random\/?$/.test(path)) return { tab: 'rand' };
  if (/^\/u\//.test(path)) return { public: true };
  return { tab: 'home' };
};

// /u/{uid} — someone's public profile, /u/{uid}/c/{id} — one of their categories
const parseRoute = () => {
  const m = location.pathname.match(/^\/u\/([^/]+)(?:\/c\/([^/]+))?\/?$/);
  return m ? { uid: decodeURIComponent(m[1]), catId: m[2] ? decodeURIComponent(m[2]) : null } : null;
};

export default function App() {
  const [page, setPageRaw] = useState(() => (parsePath().tab === 'rand' ? 'rand' : 'home'));
  // Switching tabs: the new one slides in from its side (Home is on the left, Random on the right)
  const [tabAnim, setTabAnim] = useState('');
  const setPage = (p) => setPageRaw((cur) => { if (p !== cur) setTabAnim(p === 'rand' ? 'tab-from-right' : 'tab-from-left'); return p; });
  const [catId, setCatId] = useState(() => parsePath().cat || null);
  const [catIntent, setCatIntent] = useState(null); // 'appearance' — open the category with its editor
  const [tick, setTick] = useState(0);
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(!firebaseEnabled);
  const [dataReady, setDataReady] = useState(!firebaseEnabled);
  const [syncStatus, setSyncStatus] = useState('synced');
  const [showAccount, setShowAccount] = useState(false);
  const [showProfile, setShowProfile] = useState(() => !!parsePath().me);
  const [profile, setProfile] = useState(null);
  const unsubProfile = useRef(null);
  const hadUser = useRef(false);
  const [splash, setSplash] = useState(IS_MOBILE ? 'shown' : 'gone'); // shown | leaving | gone
  const [splashMinDone, setSplashMinDone] = useState(!IS_MOBILE);
  const refresh = () => setTick(t => t + 1);

  // ---- addresses ----
  const [route, setRoute] = useState(parseRoute);
  const [chatOpen, setChatOpen] = useState(() => parsePath().chat || null); // { with: uid | null }
  // Put the screens in the state the address describes. Someone's profile (/u/…) opens
  // over whatever was open (a chat, my profile) and leaves it as it was underneath.
  const applyPath = (path = location.pathname) => {
    const st = parsePath(path);
    setRoute(parseRoute());
    if (st.public) return;
    setCatId(st.cat || null);
    setShowProfile(!!st.me);
    setChatOpen(st.chat || null);
    if (st.tab) setPage(st.tab);
  };
  const applyRef = useRef(applyPath);
  applyRef.current = applyPath;
  useEffect(() => {
    const on = () => applyRef.current();
    window.addEventListener('popstate', on);
    return () => window.removeEventListener('popstate', on);
  }, []);
  // Forward: a new history entry. `replace` — swap the current one (tabs, switching chats).
  const go = (path, replace = false) => {
    if (location.pathname === path) return;
    if (replace) history.replaceState(history.state, '', path);
    else history.pushState({ dori: (history.state?.dori || 0) + 1 }, '', path);
    applyPath(path);
  };
  // Back: like the browser's back when we came here inside the app, otherwise to `fallback`
  const back = (fallback = '/') => {
    if (history.state?.dori) history.back();
    else { history.replaceState(null, '', fallback); applyPath(fallback); }
  };
  const openPublic = (uid, cat) => go(cat ? `/u/${uid}/c/${cat}` : `/u/${uid}`);
  const closePublic = () => back('/');
  // Opened a link without an account → sign in, then come back to the same link
  const goLogin = () => {
    try { sessionStorage.setItem('dori-after-login', location.pathname); } catch { /* private mode */ }
    history.replaceState(null, '', '/'); setRoute(null);
  };
  useEffect(() => {
    if (!user) return;
    let back = null;
    try { back = sessionStorage.getItem('dori-after-login'); sessionStorage.removeItem('dori-after-login'); } catch { /* ignore */ }
    if (back && back.startsWith('/')) { history.replaceState(null, '', back); applyRef.current(back); }
  }, [user]);

  // ---- friends, inbox, publishing what's public ----
  const [social, setSocial] = useState({ friends: [], inbox: [], chats: [] });
  useEffect(() => {
    if (!user) { setSocial({ friends: [], inbox: [], chats: [] }); resetPublishCache(); return; }
    const a = subscribeFriends(user.uid, (friends) => setSocial((s) => ({ ...s, friends })));
    const b = subscribeInbox(user.uid, (inbox) => setSocial((s) => ({ ...s, inbox })));
    const c = subscribeChats(user.uid, (chats) => setSocial((s) => ({ ...s, chats })));
    return () => { a(); b(); c(); };
  }, [user]);
  // Chats: null — closed, { with: uid | null } — open (on a conversation or on the list)
  const chatUnread = social.chats.reduce((n, c) => n + (c.unread || 0), 0);
  const chat = firebaseEnabled ? { open: () => go('/chats'), unread: chatUnread } : null;
  const profileRef = useRef(profile);
  profileRef.current = profile;
  useEffect(() => {
    if (!user || !dataReady) return;
    schedulePublish(user, profileRef.current);
    return onLocalSave(() => schedulePublish(user, profileRef.current));
  }, [user, dataReady]);
  useEffect(() => { if (user && dataReady && profile) schedulePublish(user, profile); }, [profile]); // eslint-disable-line react-hooks/exhaustive-deps
  const badge = social.friends.filter((f) => f.status === 'incoming').length + social.inbox.length;

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
        // Signed out: whatever address it was (a category, a chat) means nothing now
        if (location.pathname !== '/' && !location.pathname.startsWith('/u/')) history.replaceState(null, '', '/');
        if (hadUser.current) setChatOpen(null);
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

  // An address with a category that isn't there (deleted, another account) → home
  useEffect(() => {
    if (dataReady && catId && !getCategories().some((c) => c.id === catId)) back('/');
  }, [dataReady, catId]); // eslint-disable-line react-hooks/exhaustive-deps

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
  const openAccount = () => (firebaseEnabled ? go('/me') : setShowAccount(true));
  const openCategory = (id, intent) => { setCatIntent(intent || null); go(`/c/${encodeURIComponent(id)}`); };
  const changeTab = (p) => go(p === 'rand' ? '/random' : '/', true);

  const splashLayer = splash !== 'gone' && <Splash leaving={splash === 'leaving'} onShown={onSplashShown} />;

  // Firebase restores the session asynchronously — show a blank screen for that
  // split second instead of flashing the login form at a signed-in user.
  if (!authReady) return <div className="app" style={{ background: '#000' }}>{splashLayer}</div>;
  // Welcome screen: sign in or register before using the app.
  // Public links open without an account
  if (firebaseEnabled && !user && route) return <div className="app"><PublicView uid={route.uid} catId={route.catId} me={null} onOpen={openPublic} onClose={goLogin} onLogin={goLogin} />{splashLayer}</div>;
  if (firebaseEnabled && !user) return <div className="app"><AuthScreen fromSplash={splash !== 'gone'} />{splashLayer}</div>;
  if (!dataReady) return <div className="app" style={{ background: '#000' }}>{splashLayer}</div>;

  return (
    <div className="app">
      {/* Both tabs stay mounted and are only shown/hidden: switching is instant,
          with no re-render of the list and no re-decoding of the mascot image */}
      <div className={page === 'home' ? tabAnim : ''} style={{ display: page === 'home' ? 'block' : 'none' }}>
        <HomePage onOpenCategory={openCategory} onProfile={openAccount} onRefresh={refresh} profile={profile} refreshKey={tick} badge={badge} chat={chat} />
      </div>
      <div className={page === 'rand' ? tabAnim : ''} style={{ display: page === 'rand' ? 'block' : 'none' }}>
        <RandPage onOpenCategory={(id) => openCategory(id)} onProfile={openAccount} onRefresh={refresh} profile={profile} refreshKey={tick} badge={badge} chat={chat} />
      </div>
      <Screen show={!!catId} z={20} onBack={() => { back('/'); refresh(); }}>
        {catId && <CategoryPage key={catId} intent={catIntent} categoryId={catId} refreshKey={tick} onBack={() => back('/')} onRefresh={refresh} user={user} profile={profile} social={social} />}
      </Screen>
      <Screen show={showProfile && !!user} z={30} onBack={() => back('/')}>
      {showProfile && user && <ProfilePage user={user} profile={profile} refreshKey={tick} onClose={() => back('/')} onOpenCategory={(id) => go(`/c/${encodeURIComponent(id)}`, true)} social={social} onOpenPublic={openPublic} onOpenChat={(uid) => go(`/chats/${encodeURIComponent(uid)}`)} />}
      </Screen>
      <Screen show={!!route} z={45} background="#000" onBack={closePublic} contentKey={route ? `${route.uid}/${route.catId || ''}` : ''}>
        {route && <PublicView uid={route.uid} catId={route.catId} me={user} onOpen={openPublic} onClose={closePublic} onLogin={goLogin} onSaved={refresh} />}
      </Screen>
      {chatOpen && user && (
        // A friend's profile opens over the chat; "back" returns to the same conversation
        <ChatPage me={user.uid} meName={profile?.name || user.displayName || (user.email || '').split('@')[0]} social={social} chats={social.chats}
          current={chatOpen.with} hidden={!!route} onClose={() => back('/')} onOpenPublic={openPublic} onChanged={refresh}
          onSelect={(uid, sideBySide) => go(`/chats/${encodeURIComponent(uid)}`, sideBySide || !!chatOpen.with)}
          onLeaveChat={() => back('/chats')} />
      )}
      <Island activePage={page} onChangePage={changeTab} onRefresh={refresh} hidden={!!(catId || showProfile || route || chatOpen)} />
      {showAccount && <AccountSheet user={user} syncStatus={syncStatus} onClose={() => setShowAccount(false)} />}
      {splashLayer}
    </div>
  );
}
