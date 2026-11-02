import CroppedImage from '../components/CroppedImage';
import ProfileStats from '../components/ProfileStats';
import { displayNameOf } from '../profile';

// Desktop profile — "wide header" layout: banner across the column, avatar at its
// lower-left edge with the name next to it, buttons on the right, stats below.
export const DESK_BANNER_RATIO = '1100 / 280';
const W = 'min(1100px, calc(100% - 80px))';
const GREY = '#515151';
const PURPLE = '#351E88';
const EDIT_DIM = 'rgba(0,0,0,0.53)';
const FADE = 'linear-gradient(to bottom, rgba(0,0,0,0) 45%, rgba(0,0,0,0.6) 80%, #000 100%)';

const Pencil = ({ size = 26 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round"
    style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', pointerEvents: 'none' }}>
    <path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" />
    <path d="m15 5 4 4" />
  </svg>
);

const btn = { height: 46, borderRadius: 18, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 16, fontWeight: 700, color: '#fff', padding: '0 26px' };

export default function ProfileDesktop({
  user, name, view, editing, draft, setDraft, error, busy, refreshKey,
  onPhotoTap, onBack, onEdit, onSave, onLogout, onOpenCategory,
}) {
  return (
    <div style={{ width: W, margin: '0 auto', padding: '40px 0 70px' }}>
      <button onClick={onBack} aria-label={editing ? 'Отменить' : 'Назад'} className="glass" style={{
        width: 32, height: 32, borderRadius: '50%', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', marginBottom: 14,
      }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text)" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
          {editing ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M19 12H5M12 19l-7-7 7-7" />}
        </svg>
      </button>

      {/* Banner */}
      <CroppedImage
        src={view.banner}
        pos={view.bannerPos}
        onClick={() => onPhotoTap('banner')}
        style={{ width: '100%', aspectRatio: DESK_BANNER_RATIO, maxHeight: 280, borderRadius: '37.5px 37.5px 0 0', background: view.banner ? '#000' : '#171717', cursor: editing ? 'pointer' : 'default' }}
      >
        {editing && <div style={{ position: 'absolute', inset: 0, background: EDIT_DIM }} />}
        <div style={{ position: 'absolute', inset: 0, background: FADE, pointerEvents: 'none' }} />
        {editing && <Pencil />}
      </CroppedImage>

      {/* Avatar + name + actions. Buttons have their own keys: if React reused the
          "Редактировать" button as the submit button, that same click would submit. */}
      <form onSubmit={(e) => { e.preventDefault(); onSave(); }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 24, marginTop: -80, padding: '0 36px', position: 'relative' }}>
          <CroppedImage
            src={view.avatar}
            pos={view.avatarPos}
            onClick={() => onPhotoTap('avatar')}
            style={{ width: 150, height: 150, borderRadius: '50%', flexShrink: 0, background: '#2C2C2C', boxShadow: '0 0 0 6px #000', cursor: editing ? 'pointer' : 'default' }}
          >
            {!view.avatar && (
              <svg width="70" height="70" viewBox="0 0 24 24" fill={GREY} style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)' }}>
                <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
              </svg>
            )}
            {editing && <div style={{ position: 'absolute', inset: 0, background: EDIT_DIM }} />}
            {editing && <Pencil />}
          </CroppedImage>

          <div style={{ flex: 1, minWidth: 0, paddingBottom: 10 }}>
            {editing ? (
              <>
                <div style={{ color: GREY, fontSize: 14, fontWeight: 700, marginBottom: 2 }}>Отображаемое имя</div>
                <input className="profile-input" maxLength={30} value={draft.name} placeholder={displayNameOf(null, user)}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                  style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', color: '#fff', caretColor: '#fff', fontFamily: 'inherit', fontSize: 48, lineHeight: '56px', fontWeight: 800, letterSpacing: '-1px', padding: 0 }} />
              </>
            ) : (
              <>
                <div style={{ color: '#fff', fontSize: 48, lineHeight: '52px', fontWeight: 800, letterSpacing: '-1px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</div>
                <div style={{ color: GREY, fontSize: 15, fontWeight: 700, marginTop: 6 }}>{user.email}</div>
              </>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 22, paddingBottom: 16, flexShrink: 0 }}>
            {editing ? (
              <>
                <button key="cancel" type="button" onClick={onBack} style={{ ...btn, background: 'none', color: '#8E8E93', padding: 0 }}>Отмена</button>
                <button key="save" type="submit" disabled={busy} style={{ ...btn, background: PURPLE }}>Сохранить</button>
              </>
            ) : (
              <>
                <button key="logout" type="button" onClick={onLogout} disabled={busy} style={{ ...btn, background: 'none', color: '#C40000', padding: 0 }}>Выйти</button>
                <button key="edit" type="button" onClick={onEdit} style={{ ...btn, background: PURPLE }}>Редактировать профиль</button>
              </>
            )}
          </div>
        </div>

        {editing && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 40, maxWidth: 720 }}>
            <label>
              <div className="d-label" style={{ margin: '0 0 8px 4px' }}>Сменить почту</div>
              <input className="d-field" type="email" autoComplete="email" value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} />
            </label>
            <label>
              <div className="d-label" style={{ margin: '0 0 8px 4px' }}>Сменить пароль</div>
              <input className="d-field" type="password" autoComplete="new-password" placeholder="Новый пароль" value={draft.password} onChange={(e) => setDraft({ ...draft, password: e.target.value })} />
            </label>
            {error && <div style={{ gridColumn: '1 / -1', color: '#FF453A', fontSize: 14, fontWeight: 600 }}>{error}</div>}
          </div>
        )}
      </form>

      {!editing && (
        <div style={{ marginTop: 34 }}>
          <ProfileStats desktop onOpenCategory={onOpenCategory} refreshKey={refreshKey} />
        </div>
      )}
    </div>
  );
}
