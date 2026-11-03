import {
  collection, deleteDoc, doc, getDoc, getDocs, increment, limitToLast, onSnapshot, orderBy, query, setDoc, where, writeBatch,
} from 'firebase/firestore';
import { db, firebaseEnabled } from './firebase';
import { getCategories, getData, saveData } from './store';
import { computeStats } from './components/ProfileStats';

/**
 * Public profiles, friends and sharing.
 *
 * Firestore layout (see firestore.rules):
 *   public/{uid}                      — public profile snapshot, anyone can read
 *   public/{uid}/categories/{id}      — published categories (visibility public | link)
 *   users/{uid}/friends/{otherUid}    — { status: outgoing | incoming | friends, at }
 *   users/{uid}/inbox/{id}            — categories friends sent to this user
 *   users/{uid}/chats/{otherUid}      — my chat list: last message preview, unread count
 *   chats/{a_b}/messages/{id}         — messages between two friends (a_b = the two uids, sorted)
 *
 * Category visibility lives on the private category: cat.visibility
 *   'private' (default) — only me;  'link' — anyone with the link;  'public' — also on my profile.
 */

export const socialEnabled = firebaseEnabled;
const clean = (v) => JSON.parse(JSON.stringify(v));

export const profileLink = (uid) => `${location.origin}/u/${uid}`;
export const categoryLink = (uid, catId) => `${location.origin}/u/${uid}/c/${catId}`;

// ---------- publishing ----------

const shownFilm = (f) => ({
  id: f.id, name: f.name, rating: f.rating ?? null, poster: f.poster || null, ratedAt: f.ratedAt || null,
  tmdbId: f.tmdbId || null, tmdbType: f.tmdbType || null, info: f.info || null,
});
const shownCat = (c) => ({ id: c.id, name: c.name, color: c.color });
// shared — the category itself can be opened by others (public or by link)
const shownCatRef = (c) => ({ ...shownCat(c), shared: c.visibility === 'public' || c.visibility === 'link' });

function snapshotOf(profile, user) {
  const cats = getCategories();
  const open = cats.filter((c) => c.visibility === 'public');
  // Numbers, top 5, recently watched and the favourite come from all categories;
  // the categories themselves are listed / openable only when made public
  const all = computeStats(cats);
  const asItem = (f) => ({ ...shownFilm(f), cat: shownCatRef(f.cat) });
  return clean({
    name: profile?.name || user?.displayName || (user?.email || '').split('@')[0] || 'Без имени',
    bio: profile?.bio || null,
    avatar: profile?.avatar || null, avatarPos: profile?.avatarPos || null,
    banner: profile?.banner || null, bannerPos: profile?.bannerPos || null,
    stats: { total: all.total, rated: all.rated, avg: all.avg },
    top: all.top.map(asItem),
    topFresh: all.topFresh,
    recent: all.recent.map(asItem),
    favorite: all.favorite ? { cat: shownCatRef(all.favorite.cat), count: all.favorite.count, avg: all.favorite.avg } : null,
    categories: open.map((c) => ({ ...shownCat(c), count: c.films.length })),
    updatedAt: Date.now(),
  });
}

function categoryDoc(c, order) {
  return clean({
    name: c.name, color: c.color, image: c.image || null, imageCrop: c.imageCrop || null,
    visibility: c.visibility, order,
    films: c.films.map(shownFilm),
    updatedAt: Date.now(),
  });
}

let lastPublished = { profile: '', cats: new Map() };
let timer = null;

/** Mirror what is public into public/{uid}. Debounced; only changed docs are written. */
export function schedulePublish(user, profile) {
  if (!socialEnabled || !user) return;
  clearTimeout(timer);
  timer = setTimeout(() => publishNow(user, profile).catch((e) => console.error('Publish failed', e)), 1500);
}

async function publishNow(user, profile) {
  const uid = user.uid;
  const batch = writeBatch(db);
  let changes = 0;

  const snap = snapshotOf(profile, user);
  const key = JSON.stringify({ ...snap, updatedAt: 0 });
  if (key !== lastPublished.profile) { batch.set(doc(db, 'public', uid), snap); changes++; }

  const shared = new Map();
  getCategories().forEach((c, i) => { if (c.visibility === 'public' || c.visibility === 'link') shared.set(c.id, categoryDoc(c, i)); });
  if (!lastPublished.loaded) {
    // First run on this device: learn what's already published so stale ones get removed
    const existing = await getDocs(collection(db, 'public', uid, 'categories')).catch(() => null);
    existing?.docs.forEach((d) => lastPublished.cats.set(d.id, ''));
    lastPublished.loaded = true;
  }
  shared.forEach((body, id) => {
    const k = JSON.stringify({ ...body, updatedAt: 0 });
    if (lastPublished.cats.get(id) !== k) { batch.set(doc(db, 'public', uid, 'categories', id), body); changes++; }
  });
  lastPublished.cats.forEach((_, id) => { if (!shared.has(id)) { batch.delete(doc(db, 'public', uid, 'categories', id)); changes++; } });

  if (!changes) return;
  await batch.commit();
  lastPublished = { loaded: true, profile: key, cats: new Map([...shared].map(([id, b]) => [id, JSON.stringify({ ...b, updatedAt: 0 })])) };
}

export function resetPublishCache() { lastPublished = { profile: '', cats: new Map() }; }

