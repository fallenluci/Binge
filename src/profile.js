import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from './firebase';

// Profile lives in one doc: users/{uid}/profile/main
// { name, avatar, avatarPos, banner, bannerPos } — images are compressed data URLs,
// positions are { x, y, scale } (see components/CroppedImage.jsx).
const ref = (uid) => doc(db, 'users', uid, 'profile', 'main');

export function subscribeProfile(uid, onChange) {
  return onSnapshot(ref(uid), (snap) => onChange(snap.exists() ? snap.data() : {}), (e) => {
    console.error('Profile listener failed', e);
  });
}

// Writes apply to the local cache instantly (and sync later when offline),
// so callers don't need to wait for the server.
export function saveProfile(uid, patch) {
  const clean = JSON.parse(JSON.stringify(patch)); // Firestore rejects undefined
  return setDoc(ref(uid), { ...clean, updatedAt: Date.now() }, { merge: true })
    .catch((e) => console.error('Profile save failed', e));
}

export const displayNameOf = (profile, user) =>
  profile?.name || user?.displayName || (user?.email ? user.email.split('@')[0] : '');
