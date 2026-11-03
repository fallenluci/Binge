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
import FilmSheet from '../components/FilmSheet';
import ProfileDesktop, { DESK_BANNER_RATIO } from './ProfileDesktop';
import FriendsSheet from '../components/FriendsSheet';
import ShareSheet from '../components/ShareSheet';
import { profileLink, socialEnabled } from '../social';
import { useIsDesktop } from '../lib/useIsDesktop';

// All coordinates below are taken 1:1 from the Figma mockup (390 × 844 frame).
const PURPLE = '#351E88';
const GREY = '#515151';
const FRAME_H = 844 + 110; // phone layout is 110px taller than the mockup (bigger banner)

// Banner fades into black between 235pt and 320pt (sampled from the mockup)
// Phone banner: 470px tall (320 in the mockup, then 360); everything below it sits 110px lower than in the mockup
const BANNER_H = 470;
const BANNER_FADE = 'linear-gradient(to bottom, rgba(0,0,0,0.23) 0px, rgba(0,0,0,0) 26px, rgba(0,0,0,0) 385px, rgba(0,0,0,0.045) 390px, rgba(0,0,0,0.14) 400px, rgba(0,0,0,0.26) 410px, rgba(0,0,0,0.43) 420px, rgba(0,0,0,0.63) 430px, rgba(0,0,0,0.8) 440px, rgba(0,0,0,0.913) 450px, rgba(0,0,0,0.976) 460px, #000 470px)';
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

const roundBtn = {
  position: 'relative', width: 42, height: 42, borderRadius: '50%', border: 'none', padding: 0, cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(30,30,32,0.85)',
};

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

