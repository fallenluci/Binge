import { useEffect, useState } from 'react';
import CroppedImage from '../components/CroppedImage';
import ProfileStats from '../components/ProfileStats';
import ShareSheet from '../components/ShareSheet';
import FilmSheet from '../components/FilmSheet';
import { useIsDesktop } from '../lib/useIsDesktop';
import { coverCrop } from '../lib/cover';
import { posterUrl } from '../lib/posters';
import { ratingColor } from '../store';
import {
  acceptFriend, categoryLink, getPublicCategories, getPublicCategory, profileLink, removeFriend,
  saveCategoryCopy, sendFriendRequest, subscribeFriendship, subscribePublicProfile,
} from '../social';

const GREY = '#515151';
const filmsCount = (n) => { const m10 = n % 10, m100 = n % 100; return `${n} ${m10 === 1 && m100 !== 11 ? 'фильм' : m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14) ? 'фильма' : 'фильмов'}`; };
const PURPLE = '#351E88';

const PersonIcon = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={GREY} style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)' }}>
    <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
  </svg>
);

const BackBtn = ({ onClick, label = 'Назад' }) => (
  <button onClick={onClick} aria-label={label} className="glass" style={{ width: 42, height: 42, borderRadius: '50%', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
  </button>
);
const ShareIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v13" /><path d="m7 8 5-5 5 5" /><path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7" /></svg>
);

/**
 * Someone's public profile (/u/{uid}) or one of their categories (/u/{uid}/c/{id}).
 * Works without an account; signed-in users can add the person as a friend and
 * save a category as their own copy.
 */
export default function PublicView({ uid, catId, me, onOpen, onClose, onLogin, onSaved }) {
  return catId
    ? <PublicCategory uid={uid} catId={catId} me={me} onOpen={onOpen} onClose={onClose} onLogin={onLogin} onSaved={onSaved} />
    : <PublicProfile uid={uid} me={me} onOpen={onOpen} onClose={onClose} onLogin={onLogin} />;
}

function Frame({ children }) {
  return (
    <div className="page" style={{ position: 'absolute', inset: 0, zIndex: 45, background: '#000' }}>
      {children}
    </div>
  );
}

function Loading({ text = 'Загружаю…' }) {
  return <div className="d-label" style={{ textAlign: 'center', paddingTop: '40dvh' }}>{text}</div>;
}

// ---------------- profile ----------------

function PublicProfile({ uid, me, onOpen, onClose, onLogin }) {
  const desktop = useIsDesktop();
  const [p, setP] = useState(undefined); // undefined = loading, null = not found
  const [cats, setCats] = useState([]);
  const [share, setShare] = useState(false);
  const [film, setFilm] = useState(null);

  useEffect(() => subscribePublicProfile(uid, setP), [uid]);
  useEffect(() => { getPublicCategories(uid).then(setCats).catch(() => setCats([])); }, [uid, p?.updatedAt]);

  if (p === undefined) return <Frame><Loading /></Frame>;
  if (p === null) return (
    <Frame>
      <div style={{ padding: 'calc(60px + var(--top-shift)) 22px 0' }}><BackBtn onClick={onClose} /></div>
      <div style={{ textAlign: 'center', paddingTop: '20dvh' }}>
        <div style={{ color: GREY, fontSize: 36, fontWeight: 800 }}>ПУСТО</div>
        <div className="d-label" style={{ marginTop: 8 }}>Такого профиля нет или он ещё не опубликован</div>
      </div>
    </Frame>
  );

  const stats = { ...p.stats, top: p.top || [], topFresh: p.topFresh, recent: p.recent || [], favorite: p.favorite || null };
  const openCat = (id) => onOpen(uid, id);
  const W = desktop ? 'min(1100px, calc(100% - 80px))' : '100%';

  return (
    <Frame>
      <div style={{ width: W, margin: '0 auto', paddingBottom: 140 }}>
        {/* Header: banner, avatar, name, actions */}
        <div style={{ position: 'relative', paddingTop: desktop ? 86 : 0 }}>
          <CroppedImage src={p.banner} pos={p.bannerPos} style={desktop
            ? { width: '100%', aspectRatio: '1100 / 280', maxHeight: 280, borderRadius: '37.5px 37.5px 0 0', background: p.banner ? '#000' : '#171717' }
            : { width: '100%', height: 300, background: p.banner ? '#000' : '#171717' }}>
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0) 25%, rgba(0,0,0,0) 45%, rgba(0,0,0,0.6) 80%, #000 100%)' }} />
          </CroppedImage>
          <div style={{ position: 'absolute', top: desktop ? 40 : 'calc(60px + var(--top-shift))', left: desktop ? 0 : 22 }}><BackBtn onClick={onClose} /></div>
        </div>

        <div style={desktop
          ? { display: 'flex', alignItems: 'flex-end', gap: 24, marginTop: -80, padding: '0 36px', position: 'relative' }
          : { display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: -90, position: 'relative', padding: '0 24px' }}>
          <CroppedImage src={p.avatar} pos={p.avatarPos} style={{ width: desktop ? 150 : 140, height: desktop ? 150 : 140, borderRadius: '50%', flexShrink: 0, background: '#2C2C2C', boxShadow: desktop ? '0 0 0 6px #000' : 'none' }}>
            {!p.avatar && <PersonIcon size={desktop ? 70 : 64} />}
          </CroppedImage>
          <div style={{ flex: 1, minWidth: 0, textAlign: desktop ? 'left' : 'center', paddingBottom: desktop ? 10 : 0, marginTop: desktop ? 0 : 12 }}>
            <div style={{ color: '#fff', fontSize: desktop ? 48 : 34, lineHeight: desktop ? '52px' : '38px', fontWeight: 800, letterSpacing: '-1px', overflowWrap: 'anywhere' }}>{p.name}</div>
            {p.bio && <div style={{ color: '#8E8E93', fontSize: 15, lineHeight: '20px', fontWeight: 600, marginTop: 8, maxWidth: desktop ? 520 : 'none', overflowWrap: 'anywhere', whiteSpace: 'pre-line' }}>{p.bio}</div>}
          </div>
          <div style={{ display: 'flex', gap: 8, paddingBottom: desktop ? 16 : 0, marginTop: desktop ? 0 : 16, width: desktop ? 'auto' : '100%' }}>
            <FriendButton me={me} uid={uid} onLogin={onLogin} />
            <button type="button" className="d-btn" style={{ width: 46, padding: 0, flexShrink: 0 }} aria-label="Поделиться" onClick={() => setShare(true)}><ShareIcon /></button>
          </div>
        </div>

        <div style={{ padding: desktop ? '34px 0 0' : '8px 24px 0' }}>
          <ProfileStats desktop={desktop} data={stats} onOpenCategory={openCat} onOpenFilm={setFilm} emptyText="Пока ни одного фильма" />

          {cats.length > 0 && (
            <>
              <div style={{ color: GREY, fontSize: 14, fontWeight: 700, margin: '24px 0 10px 4px' }}>Категории</div>
              <div style={{ display: 'grid', gridTemplateColumns: desktop ? 'repeat(4, 1fr)' : '1fr 1fr', gap: desktop ? 14 : 10 }}>
                {cats.map((c) => <CatTile key={c.id} c={c} desktop={desktop} onClick={() => openCat(c.id)} />)}
              </div>
            </>
          )}
        </div>
      </div>

      {share && <ShareSheet title="Профиль" url={profileLink(uid)} onClose={() => setShare(false)}
        card={{ avatar: p.avatar, avatarPos: p.avatarPos, name: p.name, caption: 'Отсканируй, чтобы открыть профиль в Dori' }} />}
      {film && (
        <FilmSheet key={film.id} film={film} readOnly categoryName={film.cat?.name}
          onOpenCategory={() => { setFilm(null); openCat(film.cat.id); }} onClose={() => setFilm(null)} />
      )}
    </Frame>
  );
}

