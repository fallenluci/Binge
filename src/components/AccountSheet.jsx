import { useState } from 'react';
import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { auth, firebaseEnabled } from '../firebase';
import { flushSync } from '../sync';

const ERRORS = {
  'auth/invalid-email': 'Неверный формат email',
  'auth/missing-password': 'Введи пароль',
  'auth/weak-password': 'Пароль должен быть не короче 6 символов',
  'auth/email-already-in-use': 'Этот email уже зарегистрирован — попробуй войти',
  'auth/invalid-credential': 'Неверный email или пароль',
  'auth/user-not-found': 'Аккаунт с таким email не найден',
  'auth/wrong-password': 'Неверный email или пароль',
  'auth/too-many-requests': 'Слишком много попыток, попробуй позже',
  'auth/network-request-failed': 'Нет соединения с сервером',
};
const message = (e) => ERRORS[e?.code] || 'Что-то пошло не так, попробуй ещё раз';

const STATUS = {
  synced: { text: 'Синхронизировано', color: '#30D158' },
  syncing: { text: 'Синхронизация…', color: 'var(--text-dim)' },
  offline: { text: 'Нет сети — изменения отправятся позже', color: '#D98E2C' },
  error: { text: 'Ошибка синхронизации', color: '#FF453A' },
};

const inputStyle = {
  width: '100%', padding: '15px 16px', borderRadius: 14, border: '1px solid rgb(64,64,66)',
  background: 'rgb(44,44,46)', fontSize: 16, fontFamily: 'inherit', outline: 'none',
  color: 'var(--text)', marginBottom: 12,
};
const primaryBtn = {
  width: '100%', padding: 16, borderRadius: 14, border: 'none', background: 'var(--accent)',
  color: 'white', fontSize: 17, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
};
const secondaryBtn = {
  ...primaryBtn, background: 'rgb(48,48,50)', color: 'var(--text)', fontSize: 16, marginTop: 10,
};
const linkBtn = {
  background: 'none', border: 'none', color: 'var(--accent)', fontSize: 15, cursor: 'pointer',
  fontFamily: 'inherit', padding: 8,
};

export default function AccountSheet({ user, syncStatus, onClose }) {
  const [mode, setMode] = useState('login'); // login | register
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError(''); setInfo(''); setBusy(true);
    try {
      if (mode === 'register') await createUserWithEmailAndPassword(auth, email.trim(), password);
      else await signInWithEmailAndPassword(auth, email.trim(), password);
      onClose();
    } catch (err) {
      setError(message(err));
    } finally {
      setBusy(false);
    }
  };

  const resetPassword = async () => {
    setError(''); setInfo('');
    if (!email.trim()) { setError('Сначала введи email'); return; }
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setInfo('Письмо для сброса пароля отправлено (проверь «Спам»)');
    } catch (err) {
      setError(message(err));
    }
  };

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
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 399 }} onClick={onClose} />
      <div className="glass" style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 430, borderRadius: '28px 28px 0 0', padding: '20px 22px 48px', zIndex: 400, animation: 'slideUp 0.35s cubic-bezier(0.34,1.26,0.64,1)' }}>
        <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgb(86,86,88)', margin: '0 auto 20px' }} />

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

        {firebaseEnabled && !user && (
          <form onSubmit={submit}>
            <div style={{ fontSize: 20, fontWeight: 500, textAlign: 'center', color: 'var(--text)', marginBottom: 6 }}>
              {mode === 'login' ? 'Вход' : 'Регистрация'}
            </div>
            <div style={{ fontSize: 14, color: 'var(--text-dim)', textAlign: 'center', marginBottom: 18, lineHeight: 1.4 }}>
              Чтобы фильмы были одинаковыми на телефоне и компьютере
            </div>
            <input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" style={inputStyle} />
            <input type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder={mode === 'register' ? 'Пароль (от 6 символов)' : 'Пароль'} style={inputStyle} />
            {error && <div style={{ color: '#FF453A', fontSize: 14, marginBottom: 12 }}>{error}</div>}
            {info && <div style={{ color: '#30D158', fontSize: 14, marginBottom: 12 }}>{info}</div>}
            <button type="submit" disabled={busy} style={{ ...primaryBtn, opacity: busy ? 0.6 : 1 }}>
              {busy ? '…' : mode === 'login' ? 'Войти' : 'Создать аккаунт'}
            </button>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10 }}>
              <button type="button" style={linkBtn} onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); setInfo(''); }}>
                {mode === 'login' ? 'Создать аккаунт' : 'У меня есть аккаунт'}
              </button>
              {mode === 'login' && <button type="button" style={linkBtn} onClick={resetPassword}>Забыл пароль</button>}
            </div>
          </form>
        )}
      </div>
    </>
  );
}
