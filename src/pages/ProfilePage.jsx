import { useEffect, useRef, useState } from 'react';
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  signOut,
  updatePassword,
  updateProfile,
  verifyBeforeUpdateEmail,
} from 'firebase/auth';
import { auth } from '../firebase';
import { flushSync } from '../sync';
import { saveProfile, displayNameOf } from '../profile';
import { authErrorMessage } from '../authErrors';
import { compressImage } from '../lib/image';
import CroppedImage, { DEFAULT_POS } from '../components/CroppedImage';
import PhotoCropper from '../components/PhotoCropper';
import PhotoMenu from '../components/PhotoMenu';
import ProfileStats from '../components/ProfileStats';
import ProfileDesktop, { DESK_BANNER_RATIO } from './ProfileDesktop';
import { useIsDesktop } from '../lib/useIsDesktop';

// All coordinates below are taken 1:1 from the Figma mockup (390 × 844 frame).
const PURPLE = '#351E88';
const GREY = '#515151';
const FRAME_H = 844;

// Banner fades into black between 235pt and 320pt (sampled from the mockup)
// Phone banner: 360px tall (was 320 in the mockup), the photo is visible 40px lower
const BANNER_H = 360;
const BANNER_FADE = 'linear-gradient(to bottom, rgba(0,0,0,0.23) 0px, rgba(0,0,0,0) 26px, rgba(0,0,0,0) 275px, rgba(0,0,0,0.045) 280px, rgba(0,0,0,0.14) 290px, rgba(0,0,0,0.26) 300px, rgba(0,0,0,0.43) 310px, rgba(0,0,0,0.63) 320px, rgba(0,0,0,0.8) 330px, rgba(0,0,0,0.913) 340px, rgba(0,0,0,0.976) 350px, #000 360px)';
const EDIT_DIM = 'rgba(0,0,0,0.53)';

// Desktop (Figma 1440 × 1024 frame): a 710px column with a rounded 198px banner.
// Everything hangs off the banner top B (237px on a 1024px-tall window), which moves
// up on shorter windows so the whole page still fits.
const B = 'clamp(80px, calc(100dvh - 787px), 237px)';
const at = (n) => `calc(${B} + ${n}px)`;
const DESK_BANNER_H = 198;
const DESK_AVATAR = 128;
// Banner fades into black over its lower 60% (sampled from the desktop mockup)
const DESK_BANNER_FADE = 'linear-gradient(to bottom, rgba(0,0,0,0) 83px, rgba(0,0,0,0.05) 93px, rgba(0,0,0,0.12) 113px, rgba(0,0,0,0.25) 133px, rgba(0,0,0,0.42) 153px, rgba(0,0,0,0.63) 173px, rgba(0,0,0,0.75) 183px, rgba(0,0,0,0.885) 193px, rgba(0,0,0,0.93) 198px)';
// Text box tops relative to B
const DK = {
  name: 278, empty: 410.5, note: 448.5, editBtn: 582, logout: 643.5,
  nameLabel: 308.5, nameInput: 338, emailLabel: 392.5, emailInput: 419.5, pwLabel: 456.5, pwInput: 490, saveBtn: 655,
};

const text = (top, size, color, weight = 700) => ({
  position: 'absolute', top, left: 0, right: 0, padding: '0 24px', textAlign: 'center',
  fontSize: size, lineHeight: `${size}px`, fontWeight: weight, color,
  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
});
const bareInput = (top, size) => ({
  ...text(top, size, '#fff', size >= 30 ? 800 : 700),
  height: size, width: '100%', border: 'none', outline: 'none', background: 'transparent',
  fontFamily: 'inherit', caretColor: '#fff',
});
const purpleBtn = (place) => ({
  position: 'absolute', ...place, left: '50%', transform: 'translateX(-50%)',
  width: 254.5, height: 46, borderRadius: 18, border: 'none', background: PURPLE, cursor: 'pointer',
  color: '#fff', fontFamily: 'inherit', fontSize: 16, fontWeight: 700,
});

