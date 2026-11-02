import { useState } from 'react';
import { signOut } from 'firebase/auth';
import { auth, firebaseEnabled } from '../firebase';
import { flushSync } from '../sync';

const STATUS = {
  synced: { text: 'Синхронизировано', color: '#30D158' },
  syncing: { text: 'Синхронизация…', color: 'var(--text-dim)' },
  offline: { text: 'Нет сети — изменения отправятся позже', color: '#D98E2C' },
  error: { text: 'Ошибка синхронизации', color: '#FF453A' },
};

const primaryBtn = {
  width: '100%', padding: 16, borderRadius: 14, border: 'none', background: 'var(--accent)',
  color: 'white', fontSize: 17, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
};
const secondaryBtn = {
  ...primaryBtn, background: 'rgb(48,48,50)', color: 'var(--text)', fontSize: 16, marginTop: 10,
};
export default function AccountSheet({ user, syncStatus, onClose }) {
  const [busy, setBusy] = useState(false);

  const logout = async () => {
    setBusy(true);
    await flushSync(); // don't lose an edit made right before signing out
    await signOut(auth);
    setBusy(false);
    onClose();
  };

  const status = STATUS[syncStatus] || STATUS.syncing;

  return (
    <>
      <div className="sheet-backdrop" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 399 }} onClick={onClose} />
      <div className="glass sheet-panel" style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 430, borderRadius: '28px 28px 0 0', padding: '20px 22px 48px', zIndex: 400, animation: 'slideUp 0.35s cubic-bezier(0.34,1.26,0.64,1)' }}>
        <div className="sheet-handle" style={{ width: 36, height: 4, borderRadius: 2, background: 'rgb(86,86,88)', margin: '0 auto 20px' }} />

        {!firebaseEnabled && (
          <>
            <div style={{ fontSize: 20, fontWeight: 500, textAlign: 'center', color: 'var(--text)', marginBottom: 10 }}>Аккаунт</div>
            <div style={{ fontSize: 15, color: 'var(--text-dim)', textAlign: 'center', marginBottom: 20, lineHeight: 1.4 }}>
              Синхронизация ещё не настроена — сейчас фильмы хранятся только на этом устройстве.
            </div>
            <button onClick={onClose} style={secondaryBtn}>Закрыть</button>
          </>
        )}

        {firebaseEnabled && user && (
          <>
            <div style={{ fontSize: 20, fontWeight: 500, textAlign: 'center', color: 'var(--text)', marginBottom: 6 }}>Аккаунт</div>
            <div style={{ fontSize: 15, color: 'var(--text-dim)', textAlign: 'center', marginBottom: 6, wordBreak: 'break-all' }}>{user.email}</div>
            <div style={{ fontSize: 13, color: status.color, textAlign: 'center', marginBottom: 22 }}>● {status.text}</div>
            <div style={{ fontSize: 14, color: 'var(--text-dim)', textAlign: 'center', marginBottom: 20, lineHeight: 1.4 }}>
              Войди в этот же аккаунт на телефоне или компьютере — список будет одинаковым везде.
            </div>
            <button onClick={logout} disabled={busy} style={{ ...secondaryBtn, color: '#FF453A', marginTop: 0 }}>Выйти</button>
          </>
        )}

      </div>
    </>
  );
}