function CatTile({ c, desktop, onClick }) {
  return (
    <div onClick={onClick} style={{
      height: desktop ? 150 : 110, borderRadius: desktop ? 26 : 22, position: 'relative', overflow: 'hidden', cursor: 'pointer', background: c.color,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '0 12px',
    }}>
      {c.image && <CroppedImage src={c.image} pos={coverCrop(c)} style={{ position: 'absolute', inset: 0 }} />}
      <div style={{ position: 'absolute', inset: 0, background: c.image ? 'rgba(0,0,0,0.4)' : 'linear-gradient(to bottom, rgba(0,0,0,0.05), rgba(0,0,0,0.25))' }} />
      <div style={{ position: 'relative', color: '#fff', fontWeight: 700, fontSize: desktop ? 24 : 18, lineHeight: 1.15, textShadow: '0 2px 12px rgba(0,0,0,0.4)' }}>{c.name}</div>
      <div style={{ position: 'relative', color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: 700, marginTop: 4 }}>{filmsCount((c.films || []).length)}</div>
    </div>
  );
}

function FriendButton({ me, uid, onLogin }) {
  const [status, setStatus] = useState(undefined);
  const [busy, setBusy] = useState(false);
  const [sure, setSure] = useState(false);
  useEffect(() => (me && me.uid !== uid ? subscribeFriendship(me.uid, uid, setStatus) : undefined), [me, uid]);

  if (!me) return <button type="button" className="d-btn primary" style={{ padding: '0 22px', whiteSpace: 'nowrap' }} onClick={onLogin}>Войти, чтобы добавить в друзья</button>;
  if (me.uid === uid) return <div className="d-btn" style={{ cursor: 'default', color: '#8E8E93' }}>Это твой профиль</div>;

  const run = (fn) => async () => { setBusy(true); try { await fn(me.uid, uid); } catch (e) { console.error(e); } setBusy(false); setSure(false); };
  const style = { opacity: busy ? 0.6 : 1, padding: '0 22px', whiteSpace: 'nowrap' };
  if (status === undefined) return <div className="d-btn" style={{ color: '#8E8E93' }}>…</div>;
  if (status === 'friends') return sure
    ? <button type="button" className="d-btn" style={{ ...style, color: '#FF453A' }} onClick={run(removeFriend)}>Удалить из друзей?</button>
    : <button type="button" className="d-btn" style={style} onClick={() => setSure(true)}>✓ В друзьях</button>;
  if (status === 'outgoing') return <button type="button" className="d-btn" style={{ ...style, color: '#8E8E93' }} onClick={run(removeFriend)}>Заявка отправлена · отменить</button>;
  if (status === 'incoming') return (
    <>
      <button type="button" className="d-btn primary" style={style} onClick={run(acceptFriend)}>Принять заявку</button>
      <button type="button" className="d-btn" style={{ ...style, width: 'auto', padding: '0 16px', flexShrink: 0, color: '#8E8E93' }} onClick={run(removeFriend)}>Отклонить</button>
    </>
  );
  return <button type="button" className="d-btn primary" style={style} onClick={run(sendFriendRequest)}>Добавить в друзья</button>;
}