const Pencil = ({ top }) => (
  <svg width="26.5" height="26.5" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round"
    style={{ position: 'absolute', top, left: '50%', transform: 'translate(-50%, -50%)', pointerEvents: 'none' }}>
    <path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" />
    <path d="m15 5 4 4" />
  </svg>
);

const PersonIcon = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={GREY} style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)' }}>
    <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
  </svg>
);

export default function ProfilePage({ user, profile, onClose, onOpenCategory, refreshKey }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(null);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [busy, setBusy] = useState(false);
  const [photoMenu, setPhotoMenu] = useState(null);   // 'avatar' | 'banner'
  const [cropper, setCropper] = useState(null);       // { kind, src, pos }
  const [confirmPw, setConfirmPw] = useState(false);
  const fileRef = useRef(null);
  const pickKind = useRef(null);

  const desktop = useIsDesktop();
  const name = displayNameOf(profile, user);
  const view = editing ? draft : {
    avatar: profile?.avatar, avatarPos: profile?.avatarPos, banner: profile?.banner, bannerPos: profile?.bannerPos,
  };

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(''), 4500);
    return () => clearTimeout(t);
  }, [toast]);

  const startEdit = () => {
    setDraft({
      name: profile?.name || user?.displayName || '',
      email: user?.email || '',
      password: '',
      avatar: profile?.avatar || null, avatarPos: profile?.avatarPos || DEFAULT_POS,
      banner: profile?.banner || null, bannerPos: profile?.bannerPos || DEFAULT_POS,
    });
    setError('');
    setEditing(true);
  };
  const goBack = () => (editing ? setEditing(false) : onClose());

  // Swipe right to go back (in edit mode: cancel editing), like on the category page
  const swipe = useRef(null);
  const onTouchStart = (e) => { swipe.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }; };
  const onTouchEnd = (e) => {
    if (!swipe.current || cropper || confirmPw || photoMenu) return;
    const dx = e.changedTouches[0].clientX - swipe.current.x;
    const dy = Math.abs(e.changedTouches[0].clientY - swipe.current.y);
    swipe.current = null;
    if (dx > 80 && dy < 60) goBack();
  };

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape' && !cropper && !confirmPw && !photoMenu) goBack(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  // ---- photos ----
  const onPhotoTap = (kind) => {
    if (!editing) return;
    if (draft[kind]) setPhotoMenu(kind);
    else pickFile(kind);
  };
  const pickFile = (kind) => { pickKind.current = kind; fileRef.current?.click(); };
  const onFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const kind = pickKind.current;
    try {
      const src = await compressImage(file, kind === 'avatar' ? { maxSide: 512, quality: 0.85 } : { maxSide: 1200, quality: 0.8 });
      setCropper({ kind, src, pos: DEFAULT_POS });
    } catch (err) {
      setError(err.message);
    }
  };
  const onCropDone = (pos) => {
    const { kind, src } = cropper;
    setDraft((d) => ({ ...d, [kind]: src, [`${kind}Pos`]: pos }));
    setCropper(null);
  };

  // ---- save ----
  const emailChanged = () => draft.email.trim().toLowerCase() !== (user.email || '').toLowerCase();

  const save = () => {
    setError('');
    if (draft.password && draft.password.length < 6) { setError('Пароль должен быть не короче 6 символов'); return; }
    if (emailChanged() && !/^\S+@\S+\.\S+$/.test(draft.email.trim())) { setError('Неверный формат email'); return; }
    if (emailChanged() || draft.password) setConfirmPw(true); // Firebase requires the current password first
    else finish([]);
  };

  const commitProfile = () => {
    const newName = draft.name.trim();
    saveProfile(user.uid, {
      name: newName || null,
      avatar: draft.avatar, avatarPos: draft.avatar ? draft.avatarPos : null,
      banner: draft.banner, bannerPos: draft.banner ? draft.bannerPos : null,
    });
    if (newName && newName !== user.displayName) updateProfile(user, { displayName: newName }).catch(() => {});
  };

  const finish = (notes) => {
    commitProfile();
    setEditing(false);
    setToast(notes.length ? notes.join(' ') : 'Сохранено');
  };

  const confirmAndSave = async (currentPassword) => {
    setBusy(true);
    try {
      await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, currentPassword));
      const notes = [];
      if (draft.password) { await updatePassword(user, draft.password); notes.push('Пароль изменён.'); }
      if (emailChanged()) {
        await verifyBeforeUpdateEmail(user, draft.email.trim());
        notes.push(`Мы отправили письмо на ${draft.email.trim()} — перейди по ссылке, и почта сменится.`);
      }
      setConfirmPw(false);
      finish(notes);
    } catch (err) {
      setBusy(false);
      throw err;
    }
    setBusy(false);
  };

  const logout = async () => {
    setBusy(true);
    await flushSync(); // don't lose an edit made right before signing out
    await signOut(auth);
  };

  // Phone: absolute coordinates of the 390 × 844 mockup. Desktop: offsets from B.
  const t = (phone, deskKey) => (desktop ? at(DK[deskKey]) : phone);

  return (
    <div className="page profile-page" style={{ position: 'absolute', inset: 0, zIndex: 30, background: '#000' }}
      onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      {desktop ? (
        <ProfileDesktop
          user={user} name={name} view={view} editing={editing} draft={draft} setDraft={setDraft}
          error={error} busy={busy} refreshKey={refreshKey}
          onPhotoTap={onPhotoTap} onBack={goBack} onEdit={startEdit} onSave={save} onLogout={logout} onOpenCategory={onOpenCategory}
        />
      ) : (
      <div style={desktop
        ? { position: 'relative', width: 710, maxWidth: 'calc(100% - 48px)', margin: '0 auto', minHeight: `max(var(--app-h), calc(${B} + 787px))` }
        : { position: 'relative', maxWidth: 430, margin: '0 auto', minHeight: `max(var(--app-h), ${FRAME_H}px)` }}>
        {/* Banner */}
        <CroppedImage
          src={view.banner}
          pos={view.bannerPos}
          onClick={() => onPhotoTap('banner')}
          style={{
            position: 'absolute', left: 0, right: 0, background: view.banner ? '#000' : '#171717', cursor: editing ? 'pointer' : 'default',
            ...(desktop
              ? { top: B, height: DESK_BANNER_H, borderRadius: '37.5px 37.5px 0 0' }
              : { top: 0, height: BANNER_H }),
          }}
        >
          {editing && <div style={{ position: 'absolute', inset: 0, background: EDIT_DIM }} />}
          <div style={{ position: 'absolute', inset: 0, background: desktop ? DESK_BANNER_FADE : BANNER_FADE, pointerEvents: 'none' }} />
          {editing && <Pencil top={desktop ? DESK_BANNER_H / 2 : 173} />}
        </CroppedImage>

        {/* Avatar — on desktop its centre sits on the banner's bottom edge */}
        <CroppedImage
          src={view.avatar}
          pos={view.avatarPos}
          onClick={() => onPhotoTap('avatar')}
          style={{
            position: 'absolute', left: '50%', transform: 'translateX(-50%)',
            borderRadius: '50%', background: '#2C2C2C', cursor: editing ? 'pointer' : 'default',
            ...(desktop
              ? { top: at(DESK_BANNER_H - DESK_AVATAR / 2), width: DESK_AVATAR, height: DESK_AVATAR }
              : { top: 237.9, width: 155, height: 155 }),
          }}
        >
          {!view.avatar && <PersonIcon size={desktop ? 59 : 72} />}
          {editing && <div style={{ position: 'absolute', inset: 0, background: EDIT_DIM }} />}
          {editing && <Pencil top={desktop ? DESK_AVATAR / 2 : 77.5} />}
        </CroppedImage>

        {/* Back — desktop only; on the phone a swipe to the right goes back */}
        {desktop && <button onClick={goBack} aria-label={editing ? 'Отменить' : 'Назад'} className="glass" style={{
          position: 'absolute', borderRadius: '50%', border: 'none',
          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 2,
          ...(desktop ? { top: at(-64), left: 0, width: 32, height: 32 } : { top: 'calc(60px + var(--top-shift))', left: 22, width: 42, height: 42 }),
        }}>
          <svg width={desktop ? 16 : 18} height={desktop ? 16 : 18} viewBox="0 0 24 24" fill="none" stroke="var(--text)" strokeWidth={desktop ? 2.8 : 2.5} strokeLinecap="round" strokeLinejoin="round">
            {editing ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M19 12H5M12 19l-7-7 7-7" />}
          </svg>
        </button>}

        {!editing && (
          <>
            <div style={text(t(402.7, 'name'), 36, '#fff', 800)}>{name}</div>
            {/* Statistics, then the buttons; on a tall list the page scrolls */}
            <div style={desktop
              ? { position: 'absolute', top: at(340), left: 0, right: 0, display: 'flex', flexDirection: 'column', minHeight: `calc(max(var(--app-h), ${B} + 787px) - ${B} - 340px)`, paddingBottom: 130 }
              : { position: 'absolute', top: 466, left: 0, right: 0, padding: '0 24px 26.2px', display: 'flex', flexDirection: 'column', minHeight: `calc(max(var(--app-h), ${FRAME_H}px) - 466px)` }}>
              <ProfileStats desktop={desktop} onOpenCategory={onOpenCategory} refreshKey={refreshKey} />
              <div style={{ marginTop: 'auto', paddingTop: 28, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14.8 }}>
                <button style={{ ...purpleBtn({}), position: 'static', transform: 'none' }} onClick={startEdit}>Редактировать профиль</button>
                <button onClick={logout} disabled={busy} style={{
                  background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: 'inherit',
                  fontSize: 16, lineHeight: '16px', fontWeight: 700, color: '#C40000',
                }}>Выйти</button>
              </div>
            </div>
          </>
        )}

        {editing && (
          <form onSubmit={(e) => { e.preventDefault(); save(); }}>
            <div style={text(t(408.1, 'nameLabel'), 14, GREY)}>Отображаемое имя</div>
            <input
              style={bareInput(t(437.7, 'nameInput'), 36)} className="profile-input" maxLength={30}
              value={draft.name} placeholder={displayNameOf(null, user)}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            />
            <div style={text(t(491.1, 'emailLabel'), 14, GREY)}>Сменить почту</div>
            <input
              style={bareInput(t(518.7, 'emailInput'), 16)} className="profile-input" type="email" inputMode="email"
              autoCapitalize="none" autoCorrect="off" autoComplete="email"
              value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })}
            />
            <div style={text(t(555.1, 'pwLabel'), 14, GREY)}>Сменить пароль</div>
            <input
              style={bareInput(t(590.1, 'pwInput'), 16)} className="profile-input profile-password" type="password" autoComplete="new-password"
              placeholder="**********" value={draft.password}
              onChange={(e) => setDraft({ ...draft, password: e.target.value })}
            />
            {error && <div style={{
              ...text(null, 13, '#FF453A', 500), whiteSpace: 'normal', lineHeight: '17px',
              ...(desktop ? { top: at(DK.saveBtn - 40) } : { top: 'auto', bottom: 101 }),
            }}>{error}</div>}
            <button type="submit" style={purpleBtn(desktop ? { top: at(DK.saveBtn) } : { bottom: 43 })}>Сохранить</button>
          </form>
        )}
      </div>
      )}

      <input ref={fileRef} type="file" accept="image/*" hidden onChange={onFile} />

      {photoMenu && (
        <PhotoMenu
          title={photoMenu === 'avatar' ? 'Аватар' : 'Баннер'}
          preview={photoMenu === 'avatar'
            ? <CroppedImage src={draft.avatar} pos={draft.avatarPos} style={{ width: 96, height: 96, borderRadius: '50%' }} />
            : <CroppedImage src={draft.banner} pos={draft.bannerPos} style={{ width: desktop ? 240 : 150, aspectRatio: desktop ? DESK_BANNER_RATIO : '390 / 360', borderRadius: 18 }} />}
          onAdjust={() => { const k = photoMenu; setPhotoMenu(null); setCropper({ kind: k, src: draft[k], pos: draft[`${k}Pos`] }); }}
          onReplace={() => { const k = photoMenu; setPhotoMenu(null); pickFile(k); }}
          onRemove={() => { const k = photoMenu; setPhotoMenu(null); setDraft((d) => ({ ...d, [k]: null, [`${k}Pos`]: DEFAULT_POS })); }}
          onClose={() => setPhotoMenu(null)}
        />
      )}

      {cropper && (
        <PhotoCropper
          src={cropper.src}
          shape={cropper.kind === 'avatar' ? 'circle' : 'banner'}
          title={cropper.kind === 'avatar' ? 'Аватар' : 'Баннер'}
          initialPos={cropper.pos}
          onDone={onCropDone}
          onCancel={() => setCropper(null)}
        />
      )}

      {confirmPw && <ConfirmPassword busy={busy} onConfirm={confirmAndSave} onClose={() => setConfirmPw(false)} />}

      {toast && (
        <div className="glass" role="status" style={{
          position: 'fixed', top: 'calc(24px + var(--top-shift))', left: '50%', transform: 'translateX(-50%)', zIndex: 600,
          width: 'min(360px, calc(100% - 32px))', borderRadius: 18, padding: '12px 16px',
          color: '#fff', fontSize: 14, fontWeight: 600, lineHeight: 1.35, textAlign: 'center',
          animation: 'apple-reveal 0.4s cubic-bezier(0.22,1,0.36,1)',
        }}>{toast}</div>
      )}
    </div>
  );
}

