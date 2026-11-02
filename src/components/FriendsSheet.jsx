import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import CroppedImage from './CroppedImage';
import { acceptFriend, dismissInbox, getPublicProfile, removeFriend } from '../social';

// Names and avatars of other people come from their public profiles (cached for the session)
const cache = new Map();
export function usePublicProfiles(uids) {
  const [, force] = useState(0);
  const key = uids.join(',');
  useEffect(() => {
    let alive = true;
    uids.filter((u) => !cache.has(u)).forEach((u) => {
      cache.set(u, null);
      getPublicProfile(u).then((p) => { cache.set(u, p || { name: 'Пользователь' }); if (alive) force((n) => n + 1); })
        .catch(() => cache.set(u, { name: 'Пользователь' }));
    });
    return () => { alive = false; };
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps
  return (uid) => cache.get(uid) || null;
}

export function Person({ p, size = 44, sub, onClick, right }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, minHeight: 58 }}>
      <div onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0, cursor: onClick ? 'pointer' : 'default' }}>
        <CroppedImage src={p?.avatar} pos={p?.avatarPos} style={{ width: size, height: size, borderRadius: '50%', background: '#2C2C2C', flexShrink: 0 }} />
        <div style={{ minWidth: 0 }}>
          <div style={{ color: '#fff', fontSize: 16, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p?.name || '…'}</div>
          {sub && <div style={{ color: '#515151', fontSize: 13, fontWeight: 700, marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sub}</div>}
        </div>
      </div>
      {right}
    </div>
  );
}

const small = { height: 34, borderRadius: 14, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 14, fontWeight: 700, color: '#fff', padding: '0 14px', flexShrink: 0 };

/** My friends: requests, friends, sent requests and categories friends sent me. */
export default function FriendsSheet({ me, social, onOpenPublic, onClose }) {
  const { friends, inbox } = social;
  const incoming = friends.filter((f) => f.status === 'incoming');
  const mutual = friends.filter((f) => f.status === 'friends');
  const outgoing = friends.filter((f) => f.status === 'outgoing');
  const prof = usePublicProfiles([...friends.map((f) => f.uid), ...inbox.map((i) => i.from)]);
  const open = (uid, cat) => { onClose(); onOpenPublic(uid, cat); };
  const label = (t) => <div className="d-label" style={{ margin: '18px 0 4px 2px' }}>{t}</div>;
  const stop = (e) => e.stopPropagation();

  return createPortal(
    <div onTouchStart={stop} onTouchMove={stop} onTouchEnd={stop} onClick={stop}>
      <div className="sheet-backdrop" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 520, animation: 'fadeIn 0.2s ease' }} onClick={onClose} />
      <div className="glass sheet-panel" style={{
        position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 430,
        borderRadius: '28px 28px 0 0', padding: '14px 22px 30px', zIndex: 521, maxHeight: '88dvh', overflowY: 'auto',
        animation: 'slideUp 0.35s cubic-bezier(0.34,1.26,0.64,1)',
      }}>
        <div className="sheet-handle" style={{ width: 36, height: 4, borderRadius: 2, margin: '0 auto 18px' }} />
        <div className="d-title">Друзья</div>

        {inbox.length > 0 && (
          <>
            {label('Поделились с тобой')}
            {inbox.map((it) => (
              <Person key={it.id} p={{ ...prof(it.from), avatar: prof(it.from)?.avatar }} sub={`прислал(а) «${it.name}»`} onClick={() => open(it.from, it.catId)}
                right={<>
                  <button style={{ ...small, background: '#351E88' }} onClick={() => open(it.from, it.catId)}>Открыть</button>
                  <button aria-label="Скрыть" style={{ ...small, background: 'none', color: '#8E8E93', padding: '0 6px' }} onClick={() => dismissInbox(me, it.id)}>✕</button>
                </>} />
            ))}
          </>
        )}

        {incoming.length > 0 && (
          <>
            {label('Заявки в друзья')}
            {incoming.map((f) => (
              <Person key={f.uid} p={prof(f.uid)} onClick={() => open(f.uid)}
                right={<>
                  <button style={{ ...small, background: '#351E88' }} onClick={() => acceptFriend(me, f.uid)}>Принять</button>
                  <button style={{ ...small, background: '#2C2C2C', color: '#8E8E93' }} onClick={() => removeFriend(me, f.uid)}>Нет</button>
                </>} />
            ))}
          </>
        )}

        {label(`Друзья · ${mutual.length}`)}
        {mutual.length === 0
          ? <div style={{ color: '#8E8E93', fontSize: 14, fontWeight: 600, lineHeight: '19px', padding: '6px 2px 4px' }}>Пока никого. Поделись ссылкой на свой профиль или QR-кодом — друг откроет его и нажмёт «Добавить в друзья».</div>
          : mutual.map((f) => <Person key={f.uid} p={prof(f.uid)} onClick={() => open(f.uid)} />)}

        {outgoing.length > 0 && (
          <>
            {label('Отправленные заявки')}
            {outgoing.map((f) => (
              <Person key={f.uid} p={prof(f.uid)} sub="ждёт ответа" onClick={() => open(f.uid)}
                right={<button style={{ ...small, background: '#2C2C2C', color: '#8E8E93' }} onClick={() => removeFriend(me, f.uid)}>Отменить</button>} />
            ))}
          </>
        )}

        <button type="button" className="d-btn ghost" style={{ marginTop: 14 }} onClick={onClose}>Закрыть</button>
      </div>
    </div>,
    document.body,
  );
}
