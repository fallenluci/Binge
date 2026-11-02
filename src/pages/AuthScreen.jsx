import { useState } from 'react';
import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import { auth } from '../firebase';
import { authErrorMessage } from '../authErrors';

// Measurements taken 1:1 from the Figma mockup (390 × 844 frame).
const PURPLE = '#351E88';
const CARD = '#171717';
const FIELD = '#2C2C2C';

const field = {
  display: 'block', width: '100%', height: 46, borderRadius: 18, border: 'none', outline: 'none',
  background: FIELD, padding: '0 14px', color: '#fff',
  fontFamily: 'inherit', fontSize: 16, fontWeight: 700,
};

const link = {
  background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: PURPLE,
  fontFamily: 'inherit', fontSize: 12, fontWeight: 700, lineHeight: '12px',
};

export default function AuthScreen() {
  const [mode, setMode] = useState('login'); // login | register
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [busy, setBusy] = useState(false);
  const isLogin = mode === 'login';

  const switchMode = () => { setMode(isLogin ? 'register' : 'login'); setError(''); setInfo(''); };

  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;
    setError(''); setInfo(''); setBusy(true);
    try {
      if (isLogin) await signInWithEmailAndPassword(auth, email.trim(), password);
      else await createUserWithEmailAndPassword(auth, email.trim(), password);
      // App switches to the main screen via onAuthStateChanged
    } catch (err) {
      setError(authErrorMessage(err));
      setBusy(false);
    }
  };

  const resetPassword = async () => {
    setError(''); setInfo('');
    if (!email.trim()) { setError('Введи email, и мы пришлём ссылку для сброса'); return; }
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setInfo('Письмо для сброса пароля отправлено — проверь и «Спам»');
    } catch (err) {
      setError(authErrorMessage(err));
    }
  };

  return (
    <div className="auth-screen" style={{ position: 'relative', height: '100dvh', overflow: 'hidden', background: '#000' }}>
      {/* Mascot — same art as on Random, tilted and cropped by the bottom edge */}
      <img
        src="/dori2.png"
        alt=""
        aria-hidden="true"
        draggable="false"
        className="auth-mascot"
        style={{
          // Exact mockup position on an 844pt-tall screen; on shorter phones the mascot
          // slides down so the card never covers it (only the ears peek out).
          position: 'absolute', left: 'calc(50% + 6px)', bottom: 'calc(10.6px - max(0px, (844px - 100dvh) * 0.72))',
          width: 567, height: 567, maxWidth: 'none',
          pointerEvents: 'none', userSelect: 'none', zIndex: 0,
        }}
      />

      <div style={{ position: 'relative', zIndex: 1 }}>
        <div className="auth-reveal" style={{
          paddingTop: 'min(119.5px, 14.16dvh)', textAlign: 'center', color: '#fff',
          fontSize: 96, fontWeight: 800, lineHeight: '96px', letterSpacing: '-1.2px',
        }}>Dori</div>

        <form
          onSubmit={submit}
          className="auth-reveal"
          style={{
            width: 298, margin: 'min(68.5px, 8.12dvh) auto 0', borderRadius: 33, background: CARD,
            padding: '18.5px 22px 24px', animationDelay: '0.08s',
          }}
        >
          <div style={{ textAlign: 'center', color: '#fff', fontSize: 24, fontWeight: 700, lineHeight: '24px' }}>
            {isLogin ? 'Вход' : 'Регистрация'}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 20.5 }}>
            <input
              className="auth-input" style={field}
              type="email" inputMode="email" autoCapitalize="none" autoCorrect="off" autoComplete="email"
              placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)}
            />
            <input
              className="auth-input" style={field}
              type="password" autoComplete={isLogin ? 'current-password' : 'new-password'}
              placeholder="Пароль" value={password} onChange={(e) => setPassword(e.target.value)}
            />
            <button type="submit" disabled={busy} style={{
              ...field, padding: 0, background: PURPLE, cursor: busy ? 'default' : 'pointer',
              opacity: busy ? 0.7 : 1, transition: 'opacity 0.2s, transform 0.15s',
            }}
              onPointerDown={(e) => (e.currentTarget.style.transform = 'scale(0.98)')}
              onPointerUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
              onPointerLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            >
              {isLogin ? 'Войти' : 'Создать аккаунт'}
            </button>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10.5, padding: '0 7px' }}>
            <button type="button" style={link} onClick={switchMode}>
              {isLogin ? 'Создать аккаунт' : 'У меня есть аккаунт'}
            </button>
            {isLogin && <button type="button" style={link} onClick={resetPassword}>Забыл пароль</button>}
          </div>

          {(error || info) && (
            <div role="status" style={{
              marginTop: 14, textAlign: 'center', fontSize: 13, fontWeight: 500, lineHeight: 1.35,
              color: error ? '#FF453A' : '#30D158',
            }}>{error || info}</div>
          )}
        </form>
      </div>
    </div>
  );
}