const sheetBtn = {
  width: '100%', height: 46, borderRadius: 18, border: 'none', cursor: 'pointer',
  fontFamily: 'inherit', fontSize: 16, fontWeight: 700, color: '#fff', background: '#2C2C2C',
};

function Sheet({ children, onClose }) {
  return (
    <>
      <div className="sheet-backdrop" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 399, animation: 'fadeIn 0.2s ease' }} onClick={onClose} />
      <div className="glass sheet-panel" style={{
        position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 430,
        borderRadius: '28px 28px 0 0', padding: '20px 22px 40px', zIndex: 400,
        animation: 'slideUp 0.35s cubic-bezier(0.34,1.26,0.64,1)', display: 'flex', flexDirection: 'column', gap: 8,
      }}>
        <div className="sheet-handle" style={{ width: 36, height: 4, borderRadius: 2, background: 'rgb(86,86,88)', margin: '0 auto 12px' }} />
        {children}
      </div>
    </>
  );
}

function ConfirmPassword({ busy, onConfirm, onClose }) {
  const [pw, setPw] = useState('');
  const [err, setErr] = useState('');
  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    try { await onConfirm(pw); } catch (error) { setErr(authErrorMessage(error)); }
  };
  return (
    <Sheet onClose={busy ? undefined : onClose}>
      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ textAlign: 'center', color: '#fff', fontSize: 20, fontWeight: 700 }}>Подтверди пароль</div>
        <div style={{ textAlign: 'center', color: '#8E8E93', fontSize: 14, fontWeight: 500, lineHeight: 1.35, marginBottom: 8 }}>
          Чтобы сменить почту или пароль, введи текущий пароль
        </div>
        <input
          className="auth-input" autoFocus type="password" autoComplete="current-password" placeholder="Текущий пароль"
          value={pw} onChange={(e) => setPw(e.target.value)}
          style={{ height: 46, borderRadius: 18, border: 'none', outline: 'none', background: '#2C2C2C', padding: '0 14px', color: '#fff', fontFamily: 'inherit', fontSize: 16, fontWeight: 700 }}
        />
        {err && <div style={{ color: '#FF453A', fontSize: 13, textAlign: 'center' }}>{err}</div>}
        <button type="submit" disabled={busy || !pw} style={{ ...sheetBtn, background: PURPLE, opacity: busy || !pw ? 0.6 : 1 }}>
          {busy ? '…' : 'Подтвердить'}
        </button>
        <button type="button" disabled={busy} style={{ ...sheetBtn, background: 'none', color: '#8E8E93' }} onClick={onClose}>Отмена</button>
      </form>
    </Sheet>
  );
}