export function setCategoryVisibility(catId, visibility) {
  const data = getData();
  data.categories = data.categories.map((c) => (c.id === catId ? { ...c, visibility } : c));
  saveData(data);
}

// ---------- reading public data ----------

export async function getPublicProfile(uid) {
  const s = await getDoc(doc(db, 'public', uid));
  return s.exists() ? s.data() : null;
}
export function subscribePublicProfile(uid, cb) {
  return onSnapshot(doc(db, 'public', uid), (s) => cb(s.exists() ? s.data() : null), () => cb(null));
}
export async function getPublicCategories(uid) {
  const s = await getDocs(query(collection(db, 'public', uid, 'categories'), where('visibility', '==', 'public')));
  return s.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}
export async function getPublicCategory(uid, catId) {
  const s = await getDoc(doc(db, 'public', uid, 'categories', catId));
  return s.exists() ? { id: s.id, ...s.data() } : null;
}

// Save someone's category as my own copy (films unrated, posters and TMDB ids kept)
export function saveCategoryCopy(cat) {
  const data = getData();
  const stamp = Date.now();
  let n = 0;
  data.categories.push({
    id: `${stamp}-c`, name: cat.name, color: cat.color, image: cat.image || null, imageCrop: cat.imageCrop || null,
    visibility: 'private',
    films: (cat.films || []).map((f) => ({ id: `${stamp}-${n++}`, name: f.name, rating: null, addedAt: stamp, poster: f.poster || null, posterChecked: !!f.poster })),
  });
  saveData(data);
}

// ---------- friends ----------

const friendRef = (owner, other) => doc(db, 'users', owner, 'friends', other);

export function subscribeFriends(uid, cb) {
  return onSnapshot(collection(db, 'users', uid, 'friends'), (s) => cb(s.docs.map((d) => ({ uid: d.id, ...d.data() }))), () => cb([]));
}
export function subscribeFriendship(me, other, cb) {
  return onSnapshot(friendRef(me, other), (s) => cb(s.exists() ? s.data().status : null), () => cb(null));
}

export async function sendFriendRequest(me, other) {
  const at = Date.now();
  await setDoc(friendRef(me, other), { status: 'outgoing', at });
  await setDoc(friendRef(other, me), { status: 'incoming', at });
}
export async function acceptFriend(me, other) {
  const at = Date.now();
  await setDoc(friendRef(me, other), { status: 'friends', at });
  await setDoc(friendRef(other, me), { status: 'friends', at });
}
// Decline, cancel or unfriend — removes the link on both sides
export async function removeFriend(me, other) {
  await deleteDoc(friendRef(me, other));
  await deleteDoc(friendRef(other, me)).catch(() => {});
}

// ---------- sending a category to a friend ----------

export async function sendCategory(me, friendUid, cat) {
  const id = `${me}_${cat.id}`; // sending again just refreshes the same entry
  await setDoc(doc(db, 'users', friendUid, 'inbox', id), { from: me, catId: cat.id, name: cat.name, color: cat.color, at: Date.now() });
}
export function subscribeInbox(uid, cb) {
  return onSnapshot(collection(db, 'users', uid, 'inbox'), (s) => cb(s.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => b.at - a.at)), () => cb([]));
}
export const dismissInbox = (uid, id) => deleteDoc(doc(db, 'users', uid, 'inbox', id));

// ---------- chat with friends ----------

export const chatIdOf = (a, b) => [a, b].sort().join('_');
const MSG_LIMIT = 300;

/** My chats, newest first: [{ uid, lastAt, lastFrom, previewText, previewFilm, previewRating, unread }] */
export function subscribeChats(uid, cb) {
  return onSnapshot(collection(db, 'users', uid, 'chats'),
    (s) => cb(s.docs.map((d) => ({ uid: d.id, ...d.data() })).sort((a, b) => (b.lastAt || 0) - (a.lastAt || 0))), () => cb([]));
}

export function subscribeMessages(me, other, cb) {
  const q = query(collection(db, 'chats', chatIdOf(me, other), 'messages'), orderBy('at'), limitToLast(MSG_LIMIT));
  return onSnapshot(q, (s) => cb(s.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => a.at - b.at)), () => cb([]));
}

// What goes into a film message: enough to show the card and add the film to your own list
export const filmForChat = (f) => clean({
  name: f.name, rating: f.rating ?? null, poster: f.poster || null,
  tmdbId: f.tmdbId || null, tmdbType: f.tmdbType || null, info: f.info || null,
});

export async function sendMessage(me, other, { text, film }) {
  const at = Date.now();
  const id = `${at}-${Math.random().toString(36).slice(2, 8)}`;
  const msg = clean({ from: me, at, text: text || null, film: film || null });
  await setDoc(doc(db, 'chats', chatIdOf(me, other), 'messages', id), msg);
  const preview = { lastAt: at, lastFrom: me, previewText: film ? null : text.slice(0, 120), previewFilm: film ? film.name : null, previewRating: film ? film.rating ?? null : null };
  await setDoc(doc(db, 'users', me, 'chats', other), { ...preview, unread: 0 }, { merge: true });
  await setDoc(doc(db, 'users', other, 'chats', me), { ...preview, unread: increment(1) }, { merge: true });
}

export const markChatRead = (me, other) => setDoc(doc(db, 'users', me, 'chats', other), { unread: 0 }, { merge: true });
