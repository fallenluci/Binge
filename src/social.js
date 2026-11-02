import {
  collection, deleteDoc, doc, getDoc, getDocs, onSnapshot, query, setDoc, where, writeBatch,
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
 *
 * Category visibility lives on the private category: cat.visibility
 *   'private' (default) — only me;  'link' — anyone with the link;  'public' — also on my profile.
 */

export const socialEnabled = firebaseEnabled;
const clean = (v) => JSON.parse(JSON.stringify(v));

export const profileLink = (uid) => `${location.origin}/u/${uid}`;
export const categoryLink = (uid, catId) => `${location.origin}/u/${uid}/c/${catId}`;

// ---------- publishing ----------

const shownFilm = (f) => ({ id: f.id, name: f.name, rating: f.rating ?? null, poster: f.poster || null, ratedAt: f.ratedAt || null });
const shownCat = (c) => ({ id: c.id, name: c.name, color: c.color });

function snapshotOf(profile, user) {
  const cats = getCategories();
  const open = cats.filter((c) => c.visibility === 'public');
  // Numbers count everything; film titles only come from categories made public
  const all = computeStats(cats);
  const pub = computeStats(open);
  const asItem = (f) => ({ ...shownFilm(f), cat: shownCat(f.cat) });
  return clean({
    name: profile?.name || user?.displayName || (user?.email || '').split('@')[0] || 'Без имени',
    avatar: profile?.avatar || null, avatarPos: profile?.avatarPos || null,
    banner: profile?.banner || null, bannerPos: profile?.bannerPos || null,
    stats: { total: all.total, rated: all.rated, avg: all.avg },
    top: pub.top.map(asItem),
    topFresh: pub.topFresh,
    recent: pub.recent.map(asItem),
    favorite: pub.favorite ? { cat: shownCat(pub.favorite.cat), count: pub.favorite.count, avg: pub.favorite.avg } : null,
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