// ---------------- category ----------------

function PublicCategory({ uid, catId, me, onOpen, onClose, onLogin, onSaved }) {
  const desktop = useIsDesktop();
  const [cat, setCat] = useState(undefined);
  const [owner, setOwner] = useState(null);
  const [saved, setSaved] = useState(false);
  const [share, setShare] = useState(false);
  const [film, setFilm] = useState(null);

  useEffect(() => { getPublicCategory(uid, catId).then(setCat).catch(() => setCat(null)); }, [uid, catId]);
  useEffect(() => subscribePublicProfile(uid, setOwner), [uid]);

  if (cat === undefined) return <Frame><Loading /></Frame>;
  if (cat === null) return (
    <Frame>
      <div style={{ padding: 'calc(60px + var(--top-shift)) 22px 0' }}><BackBtn onClick={onClose} /></div>
      <div style={{ textAlign: 'center', paddingTop: '20dvh' }}>
        <div style={{ color: GREY, fontSize: 36, fontWeight: 800 }}>ПУСТО</div>
        <div className="d-label" style={{ marginTop: 8 }}>Категория закрыта или удалена</div>
      </div>
    </Frame>
  );

  const films = cat.films || [];
  const save = () => { saveCategoryCopy(cat); setSaved(true); onSaved?.(); };
  const W = desktop ? 'min(816px, calc(100% - 80px))' : '100%';

  return (
    <Frame>
      <div style={{ width: W, margin: '0 auto', padding: desktop ? '40px 0 140px' : 'calc(60px + var(--top-shift)) 0 140px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: desktop ? 0 : '0 22px' }}>
          <BackBtn onClick={onClose} />
          <div style={{ flex: 1 }} />
          <button type="button" className="d-btn" style={{ width: 42, height: 42, borderRadius: '50%', padding: 0 }} aria-label="Поделиться" onClick={() => setShare(true)}><ShareIcon /></button>
        </div>

        {/* Cover */}
        <div style={{ margin: desktop ? '22px 0 0' : '20px 16px 0', height: desktop ? 200 : 150, borderRadius: desktop ? 37.5 : 28, position: 'relative', overflow: 'hidden', background: cat.color, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '0 20px' }}>
          {cat.image && <CroppedImage src={cat.image} pos={coverCrop(cat)} style={{ position: 'absolute', inset: 0 }} />}
          <div style={{ position: 'absolute', inset: 0, background: cat.image ? 'rgba(0,0,0,0.4)' : 'linear-gradient(to bottom, rgba(0,0,0,0.05), rgba(0,0,0,0.25))' }} />
          <div style={{ position: 'relative', color: '#fff', fontWeight: 700, fontSize: desktop ? 40 : 30, letterSpacing: '-0.5px', textShadow: '0 2px 12px rgba(0,0,0,0.4)' }}>{cat.name}</div>
        </div>

        <div style={{ padding: desktop ? '16px 4px 0' : '14px 22px 0', display: 'flex', alignItems: 'center', gap: 10 }}>
          {owner && (
            <div onClick={() => onOpen(uid)} style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0, cursor: 'pointer' }}>
              <CroppedImage src={owner.avatar} pos={owner.avatarPos} style={{ width: 32, height: 32, borderRadius: '50%', background: '#2C2C2C', flexShrink: 0 }} />
              <div style={{ minWidth: 0 }}>
                <div style={{ color: '#fff', fontSize: 15, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{owner.name}</div>
                <div style={{ color: GREY, fontSize: 12, fontWeight: 700 }}>{filmsCount(films.length)}</div>
              </div>
            </div>
          )}
        </div>

        {(!me || me.uid !== uid) && (
          <div style={{ padding: desktop ? '16px 0 0' : '16px 22px 0' }}>
            {!me
              ? <button type="button" className="d-btn primary" onClick={onLogin}>Войти, чтобы сохранить себе</button>
              : saved
                ? <div className="d-btn" style={{ cursor: 'default', color: '#30D158' }}>✓ Сохранено в твои категории</div>
                : <button type="button" className="d-btn primary" onClick={save}>Сохранить себе</button>}
          </div>
        )}

        <div style={{ padding: desktop ? '18px 0 0' : '18px 22px 0', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {films.length === 0 && <div className="d-label" style={{ textAlign: 'center', padding: '30px 0' }}>Пока пусто</div>}
          {films.map((f, i) => {
            const rc = f.rating != null ? ratingColor(f.rating) : null;
            return (
              <div key={f.id || i} onClick={() => setFilm(f)} style={{ display: 'flex', alignItems: 'center', gap: 12, minHeight: 64, cursor: 'pointer' }}>
                <span style={{ color: GREY, fontSize: 15, fontWeight: 800, width: 22, textAlign: 'center', flexShrink: 0 }}>{i + 1}</span>
                <div style={{ width: 36, height: 54, borderRadius: 7, background: '#1C1C1E', overflow: 'hidden', flexShrink: 0 }}>
                  {f.poster && <img src={posterUrl(f.poster, 'w92')} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />}
                </div>
                <div style={{ flex: 1, minWidth: 0, color: '#fff', fontSize: desktop ? 18 : 16, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</div>
                {rc && <span className="rating-pill" style={{ fontSize: 13, minWidth: 30, height: 24, padding: '0 9px', color: rc, background: `${rc}20`, flexShrink: 0 }}>{f.rating}</span>}
              </div>
            );
          })}
        </div>
      </div>

      {share && <ShareSheet title="Категория" url={categoryLink(uid, catId)} onClose={() => setShare(false)}
        card={{ cover: { image: cat.image, crop: coverCrop(cat), color: cat.color }, name: cat.name, caption: owner?.name ? `Категория · ${owner.name}` : 'Категория в Dori' }} />}
      {film && <FilmSheet key={film.id || film.name} film={film} readOnly onClose={() => setFilm(null)} />}
    </Frame>
  );
}
