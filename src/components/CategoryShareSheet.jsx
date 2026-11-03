import { useState } from 'react';
import ShareSheet, { LinkBlock, Switch } from './ShareSheet';
import { usePublicProfiles, Person } from './FriendsSheet';
import { categoryLink, sendCategory, setCategoryVisibility } from '../social';

/**
 * Category visibility & sharing, like a Spotify playlist:
 *   "Показывать в профиле" — public (listed on my profile)
 *   link — anyone with the link (QR / copy / send), not listed
 *   send to a friend — appears in their «Поделились с тобой»
 */
export default function CategoryShareSheet({ cat, user, social, profile, onChanged, onClose }) {
  const vis = cat.visibility || 'private';
  const [sent, setSent] = useState({});
  const friends = social.friends.filter((f) => f.status === 'friends');
  const prof = usePublicProfiles(friends.map((f) => f.uid));

  const setVis = (v) => { setCategoryVisibility(cat.id, v); onChanged(); };
  const send = async (uid) => {
    if (vis === 'private') setVis('link'); // a friend needs to be able to open it
    setSent((s) => ({ ...s, [uid]: 'sending' }));
    try { await sendCategory(user.uid, uid, cat); setSent((s) => ({ ...s, [uid]: 'sent' })); }
    catch (e) { console.error(e); setSent((s) => ({ ...s, [uid]: 'error' })); }
  };

  return (
    <ShareSheet title="Поделиться категорией" subtitle={cat.name} onClose={onClose}>
      <Switch
        on={vis === 'public'}
        onChange={(on) => setVis(on ? 'public' : 'link')}
        label="Показывать в профиле"
        hint={vis === 'public' ? 'Видна всем на твоём публичном профиле' : 'Скрыта из профиля'}
      />

      <div className="d-label" style={{ margin: '20px 0 10px 2px' }}>Ссылка</div>
      {vis === 'private' ? (
        <>
          <div style={{ color: '#8E8E93', fontSize: 14, fontWeight: 600, lineHeight: '19px', marginBottom: 12 }}>
            Сейчас категорию видишь только ты. Открой доступ — и её можно будет посмотреть и сохранить себе по ссылке или QR-коду.
          </div>
          <button type="button" className="d-btn primary" onClick={() => setVis('link')}>Открыть доступ по ссылке</button>
        </>
      ) : (
        <>
          <LinkBlock url={categoryLink(user.uid, cat.id)} title={cat.name}
            card={{ avatar: profile?.avatar, avatarPos: profile?.avatarPos, name: cat.name, caption: profile?.name ? `Категория · ${profile.name}` : 'Категория в Dori' }} />
          <button type="button" className="d-btn danger" style={{ marginTop: 8 }} onClick={() => setVis('private')}>Закрыть доступ</button>
        </>
      )}

      <div className="d-label" style={{ margin: '22px 0 4px 2px' }}>Отправить другу</div>
      {friends.length === 0
        ? <div style={{ color: '#8E8E93', fontSize: 14, fontWeight: 600, padding: '6px 2px' }}>Добавь друзей — и сможешь отправлять им категории.</div>
        : friends.map((f) => (
          <Person key={f.uid} p={prof(f.uid)}
            right={<button type="button" disabled={sent[f.uid] === 'sending' || sent[f.uid] === 'sent'} onClick={() => send(f.uid)} style={{
              height: 34, borderRadius: 14, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 14, fontWeight: 700, padding: '0 14px', flexShrink: 0,
              background: sent[f.uid] === 'sent' ? '#2C2C2C' : '#351E88', color: sent[f.uid] === 'sent' ? '#30D158' : sent[f.uid] === 'error' ? '#FF453A' : '#fff',
            }}>{sent[f.uid] === 'sent' ? '✓ Отправлено' : sent[f.uid] === 'error' ? 'Ошибка' : sent[f.uid] === 'sending' ? '…' : 'Отправить'}</button>} />
        ))}
    </ShareSheet>
  );
}
