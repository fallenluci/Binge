import { collection, doc, getDocsFromServer, onSnapshot, writeBatch } from 'firebase/firestore';
import { db } from './firebase';
import { getData, onLocalSave, replaceDataFromRemote } from './store';

// Layout in Firestore: users/{uid}/categories/{categoryId}
// Each category doc holds the category fields, its films array and its `order`
// on the home screen. One doc per category keeps every doc far below
// Firestore's 1 MiB limit (photos are compressed on upload, see lib/image.js).

const PUSH_DELAY_MS = 400; // coalesce bursts of edits (e.g. scrolling the rating drum)
const MAX_DOC_CHARS = 900_000;

let unsubSnapshot = null;
let unsubSave = null;
let pushTimer = null;
let pendingPush = null; // () => Promise, the debounced push not yet sent
let lastRemote = new Map(); // id -> serialized doc, what we believe the server has

// Firestore rejects `undefined`; a JSON round-trip drops those fields.
const clean = (value) => JSON.parse(JSON.stringify(value));

// Key-order-independent JSON, so a doc read back from Firestore (keys reordered)
// compares equal to the one we wrote and isn't re-uploaded on every change.
function stable(value) {
  if (Array.isArray(value)) return `[${value.map(stable).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map((k) => `${JSON.stringify(k)}:${stable(value[k])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

function toDocs(data) {
  const docs = new Map();
  data.categories.forEach((cat, order) => {
    let body = clean({ ...cat, order });
    delete body.id;
    if (JSON.stringify(body).length > MAX_DOC_CHARS) {
      // Safety net for photos added before compression existed: sync without the image.
      console.warn(`Category "${cat.name}" is too large to sync; its photo stays on this device only.`);
      body = { ...body, image: null };
    }
    docs.set(cat.id, body);
  });
  return docs;
}

function fromSnapshot(snap) {
  const categories = snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .map(({ order, ...cat }) => ({ ...cat, films: cat.films ?? [] }));
  return { categories };
}

async function pushNow(uid, data, onStatus) {
  const desired = toDocs(data);
  const batch = writeBatch(db);
  let changes = 0;

  desired.forEach((body, id) => {
    if (lastRemote.get(id) !== stable(body)) {
      batch.set(doc(db, 'users', uid, 'categories', id), body);
      changes++;
    }
  });
  lastRemote.forEach((_, id) => {
    if (!desired.has(id)) {
      batch.delete(doc(db, 'users', uid, 'categories', id));
      changes++;
    }
  });
  if (!changes) return;

  lastRemote = new Map([...desired].map(([id, body]) => [id, stable(body)]));
  onStatus?.('syncing');
  try {
    await batch.commit(); // resolves once the server has it; offline it waits and retries
    onStatus?.('synced');
  } catch (e) {
    console.error('Sync push failed', e);
    onStatus?.('error');
  }
}

function schedulePush(uid, data, onStatus) {
  clearTimeout(pushTimer);
  pendingPush = () => pushNow(uid, data, onStatus);
  pushTimer = setTimeout(() => { const run = pendingPush; pendingPush = null; run?.(); }, PUSH_DELAY_MS);
}

// Send any debounced edit right away — call before signing out, otherwise the
// last change would be written without credentials and rejected.
export async function flushSync() {
  clearTimeout(pushTimer);
  const run = pendingPush;
  pendingPush = null;
  if (run) await run();
}

/**
 * Start two-way sync for a signed-in user.
 * onRemoteChange — called when another device changed the data (re-render the UI).
 * onStatus — 'syncing' | 'synced' | 'offline' | 'error'.
 */
export async function startSync(uid, { onRemoteChange, onStatus }) {
  stopSync();
  const col = collection(db, 'users', uid, 'categories');
  onStatus?.('syncing');

  // Decide the first-login merge against the *server*, never the offline cache:
  // an empty cache must not be mistaken for an empty account.
  try {
    const initial = await getDocsFromServer(col);
    if (initial.empty) {
      lastRemote = new Map();
      await pushNow(uid, getData(), onStatus); // first login: keep what's on this device
    } else {
      const remote = fromSnapshot(initial);
      lastRemote = toSerializedMap(initial);
      replaceDataFromRemote(remote);
      onRemoteChange?.();
    }
  } catch (e) {
    console.warn('Server unreachable, starting from offline cache', e);
    onStatus?.('offline');
  }

  unsubSnapshot = onSnapshot(col, (snap) => {
    if (snap.metadata.hasPendingWrites) return; // our own write echoing back
    lastRemote = toSerializedMap(snap);
    const remote = fromSnapshot(snap);
    if (stable(remote) !== stable(getData())) {
      replaceDataFromRemote(remote);
      onRemoteChange?.();
    }
    onStatus?.(snap.metadata.fromCache ? 'offline' : 'synced');
  }, (e) => {
    console.error('Sync listener failed', e);
    onStatus?.('error');
  });

  unsubSave = onLocalSave((data) => schedulePush(uid, data, onStatus));
}

function toSerializedMap(snap) {
  return new Map(snap.docs.map((d) => { const { order, ...rest } = d.data(); return [d.id, stable(clean({ ...rest, order }))]; }));
}

export function stopSync() {
  clearTimeout(pushTimer);
  pendingPush = null;
  unsubSnapshot?.();
  unsubSave?.();
  unsubSnapshot = unsubSave = null;
  lastRemote = new Map();
}