export default function ProfilePage({ user, profile, onClose, onOpenCategory, refreshKey, social = { friends: [], inbox: [] }, onOpenPublic, onOpenChat }) {
  const [sheet, setSheet] = useState(null); // 'friends' | 'share'
  const [filmView, setFilmView] = useState(null); // film from top-5 / recent, shown read-only
  const friendsCount = social.friends.filter((f) => f.status === 'friends').length;
  const pending = social.friends.filter((f) => f.status === 'incoming').length + social.inbox.length;
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
    bio: profile?.bio,
  };

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(''), 4500);
    return () => clearTimeout(t);
  }, [toast]);

  const startEdit = () => {
    setDraft({
      name: profile?.name || user?.displayName || '',
      bio: profile?.bio || '',
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
    // Out of edit mode the screen itself follows the finger back (see Screen)
    if (!swipe.current || !editing || cropper || confirmPw || photoMenu) return;
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
      bio: (draft.bio || '').trim().slice(0, 150) || null,
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
      data-noswipe={editing ? '' : undefined} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      {desktop ? (
        <ProfileDesktop
          user={user} name={name} view={view} editing={editing} draft={draft} setDraft={setDraft}
          error={error} busy={busy} refreshKey={refreshKey}
          onPhotoTap={onPhotoTap} onBack={goBack} onEdit={startEdit} onSave={save} onLogout={logout} onOpenCategory={onOpenCategory}
          social={socialEnabled ? { friendsCount, pending } : null} onFriends={() => setSheet('friends')} onShare={() => setSheet('share')} onOpenFilm={setFilmView}
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
          {editing && <Pencil top={desktop ? DESK_BANNER_H / 2 : 228} />}
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
              : { top: 237.9 + 110, width: 155, height: 155 }),
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

        {/* Friends & share — small round buttons in the banner's corner (phone) */}
        {!editing && socialEnabled && (
          <div style={{ position: 'absolute', top: 'calc(60px + var(--top-shift))', right: 22, display: 'flex', gap: 10, zIndex: 2 }}>
            <button type="button" aria-label="Друзья" onClick={() => setSheet('friends')} className="glass" style={roundBtn}>
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
              {pending > 0 && <span style={{ position: 'absolute', top: -3, right: -3, minWidth: 18, height: 18, padding: '0 5px', borderRadius: 9, background: '#FF3B30', color: '#fff', fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{pending}</span>}
            </button>
            <button type="button" aria-label="Поделиться профилем" onClick={() => setSheet('share')} className="glass" style={roundBtn}>
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v13" /><path d="m7 8 5-5 5 5" /><path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7" /></svg>
            </button>
          </div>
        )}

        {!editing && (
          <>
            {/* Name with a small pencil next to it — opens editing */}
            <div style={{ position: 'absolute', top: 402.7 + 110, left: 0, right: 0, padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
              <span style={{ fontSize: 36, lineHeight: '36px', fontWeight: 800, color: '#fff', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
              <button type="button" aria-label="Редактировать профиль" onClick={startEdit} style={{ width: 34, height: 34, borderRadius: '50%', border: 'none', background: '#1C1C1E', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0 }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round"><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" /><path d="m15 5 4 4" /></svg>
              </button>
            </div>
            {/* Statistics, then the buttons; on a tall list the page scrolls */}
            <div style={desktop
              ? { position: 'absolute', top: at(340), left: 0, right: 0, display: 'flex', flexDirection: 'column', minHeight: `calc(max(var(--app-h), ${B} + 787px) - ${B} - 340px)`, paddingBottom: 130 }
              : { position: 'absolute', top: 466 + 110, left: 0, right: 0, padding: '0 24px 26.2px', display: 'flex', flexDirection: 'column', minHeight: `calc(max(var(--app-h), ${FRAME_H}px) - 576px)` }}>
              {profile?.bio && (
                <div style={{ color: '#8E8E93', fontSize: 15, lineHeight: '20px', fontWeight: 600, textAlign: 'center', margin: '-6px 4px 16px', overflowWrap: 'anywhere', whiteSpace: 'pre-line' }}>{profile.bio}</div>
              )}
              <ProfileStats desktop={desktop} onOpenCategory={onOpenCategory} onOpenFilm={setFilmView} refreshKey={refreshKey} />
              <div style={{ marginTop: 'auto', paddingTop: 28, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14.8 }}>
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
            <div style={text(t(408.1 + 110, 'nameLabel'), 14, GREY)}>Отображаемое имя</div>
            <input
              style={bareInput(t(437.7 + 110, 'nameInput'), 36)} className="profile-input" maxLength={30}
              value={draft.name} placeholder={displayNameOf(null, user)}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            />
            <div style={text(t(491.1 + 110, 'emailLabel'), 14, GREY)}>Сменить почту</div>
            <input
              style={bareInput(t(518.7 + 110, 'emailInput'), 16)} className="profile-input" type="email" inputMode="email"
              autoCapitalize="none" autoCorrect="off" autoComplete="email"
              value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })}
            />
            <div style={text(t(555.1 + 110, 'pwLabel'), 14, GREY)}>Сменить пароль</div>
            <input
              style={bareInput(t(590.1 + 110, 'pwInput'), 16)} className="profile-input profile-password" type="password" autoComplete="new-password"
              placeholder="**********" value={draft.password}
              onChange={(e) => setDraft({ ...draft, password: e.target.value })}
            />
            <div style={text(633.1 + 110, 14, GREY)}>О себе</div>
            <textarea
              className="profile-input" maxLength={150} rows={3} placeholder="Пара слов о тебе и твоём кино"
              value={draft.bio} onChange={(e) => setDraft({ ...draft, bio: e.target.value.replace(/\n{2,}/g, '\n') })}
              style={{
                position: 'absolute', top: 655 + 110, left: 24, right: 24, height: 82, resize: 'none', border: 'none', outline: 'none', background: '#171717',
                borderRadius: 16, padding: '9px 12px', color: '#fff', caretColor: '#fff', fontFamily: 'inherit', fontSize: 15, lineHeight: '20px', fontWeight: 600, textAlign: 'center',
              }}
            />
            <div style={{ ...text(635 + 110, 11, GREY), textAlign: 'right', padding: '0 30px' }}>{(draft.bio || '').length}/150</div>
            {error && <div style={{
              ...text(null, 13, '#FF453A', 500), whiteSpace: 'normal', lineHeight: '17px',
              ...(desktop ? { top: at(DK.saveBtn - 40) } : { top: 'auto', bottom: 10 }),
            }}>{error}</div>}
            <button type="submit" style={purpleBtn(desktop ? { top: at(DK.saveBtn) } : { bottom: 43 })}>Сохранить</button>
          </form>
        )}
      </div>
      )}

      <input ref={fileRef} type="file" accept="image/*" hidden onChange={onFile} />

      {filmView && (
        <FilmSheet key={filmView.id} film={filmView} categoryId={filmView.cat.id} readOnly
          categoryName={filmView.cat.name}
          onOpenCategory={() => { setFilmView(null); onOpenCategory?.(filmView.cat.id); }}
          onClose={() => setFilmView(null)} />
      )}
      {sheet === 'friends' && <FriendsSheet me={user.uid} social={social} onOpenPublic={onOpenPublic} onOpenChat={onOpenChat} onClose={() => setSheet(null)} />}
      {sheet === 'share' && (
        <ShareSheet title="Мой профиль" url={profileLink(user.uid)} onClose={() => setSheet(null)}
          card={{ avatar: profile?.avatar, avatarPos: profile?.avatarPos, name, caption: 'Отсканируй, чтобы открыть профиль в Dori' }}
          subtitle="По ссылке видно имя, фото, статистику и категории, которые ты сделал публичными" />
      )}

      {photoMenu && (
        <PhotoMenu
          title={photoMenu === 'avatar' ? 'Аватар' : 'Баннер'}
          preview={photoMenu === 'avatar'
            ? <CroppedImage src={draft.avatar} pos={draft.avatarPos} style={{ width: 96, height: 96, borderRadius: '50%' }} />
            : <CroppedImage src={draft.banner} pos={draft.bannerPos} style={{ width: desktop ? 240 : 150, aspectRatio: desktop ? DESK_BANNER_RATIO : '390 / 470', borderRadius: 18 }} />}
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
