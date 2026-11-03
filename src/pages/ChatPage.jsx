import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import CroppedImage from '../components/CroppedImage';
import FilmSheet, { fmtRuntime } from '../components/FilmSheet';
import { usePublicProfiles } from '../components/FriendsSheet';
import { addFilm, getCategories, ratingColor, updateFilm } from '../store';
import { posterUrl } from '../lib/posters';
import { useIsDesktop } from '../lib/useIsDesktop';
import { filmForChat, markChatRead, sendMessage, subscribeMessages } from '../social';

/**
 * Chat with friends: text messages and films (a card with poster and my rating).
 * Phone — the list of chats, then a conversation on the whole screen;
 * desktop — the list on the left, the open conversation on the right.
 */

const CARD = '#171717';
const FIELD = '#2C2C2C';
const PURPLE = '#351E88';
const GREY = '#515151';

const pad2 = (n) => String(n).padStart(2, '0');
function when(at) {
  if (!at) return '';
  const d = new Date(at), now = new Date();
  const day = (x) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diff = Math.round((day(now) - day(d)) / 86400000);
  if (diff === 0) return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
  if (diff === 1) return 'вчера';
  if (diff < 7) return ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'][d.getDay()];
  return `${pad2(d.getDate())}.${pad2(d.getMonth() + 1)}`;
}
const clock = (at) => { const d = new Date(at); return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`; };

const Icon = {
  back: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>,
  film: (s = 22, c = '#fff') => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="3" /><path d="M7 3v18M17 3v18M3 8h4M3 16h4M17 8h4M17 16h4M3 12h18" /></svg>,
  send: <svg width="19" height="19" viewBox="0 0 24 24" fill="#fff"><path d="M3.4 20.4 21 12 3.4 3.6 3.4 10l12.6 2-12.6 2z" /></svg>,
  star: <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>,
};

const roundBtn = { width: 42, height: 42, borderRadius: '50%', border: 'none', padding: 0, cursor: 'pointer', background: CARD, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 };

function Avatar({ p, size }) {
  return <CroppedImage src={p?.avatar} pos={p?.avatarPos} style={{ width: size, height: size, borderRadius: '50%', background: '#383838', flexShrink: 0 }} />;
}

export default function ChatPage({ me, social, chats, start, onClose, onOpenPublic, onChanged }) {
  const desktop = useIsDesktop();
  const [current, setCurrent] = useState(start || null);
  const [q, setQ] = useState('');
  const friendIds = social.friends.filter((f) => f.status === 'friends').map((f) => f.uid);
  const prof = usePublicProfiles([...new Set([...chats.map((c) => c.uid), ...friendIds])]);

  // Chats first (newest on top), then friends I haven't written to yet
  const rows = useMemo(() => {
    const seen = new Set(chats.map((c) => c.uid));
    return [...chats, ...friendIds.filter((u) => !seen.has(u)).map((uid) => ({ uid }))];
  }, [chats, friendIds.join(',')]); // eslint-disable-line react-hooks/exhaustive-deps
  const shown = rows.filter((r) => !q.trim() || (prof(r.uid)?.name || '').toLowerCase().includes(q.trim().toLowerCase()));

  // Phone back button / Esc: from a conversation to the list, from the list — close
  const back = () => (current && !desktop ? setCurrent(null) : onClose());
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && !document.querySelector('.sheet-panel') && back();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const list = (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0, height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: desktop ? '22px 18px 12px' : 'calc(56px + var(--top-shift)) 22px 12px' }}>
        <button type="button" aria-label="Назад" className="glass" style={roundBtn} onClick={onClose}>{Icon.back}</button>
        <div style={{ color: '#fff', fontSize: desktop ? 30 : 34, fontWeight: 800, letterSpacing: '-0.5px' }}>Чаты</div>
      </div>
      <div style={{ padding: desktop ? '0 14px 10px' : '0 18px 12px' }}>
        <input className="d-field" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Поиск" style={{ height: 42, borderRadius: 16, fontSize: 15 }} />
      </div>
      <div className="page" style={{ flex: 1, height: 'auto', padding: desktop ? '0 10px 16px' : '0 14px 40px', display: 'flex', flexDirection: 'column', gap: 6 }}>
        {rows.length === 0 && (
          <div style={{ color: '#8E8E93', fontSize: 14, fontWeight: 600, lineHeight: '19px', padding: '10px 8px' }}>
            Пока не с кем переписываться. Добавь друзей — поделись ссылкой на свой профиль, и друг нажмёт «Добавить в друзья».
          </div>
        )}
        {shown.map((r) => <ChatRow key={r.uid} r={r} p={prof(r.uid)} me={me} active={desktop && current === r.uid} onClick={() => setCurrent(r.uid)} />)}
      </div>
    </div>
  );

  const convo = current && (
    <Conversation key={current} me={me} other={current} p={prof(current)} desktop={desktop}
      canWrite={friendIds.includes(current)} unread={chats.find((c) => c.uid === current)?.unread || 0}
      onBack={desktop ? null : () => setCurrent(null)} onOpenProfile={() => onOpenPublic(current)} onChanged={onChanged} />
  );

  if (desktop) {
    return (
      <div className="chat-page" style={{ position: 'absolute', inset: 0, zIndex: 50, background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'fadeIn 0.2s ease' }}>
        <div style={{ width: 'min(1100px, calc(100% - 80px))', height: 'min(820px, calc(100dvh - 80px))', display: 'flex', background: '#0b0b0b', borderRadius: 32, overflow: 'hidden' }}>
          <div style={{ width: 330, flexShrink: 0, borderRight: '1px solid #1c1c1c', display: 'flex', flexDirection: 'column' }}>{list}</div>
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
            {convo || (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: GREY, fontSize: 16, fontWeight: 700 }}>Выбери, кому написать</div>
            )}
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="chat-page" style={{ position: 'absolute', inset: 0, zIndex: 50, background: '#000', height: 'var(--app-h)', animation: 'fadeIn 0.2s ease' }}>
      {convo || list}
    </div>
  );
}

function ChatRow({ r, p, me, active, onClick }) {
  const preview = r.previewFilm != null
    ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, minWidth: 0 }}>
        {r.lastFrom === me && 'Ты: '}{Icon.film(13, '#8E8E93')}
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.previewFilm}{r.previewRating != null && ` · ${r.previewRating}`}</span>
      </span>
    : r.previewText != null ? `${r.lastFrom === me ? 'Ты: ' : ''}${r.previewText}` : 'Напиши первым';
  return (
    <div onClick={onClick} style={{ background: active ? FIELD : CARD, borderRadius: 20, padding: 10, display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', transition: 'background 0.2s' }}>
      <Avatar p={p} size={48} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <div style={{ flex: 1, minWidth: 0, color: '#fff', fontSize: 16, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p?.name || '…'}</div>
          {r.lastAt && <div style={{ color: '#8E8E93', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>{when(r.lastAt)}</div>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 3 }}>
          <div style={{ flex: 1, minWidth: 0, color: '#8E8E93', fontSize: 13, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'flex' }}>{preview}</div>
          {r.unread > 0 && <div style={{ minWidth: 20, height: 20, padding: '0 6px', borderRadius: 10, background: PURPLE, color: '#fff', fontSize: 12, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{r.unread}</div>}
        </div>
      </div>
    </div>
  );
}

function Conversation({ me, other, p, desktop, canWrite, unread, onBack, onOpenProfile, onChanged }) {
  const [msgs, setMsgs] = useState(null);
  const [text, setText] = useState('');
  const [picker, setPicker] = useState(false);
  const [open, setOpen] = useState(null); // message whose film is shown
  const [adding, setAdding] = useState(null); // film being added to my list
  const [toast, setToast] = useState('');
  const scroller = useRef(null);
  const atBottom = useRef(true);

  useEffect(() => subscribeMessages(me, other, setMsgs), [me, other]);
  // Opening the chat (and every new message while it's open) marks it read
  useEffect(() => { if (unread > 0) markChatRead(me, other).catch(() => {}); }, [unread, me, other]);
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(''), 2200); return () => clearTimeout(t); }, [toast]);

  // Stay at the newest message unless I scrolled up to read older ones
  useLayoutEffect(() => {
    const el = scroller.current;
    if (el && atBottom.current) el.scrollTop = el.scrollHeight;
  }, [msgs]);
  const onScroll = () => { const el = scroller.current; atBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80; };

  const send = (payload) => {
    atBottom.current = true;
    sendMessage(me, other, payload).catch(() => setToast('Не отправилось — проверь интернет'));
  };
  const submit = (e) => {
    e?.preventDefault();
    const t = text.trim();
    if (!t || !canWrite) return;
    setText('');
    send({ text: t });
  };

  const addTo = (cat) => {
    const f = adding;
    const nf = addFilm(cat.id, f.name);
    if (nf) updateFilm(cat.id, nf.id, { poster: f.poster || null, posterChecked: !!f.poster, tmdbId: f.tmdbId || null, tmdbType: f.tmdbType || null, info: f.info || null });
    setAdding(null); setOpen(null);
    setToast(`Добавлено в «${cat.name}»`);
    onChanged?.();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, position: 'relative' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: desktop ? '18px 22px 14px' : 'calc(52px + var(--top-shift)) 18px 12px', borderBottom: desktop ? '1px solid #1c1c1c' : 'none' }}>
        {onBack && <button type="button" aria-label="Назад" className="glass" style={roundBtn} onClick={onBack}>{Icon.back}</button>}
        <div onClick={onOpenProfile} style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, cursor: 'pointer' }}>
          <Avatar p={p} size={desktop ? 40 : 38} />
          <div style={{ color: '#fff', fontSize: 18, fontWeight: 800, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p?.name || '…'}</div>
        </div>
      </div>

      {/* Messages */}
      <div ref={scroller} onScroll={onScroll} className="page" style={{ flex: 1, height: 'auto', minHeight: 0, padding: desktop ? '16px 24px' : '8px 14px', display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{ flex: 1 }} />
        {msgs && msgs.length === 0 && (
          <div style={{ textAlign: 'center', color: GREY, fontSize: 15, fontWeight: 700, padding: '30px 20px', lineHeight: '20px' }}>
            Напиши что-нибудь или отправь фильм кнопкой слева
          </div>
        )}
        {(msgs || []).map((m, i) => {
          const mine = m.from === me;
          const prev = msgs[i - 1];
          const gap = prev && (prev.from !== m.from || m.at - prev.at > 10 * 60000) ? 8 : 0;
          return (
            <div key={m.id} style={{ alignSelf: mine ? 'flex-end' : 'flex-start', maxWidth: desktop ? '62%' : '80%', marginTop: gap, animation: 'fadeIn 0.25s ease' }}>
              {m.film
                ? <FilmBubble film={m.film} mine={mine} at={m.at} onClick={() => setOpen(m)} />
                : (
                  <div style={{ background: mine ? PURPLE : FIELD, color: '#fff', borderRadius: mine ? '20px 20px 6px 20px' : '20px 20px 20px 6px', padding: '9px 13px 7px', display: 'flow-root', fontSize: 15, fontWeight: 600, lineHeight: '20px', whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
                    {m.text}
                    <span style={{ float: 'right', marginLeft: 10, marginTop: 6, fontSize: 11, fontWeight: 700, color: mine ? 'rgba(255,255,255,0.55)' : '#8E8E93' }}>{clock(m.at)}</span>
                  </div>
                )}
            </div>
          );
        })}
      </div>

      {/* Input: film button + long field; "send" appears inside the field once there is text */}
      {canWrite ? (
        <form onSubmit={submit} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: desktop ? '10px 22px 20px' : '8px 12px calc(14px + env(safe-area-inset-bottom, 0px))' }}>
          <button type="button" aria-label="Отправить фильм" onClick={() => setPicker(true)} style={{ ...roundBtn, width: 46, height: 46, background: FIELD }}>{Icon.film()}</button>
          <div style={{ flex: 1, minWidth: 0, position: 'relative' }}>
            <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Сообщение" enterKeyHint="send" maxLength={2000}
              style={{ width: '100%', height: 46, borderRadius: 23, border: 'none', outline: 'none', background: FIELD, color: '#fff', fontFamily: 'inherit', fontSize: 16, fontWeight: 700, padding: '0 52px 0 18px' }} />
            <button type="submit" aria-label="Отправить" tabIndex={text.trim() ? 0 : -1} style={{
              position: 'absolute', right: 4, top: 4, width: 38, height: 38, borderRadius: '50%', border: 'none', padding: 0, cursor: 'pointer',
              background: PURPLE, display: 'flex', alignItems: 'center', justifyContent: 'center',
              opacity: text.trim() ? 1 : 0, pointerEvents: text.trim() ? 'auto' : 'none', transition: 'opacity 0.2s ease',
            }}>{Icon.send}</button>
          </div>
        </form>
      ) : (
        <div className="d-label" style={{ textAlign: 'center', padding: '14px 20px 26px' }}>Писать можно только друзьям</div>
      )}

      {toast && (
        <div style={{ position: 'absolute', left: '50%', bottom: 86, transform: 'translateX(-50%)', background: FIELD, color: '#fff', fontSize: 14, fontWeight: 700, padding: '10px 16px', borderRadius: 16, whiteSpace: 'nowrap', animation: 'fadeIn 0.2s ease', zIndex: 5 }}>{toast}</div>
      )}

      {picker && <FilmPicker onClose={() => setPicker(false)} onSend={(f) => { setPicker(false); send({ film: filmForChat(f) }); }} />}
      {open && !adding && (
        <FilmSheet key={open.id} film={open.film} readOnly onClose={() => setOpen(null)}
          onAdd={open.from === me ? undefined : () => setAdding(open.film)} />
      )}
      {adding && <CategoryChoice film={adding} onPick={addTo} onClose={() => setAdding(null)} />}
    </div>
  );
}

function FilmBubble({ film, mine, at, onClick }) {
  const i = film.info;
  const meta = i && [i.year, i.runtime && !i.seasons ? fmtRuntime(i.runtime) : '', i.seasons ? `${i.seasons} сез.` : ''].filter(Boolean).join(' · ');
  return (
    <div onClick={onClick} style={{ background: mine ? PURPLE : FIELD, borderRadius: mine ? '20px 20px 6px 20px' : '20px 20px 20px 6px', padding: 7, display: 'flex', gap: 11, cursor: 'pointer', width: 250, maxWidth: '100%' }}>
      <div style={{ width: 58, height: 86, borderRadius: 12, overflow: 'hidden', flexShrink: 0, background: mine ? 'rgba(0,0,0,0.25)' : '#1f1f1f', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {film.poster ? <img src={posterUrl(film.poster, 'w185')} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : Icon.film(22, 'rgba(255,255,255,0.4)')}
      </div>
      <div style={{ minWidth: 0, flex: 1, display: 'flex', flexDirection: 'column', paddingTop: 3 }}>
        <div style={{ color: '#fff', fontSize: 15, fontWeight: 800, lineHeight: '18px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{film.name}</div>
        {meta && <div style={{ color: mine ? 'rgba(255,255,255,0.6)' : '#8E8E93', fontSize: 12, fontWeight: 700, marginTop: 3 }}>{meta}</div>}
        <div style={{ flex: 1 }} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
          {film.rating != null
            ? <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'rgba(0,0,0,0.3)', borderRadius: 9, padding: '3px 8px', color: ratingColor(film.rating), fontSize: 13, fontWeight: 800 }}>{Icon.star}{film.rating}</div>
            : <div />}
          <div style={{ fontSize: 11, fontWeight: 700, color: mine ? 'rgba(255,255,255,0.55)' : '#8E8E93' }}>{clock(at)}</div>
        </div>
      </div>
    </div>
  );
}

// Bottom sheet shell in the app's style (pull down to close works for it too)
function Sheet({ title, onClose, children, footer }) {
  const stop = (e) => e.stopPropagation();
  return createPortal(
    <div onClick={stop}>
      <div className="sheet-backdrop" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 520, animation: 'fadeIn 0.2s ease' }} onClick={onClose} />
      <div className="glass sheet-panel" style={{
        position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 430,
        borderRadius: '28px 28px 0 0', padding: '14px 22px 26px', zIndex: 521, maxHeight: '86dvh', display: 'flex', flexDirection: 'column',
        animation: 'slideUp 0.35s cubic-bezier(0.34,1.26,0.64,1)',
      }}>
        <div className="sheet-handle" style={{ width: 36, height: 4, borderRadius: 2, margin: '0 auto 16px', flexShrink: 0 }} />
        <div className="d-title" style={{ flexShrink: 0 }}>{title}</div>
        <div style={{ overflowY: 'auto', minHeight: 0, flex: 1, margin: '14px -4px 0', padding: '0 4px' }}>{children}</div>
        {footer && <div style={{ flexShrink: 0, marginTop: 12 }}>{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}

function FilmPicker({ onClose, onSend }) {
  const [q, setQ] = useState('');
  const [sel, setSel] = useState(null);
  // My films: rated ones first (best and newest on top), then the rest
  const films = useMemo(() => getCategories().flatMap((c) => c.films.map((f) => ({ ...f, key: `${c.id}/${f.id}` })))
    .sort((a, b) => (b.rating != null) - (a.rating != null) || (b.ratedAt || 0) - (a.ratedAt || 0) || (b.addedAt || 0) - (a.addedAt || 0)), []);
  const shown = films.filter((f) => !q.trim() || f.name.toLowerCase().includes(q.trim().toLowerCase()));
  return (
    <Sheet title="Отправить фильм" onClose={onClose}
      footer={<button className="d-btn primary" style={{ opacity: sel ? 1 : 0.5, transition: 'opacity 0.2s' }} onClick={() => sel && onSend(sel)}>Отправить</button>}>
      <input className="d-field" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Поиск по твоим фильмам" style={{ marginBottom: 12 }} />
      {shown.length === 0 && <div className="d-label" style={{ textAlign: 'center', padding: 20 }}>{films.length ? 'Ничего не нашлось' : 'Сначала добавь фильмы в категории'}</div>}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
        {shown.map((f) => {
          const on = sel?.key === f.key;
          return (
            <div key={f.key} onClick={() => setSel(on ? null : f)} style={{ cursor: 'pointer', minWidth: 0 }}>
              <div style={{ position: 'relative', aspectRatio: '2 / 3', borderRadius: 14, overflow: 'hidden', background: FIELD, boxShadow: on ? `0 0 0 3px #7B61FF` : 'none', transition: 'box-shadow 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {f.poster ? <img src={posterUrl(f.poster, 'w185')} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} /> : Icon.film(24, '#515151')}
                {f.rating != null && <div style={{ position: 'absolute', top: 6, right: 6, background: 'rgba(0,0,0,0.65)', color: ratingColor(f.rating), borderRadius: 8, padding: '1px 7px', fontSize: 12, fontWeight: 800 }}>{f.rating}</div>}
              </div>
              <div style={{ color: '#fff', fontSize: 12, fontWeight: 700, marginTop: 5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</div>
            </div>
          );
        })}
      </div>
    </Sheet>
  );
}

function CategoryChoice({ film, onPick, onClose }) {
  const cats = getCategories();
  return (
    <Sheet title={`Добавить «${film.name}»`} onClose={onClose}>
      {cats.length === 0 && <div className="d-label" style={{ textAlign: 'center', padding: 20 }}>Сначала создай категорию на главной</div>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {cats.map((c) => (
          <button key={c.id} type="button" className="d-btn" onClick={() => onPick(c)} style={{ justifyContent: 'flex-start', padding: '0 14px', gap: 12 }}>
            <span style={{ width: 22, height: 22, borderRadius: 7, background: c.color, flexShrink: 0 }} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</span>
            <span style={{ marginLeft: 'auto', color: '#8E8E93', fontSize: 14 }}>{c.films.length}</span>
          </button>
        ))}
      </div>
    </Sheet>
  );
}
