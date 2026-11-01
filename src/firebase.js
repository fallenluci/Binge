import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';

// Keys come from .env.local (locally) or Vercel → Settings → Environment Variables.
// They are public client identifiers, not secrets: access is protected by
// Firestore security rules (see firestore.rules).
const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Without keys the app keeps working exactly as before — local-only.
export const firebaseEnabled = Boolean(config.apiKey && config.projectId);

export const app = firebaseEnabled ? initializeApp(config) : null;
export const auth = firebaseEnabled ? getAuth(app) : null;
// Offline cache: the PWA keeps working without network and syncs when back online.
export const db = firebaseEnabled
  ? initializeFirestore(app, { localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }) })
  : null;
