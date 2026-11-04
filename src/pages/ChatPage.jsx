import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import CroppedImage from '../components/CroppedImage';
import FilmSheet, { fmtRuntime } from '../components/FilmSheet';
import { usePublicProfiles } from '../components/FriendsSheet';
import { addFilm, getCategories, ratingColor, updateFilm } from '../store';
import { posterUrl } from '../lib/posters';
import { useIsDesktop } from '../lib/useIsDesktop';
import { useSwipeBack } from '../lib/screen';
import { fluid } from '../lib/fluid';

// Desktop: the conversation is a centred column, so lines don't stretch across a wide monitor
const SIDE = 'max(24px, calc((100% - 920px) / 2))';
import {
  deleteMessagesForAll, editMessage, filmForChat, hideMessages, markChatRead, messageSummary, newMessage,
  pinMessage, postMessage, reactToMessage, subscribeMessages,
} from '../social';

/**
 * Chat with friends: text messages and films (a card with poster, my rating and an optional caption).
 * Phone — the list of chats, then a conversation sliding in over it (swipe right to go back);
 * desktop — the list on the left, the open conversation on the right.
 * Long press (right click on desktop) on a message: reactions on top, actions below.
 */

const CARD = '#171717';
const FIELD = '#2C2C2C';
const PURPLE = '#351E88';
const LILAC = '#B9A8FF';
const GREY = '#515151';
const QUICK = ['🔥', '❤️', '😂', '👍', '👎', '😢', '🍿'];
const ALL_EMOJI = ['🔥', '❤️', '😂', '👍', '👎', '😢', '🍿', '😍', '🤯', '😱', '🥺', '😡', '🤔', '🙏', '👏', '🎉', '💯', '😴', '🤮', '🥰', '😎', '🤩', '😭', '💔', '👀', '🤝', '🫡', '✨', '⭐', '🎬', '📺', '🍕', '🤡', '👻', '💀', '🙈', '🌚', '🥲', '😏', '🫶'];

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
const plural = (n, a, b, c) => (n % 10 === 1 && n % 100 !== 11 ? a : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 12 || n % 100 > 14) ? b : c);

const sv = (d, extra = {}) => ({ width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: '#fff', strokeWidth: 2.1, strokeLinecap: 'round', strokeLinejoin: 'round', ...extra, children: d });
const I = {
  back: <svg {...sv(<path d="M19 12H5M12 19l-7-7 7-7" />, { strokeWidth: 2.4 })} />,
  film: (s = 22, c = '#fff') => <svg {...sv(<><rect x="3" y="3" width="18" height="18" rx="3" /><path d="M7 3v18M17 3v18M3 8h4M3 16h4M17 8h4M17 16h4M3 12h18" /></>, { width: s, height: s, stroke: c, strokeWidth: 2 })} />,
  send: <svg width="19" height="19" viewBox="0 0 24 24" fill="#fff"><path d="M3.4 20.4 21 12 3.4 3.6 3.4 10l12.6 2-12.6 2z" /></svg>,
  star: <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>,
  reply: <svg {...sv(<><path d="M9 14 4 9l5-5" /><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11" /></>)} />,
  copy: <svg {...sv(<><rect x="9" y="9" width="12" height="12" rx="2" /><path d="M5 15V5a2 2 0 0 1 2-2h8" /></>)} />,
  edit: <svg {...sv(<><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" /></>)} />,
  pin: <svg {...sv(<><path d="M9 4h6l-1 6 4 4H6l4-4z" /><path d="M12 14v7" /></>)} />,
  forward: <svg {...sv(<><path d="m15 14 5-5-5-5" /><path d="M20 9H9.5a5.5 5.5 0 0 0 0 11H13" /></>)} />,
  trash: <svg {...sv(<><path d="M3 6h18" /><path d="M8 6V4h8v2" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /></>, { stroke: '#FF453A' })} />,
  select: <svg {...sv(<><circle cx="12" cy="12" r="9" /><path d="m8 12 3 3 5-6" /></>)} />,
  x: <svg {...sv(<path d="M18 6 6 18M6 6l12 12" />, { width: 16, height: 16, stroke: '#8E8E93', strokeWidth: 2.4 })} />,
  check: (c) => <svg width="15" height="11" viewBox="0 0 15 11" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="m1.5 5.8 3 3L11 2" /></svg>,
  checks: (c) => <svg width="18" height="11" viewBox="0 0 18 11" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="m1.5 5.8 3 3L11 2" /><path d="m8.5 8 .8.8L16 2" /></svg>,
  clockIc: (c) => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.4" strokeLinecap="round"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>,
  down: <svg {...sv(<path d="m6 9 6 6 6-6" />, { width: 18, height: 18, strokeWidth: 2.6 })} />,
};

const selBtn = { flex: 1, minWidth: 0, gap: 6, padding: '0 8px', fontSize: 15, whiteSpace: 'nowrap' };
const roundBtn = { width: 42, height: 42, borderRadius: '50%', border: 'none', padding: 0, cursor: 'pointer', background: CARD, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 };

function Avatar({ p, size }) {
  return <CroppedImage src={p?.avatar} pos={p?.avatarPos} style={{ width: size, height: size, borderRadius: '50%', background: '#383838', flexShrink: 0 }} />;
}

// current — the open conversation (from the address /chats/{uid}); onSelect / onLeaveChat change the address
export default function ChatPage({ me, meName, social, chats, current = null, hidden, onClose, onOpenPublic, onChanged, onSelect, onLeaveChat }) {
  const desktop = useIsDesktop();
  const [q, setQ] = useState('');
  const rootRef = useRef(null);
  const convoRef = useRef(null);
  const friendIds = social.friends.filter((f) => f.status === 'friends').map((f) => f.uid);
  const prof = usePublicProfiles([...new Set([...chats.map((c) => c.uid), ...friendIds])]);

  // Chats first (newest on top), then friends I haven't written to yet
  const rows = useMemo(() => {
    const seen = new Set(chats.map((c) => c.uid));
    return [...chats, ...friendIds.filter((u) => !seen.has(u)).map((uid) => ({ uid }))];
  }, [chats, friendIds.join(',')]); // eslint-disable-line react-hooks/exhaustive-deps
  const shown = rows.filter((r) => !q.trim() || (prof(r.uid)?.name || '').toLowerCase().includes(q.trim().toLowerCase()));

  // Leaving a conversation on the phone: it slides away to the right, the list stays under it
  const closeConvo = () => {
    const el = convoRef.current;
    if (!el || desktop) { onLeaveChat(); return; }
    el.style.transition = 'transform 0.28s cubic-bezier(0.2,0.8,0.2,1)';
    el.style.transform = `translateX(${el.offsetWidth}px)`;
    setTimeout(onLeaveChat, 260);
  };
  const closeAll = () => {
    const el = rootRef.current;
    if (!el || desktop) { onClose(); return; }
    el.style.transition = 'transform 0.28s cubic-bezier(0.2,0.8,0.2,1)';
    el.style.transform = `translateX(${el.offsetWidth}px)`;
    setTimeout(onClose, 260);
  };
  useSwipeBack(convoRef, () => onLeaveChat(), !desktop && !!current);
  useSwipeBack(rootRef, onClose, !desktop && !current);

  useEffect(() => {
    if (hidden) return;
    const onKey = (e) => e.key === 'Escape' && !document.querySelector('.sheet-panel, .chat-menu') && (current && !desktop ? closeConvo() : onClose());
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const list = (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0, height: '100%', background: desktop ? 'none' : '#000' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: desktop ? '22px 18px 12px' : 'calc(56px + var(--top-shift)) 22px 12px' }}>
        <button type="button" aria-label="Назад" className="glass" style={roundBtn} onClick={closeAll}>{I.back}</button>
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
        {shown.map((r, i) => <ChatRow key={r.uid} i={i} r={r} p={prof(r.uid)} me={me} active={desktop && current === r.uid} onClick={() => onSelect(r.uid, desktop)} />)}
      </div>
    </div>
  );

  const convo = current && (
    <Conversation key={current} me={me} meName={meName} other={current} p={prof(current)} prof={prof} desktop={desktop}
      friendIds={friendIds} entry={chats.find((c) => c.uid === current) || {}}
      onBack={desktop ? null : closeConvo} onOpenProfile={() => onOpenPublic(current)} onChanged={onChanged} />
  );

  // Under a friend's profile the chat only becomes invisible: it keeps its scroll position and
  // doesn't replay its slide-in when you come back (display: none would do both)
  const hide = hidden ? { visibility: 'hidden', pointerEvents: 'none' } : {};
  const once = (e) => { if (e.target === e.currentTarget) e.currentTarget.style.animation = 'none'; };

  if (desktop) {
    return (
      <div className="chat-page" onAnimationEnd={once} style={{ position: 'absolute', inset: 0, zIndex: 50, background: '#000', display: 'flex', ...hide, alignItems: 'center', justifyContent: 'center', animation: 'fadeIn 0.2s ease' }}>
        <div style={{ width: 'calc(100% - 80px)', maxWidth: 1760, height: 'calc(100dvh - 80px)', display: 'flex', background: '#0b0b0b', borderRadius: 32, overflow: 'hidden' }}>
          <div style={{ width: fluid(330, 400), flexShrink: 0, borderRight: '1px solid #1c1c1c', display: 'flex', flexDirection: 'column' }}>{list}</div>
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
            {convo || <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: GREY, fontSize: 16, fontWeight: 700 }}>Выбери, кому написать</div>}
          </div>
        </div>
      </div>
    );
  }
  return (
    <div ref={rootRef} className="chat-page" onAnimationEnd={once} style={{ position: 'absolute', inset: 0, zIndex: 50, height: 'var(--app-h)', ...hide, animation: 'chat-push 0.35s cubic-bezier(0.2,0.8,0.2,1)', boxShadow: '-20px 0 40px rgba(0,0,0,0.6)' }}>
      {list}
      {convo && (
        <div ref={convoRef} onAnimationEnd={once} style={{ position: 'absolute', inset: 0, background: '#000', animation: 'chat-push 0.35s cubic-bezier(0.2,0.8,0.2,1)', boxShadow: '-20px 0 40px rgba(0,0,0,0.6)' }}>{convo}</div>
      )}
    </div>
  );
}

function ChatRow({ r, p, me, active, onClick, i = 0 }) {
  const preview = r.previewFilm != null
    ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, minWidth: 0 }}>
        {r.lastFrom === me && 'Ты: '}{I.film(13, '#8E8E93')}
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.previewFilm}{r.previewRating != null && ` · ${r.previewRating}`}{r.previewText ? ` — ${r.previewText}` : ''}</span>
      </span>
    : r.previewText ? `${r.lastFrom === me ? 'Ты: ' : ''}${r.previewText}` : r.lastAt ? 'Сообщение удалено' : 'Напиши первым';
  return (
    <div onClick={onClick} className="rise-in" style={{ animationDelay: `${80 + Math.min(i, 10) * 35}ms`, background: active ? FIELD : CARD, borderRadius: 20, padding: 10, display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', transition: 'background 0.2s' }}>
      <Avatar p={p} size={48} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <div style={{ flex: 1, minWidth: 0, color: '#fff', fontSize: 16, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p?.name || '…'}</div>
          {r.lastAt && <div style={{ color: '#8E8E93', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>{when(r.lastAt)}</div>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 3 }}>
          <div style={{ flex: 1, minWidth: 0, color: '#8E8E93', fontSize: 13, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'flex' }}>{preview}</div>
          {r.unread > 0 && <div style={{ minWidth: 20, height: 20, padding: '0 6px', borderRadius: 10, background: PURPLE, color: '#fff', fontSize: 12, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, animation: 'pop-in 0.3s cubic-bezier(0.2,0.9,0.25,1.3)' }}>{r.unread}</div>}
        </div>
      </div>
    </div>
  );
}

function Conversation({ me, meName, other, p, prof, desktop, friendIds, entry, onBack, onOpenProfile, onChanged }) {
  const canWrite = friendIds.includes(other);
  const [server, setServer] = useState(null);
  const [pending, setPending] = useState([]); // my messages not confirmed yet: { ...msg, status: 'sending' | 'failed' }
  const [leaving, setLeaving] = useState(() => new Set());
  const [text, setText] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [editing, setEditing] = useState(null);
  const [picker, setPicker] = useState(false);
  const [open, setOpen] = useState(null);
  const [adding, setAdding] = useState(null);
  const [menu, setMenu] = useState(null); // { msg, rect }
  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected] = useState(() => new Set());
  const [confirmDel, setConfirmDel] = useState(null); // [msgs]
  const [forward, setForward] = useState(null); // [msgs]
  const [toast, setToast] = useState('');
  const scroller = useRef(null);
  const inputRef = useRef(null);
  const atBottom = useRef(true);
  const known = useRef(null); // ids present when the chat opened — those don't animate in
  const lastMarked = useRef(0);

  useEffect(() => subscribeMessages(me, other, setServer), [me, other]);
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(''), 2200); return () => clearTimeout(t); }, [toast]);

  const hiddenIds = entry.hidden || {};
  const msgs = useMemo(() => {
    if (!server) return null;
    const ids = new Set(server.map((m) => m.id));
    return [...server, ...pending.filter((m) => !ids.has(m.id))].filter((m) => !hiddenIds[m.id]).sort((a, b) => a.at - b.at);
  }, [server, pending, entry.hidden]); // eslint-disable-line react-hooks/exhaustive-deps
  if (server && !known.current) known.current = new Set(server.map((m) => m.id));
  // Confirmed messages leave the pending list
  useEffect(() => {
    if (!server || !pending.length) return;
    const ids = new Set(server.map((m) => m.id));
    if (pending.some((m) => ids.has(m.id))) setPending((p) => p.filter((m) => !ids.has(m.id)));
  }, [server]); // eslint-disable-line react-hooks/exhaustive-deps

  // Reading: the friend gets ✓✓ once I've seen their newest message
  useEffect(() => {
    if (!msgs) return;
    const lastIn = [...msgs].reverse().find((m) => m.from !== me);
    const at = lastIn?.at || 0;
    if ((at > lastMarked.current || entry.unread > 0) && document.visibilityState !== 'hidden') {
      lastMarked.current = Math.max(at, lastMarked.current);
      markChatRead(me, other, Date.now()).catch(() => {});
    }
  }, [msgs, entry.unread]); // eslint-disable-line react-hooks/exhaustive-deps

  // Stay at the newest message unless I scrolled up to read older ones
  useLayoutEffect(() => {
    const el = scroller.current;
    if (el && atBottom.current) el.scrollTop = el.scrollHeight;
  }, [msgs?.length, replyTo, editing]);
  const onScroll = () => { const el = scroller.current; atBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80; };

  const nameOf = (uid) => (uid === me ? (meName || 'Ты') : prof(uid)?.name || 'Друг');

  const deliver = (msg) => {
    setPending((p) => [...p.filter((m) => m.id !== msg.id), { ...msg, status: 'sending' }]);
    postMessage(me, other, msg).catch(() => setPending((p) => p.map((m) => (m.id === msg.id ? { ...m, status: 'failed' } : m))));
  };
  const send = (payload) => {
    atBottom.current = true;
    const quote = replyTo && { id: replyTo.id, from: replyTo.from, text: messageSummary(replyTo).slice(0, 120) };
    deliver(newMessage(me, { ...payload, replyTo: quote }));
    setReplyTo(null);
  };
  const submit = (e) => {
    e?.preventDefault();
    const t = text.trim();
    if (!canWrite) return;
    if (editing) {
      if (!t && !editing.film) return;
      const isLast = msgs[msgs.length - 1]?.id === editing.id;
      editMessage(me, other, editing, t, isLast).catch(() => setToast('Не сохранилось — проверь интернет'));
      if (entry.pinned?.id === editing.id) pinMessage(me, other, { ...editing, text: t }).catch(() => {});
      setEditing(null); setText('');
      return;
    }
    if (!t) return;
    setText('');
    send({ text: t });
  };

  const scrollTo = (id) => {
    const el = scroller.current?.querySelector(`[data-mid="${id}"]`);
    if (!el) { setToast('Сообщение не найдено'); return; }
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    const b = el.querySelector('.bubble');
    b?.classList.remove('msg-flash'); void b?.offsetWidth; b?.classList.add('msg-flash');
  };

  const copy = (list) => {
    const t = list.map((m) => messageSummary(m)).join('\n');
    (navigator.clipboard?.writeText(t) || Promise.reject()).then(() => setToast('Скопировано'), () => setToast('Не удалось скопировать'));
  };

  const react = (m, emoji) => {
    const mine = m.reactions?.[me];
    reactToMessage(me, other, m, mine === emoji ? null : emoji).catch(() => setToast('Не получилось — проверь интернет'));
  };

  // Delete with the "dissolve" animation first, then for real
  const removeAnimated = (list, forAll) => {
    const ids = list.map((m) => m.id);
    setLeaving((s) => new Set([...s, ...ids]));
    setTimeout(() => {
      const mine = forAll ? list.filter((m) => m.from === me && !m.status) : [];
      const hide = list.filter((m) => !mine.includes(m));
      const restAll = (server || []).filter((m) => !ids.includes(m.id));
      if (mine.length) deleteMessagesForAll(me, other, mine, restAll).catch(() => setToast('Не удалилось — проверь интернет'));
      if (hide.length) hideMessages(me, other, hide.map((m) => m.id)).catch(() => {});
      setPending((p) => p.filter((m) => !ids.includes(m.id)));
      if (entry.pinned && ids.includes(entry.pinned.id)) pinMessage(me, other, null).catch(() => {});
    }, 380);
  };

  const action = (kind, m) => {
    setMenu(null);
    if (kind === 'reply') { setEditing(null); setReplyTo(m); inputRef.current?.focus(); }
    if (kind === 'copy') copy([m]);
    if (kind === 'edit') { setReplyTo(null); setEditing(m); setText(m.text || ''); setTimeout(() => inputRef.current?.focus(), 50); }
    if (kind === 'pin') pinMessage(me, other, entry.pinned?.id === m.id ? null : m).catch(() => setToast('Не получилось — проверь интернет'));
    if (kind === 'forward') setForward([m]);
    if (kind === 'delete') setConfirmDel([m]);
    if (kind === 'select') { setSelecting(true); setSelected(new Set([m.id])); }
  };

  const toggleSel = (id) => setSelected((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const selMsgs = (msgs || []).filter((m) => selected.has(m.id));
  const endSelect = () => { setSelecting(false); setSelected(new Set()); };

  const addTo = (cat) => {
    const f = adding;
    const nf = addFilm(cat.id, f.name);
    if (nf) updateFilm(cat.id, nf.id, { poster: f.poster || null, posterChecked: !!f.poster, tmdbId: f.tmdbId || null, tmdbType: f.tmdbType || null, info: f.info || null });
    setAdding(null); setOpen(null);
    setToast(`Добавлено в «${cat.name}»`);
    onChanged?.();
  };

  const doForward = (uid) => {
    const list = forward;
    setForward(null); endSelect();
    (async () => {
      for (const m of list) {
        await postMessage(me, uid, newMessage(me, { text: m.text, film: m.film, forwardedFrom: m.forwardedFrom || nameOf(m.from) }));
      }
    })().then(() => setToast(`Переслано: ${prof(uid)?.name || 'другу'}`), () => setToast('Не переслалось — проверь интернет'));
  };

  const readAt = entry.readAt || 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, position: 'relative' }}>
      {/* Header (or the selection bar) */}
      {selecting ? (
        <div style={{ display: 'flex', alignItems: 'center', padding: desktop ? '18px 22px 14px' : 'calc(52px + var(--top-shift)) 18px 12px', borderBottom: desktop ? '1px solid #1c1c1c' : 'none', minHeight: desktop ? 73 : 0, animation: 'fadeIn 0.2s ease' }}>
          <button type="button" onClick={endSelect} style={{ background: 'none', border: 'none', color: LILAC, fontFamily: 'inherit', fontSize: 16, fontWeight: 700, cursor: 'pointer', padding: '10px 4px' }}>Отмена</button>
          <div style={{ flex: 1, textAlign: 'center', color: '#fff', fontSize: 18, fontWeight: 800 }}>Выбрано: {selected.size}</div>
          <div style={{ width: 64 }} />
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: desktop ? '18px 26px 14px' : 'calc(52px + var(--top-shift)) 18px 12px', borderBottom: desktop ? '1px solid #1c1c1c' : 'none' }}>
          {onBack && <button type="button" aria-label="Назад" className="glass" style={roundBtn} onClick={onBack}>{I.back}</button>}
          <div onClick={onOpenProfile} style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, cursor: 'pointer' }}>
            <Avatar p={p} size={desktop ? 44 : 38} />
            <div style={{ color: '#fff', fontSize: desktop ? fluid(18, 20) : 18, fontWeight: 800, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p?.name || '…'}</div>
          </div>
        </div>
      )}

      {/* Pinned message */}
      {entry.pinned && !selecting && (
        <div onClick={() => scrollTo(entry.pinned.id)} style={{ margin: desktop ? `10px ${SIDE} 0` : '0 14px', background: CARD, borderRadius: 16, padding: '8px 10px 8px 12px', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', animation: 'fadeIn 0.25s ease' }}>
          <div style={{ width: 3, alignSelf: 'stretch', borderRadius: 2, background: '#7B61FF' }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ color: LILAC, fontSize: 12, fontWeight: 800 }}>Закреплено</div>
            <div style={{ color: '#fff', fontSize: 14, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entry.pinned.text}</div>
          </div>
          <button type="button" aria-label="Открепить" onClick={(e) => { e.stopPropagation(); pinMessage(me, other, null).catch(() => {}); }} style={{ background: 'none', border: 'none', padding: 6, cursor: 'pointer', display: 'flex' }}>{I.x}</button>
        </div>
      )}

      {/* Messages */}
      <div ref={scroller} onScroll={onScroll} className="page" style={{ flex: 1, height: 'auto', minHeight: 0, padding: desktop ? `16px ${SIDE}` : '8px 14px', display: 'flex', flexDirection: 'column', gap: 4, overflowX: 'hidden' }}>
        <div style={{ flex: 1 }} />
        {msgs && msgs.length === 0 && (
          <div style={{ textAlign: 'center', color: GREY, fontSize: 15, fontWeight: 700, padding: '30px 20px', lineHeight: '20px' }}>
            Напиши что-нибудь или отправь фильм кнопкой слева
          </div>
        )}
        {(msgs || []).map((m, i) => {
          const prev = msgs[i - 1];
          const gap = prev && (prev.from !== m.from || m.at - prev.at > 10 * 60000) ? 8 : 0;
          const anim = known.current && !known.current.has(m.id) ? (m.from === me ? 'msg-out' : 'msg-in') : '';
          return (
            <MessageRow key={m.id} m={m} me={me} desktop={desktop} gap={gap} anim={anim} readAt={readAt}
              leaving={leaving.has(m.id)} selecting={selecting} selected={selected.has(m.id)} nameOf={nameOf}
              onToggle={() => toggleSel(m.id)} onOpenFilm={() => setOpen(m)} onQuote={scrollTo}
              onMenu={(rect) => setMenu({ msg: m, rect })} onHeart={() => !m.status && react(m, '❤️')}
              onReact={(e) => react(m, e)} onRetry={() => deliver(m)} />
          );
        })}
      </div>

      {/* Bottom: selection actions, or reply/edit bar + input */}
      {selecting ? (
        <div style={{ display: 'flex', gap: 8, padding: desktop ? `10px ${SIDE} 22px` : '8px 12px calc(14px + env(safe-area-inset-bottom, 0px))', animation: 'fadeIn 0.2s ease' }}>
          <button type="button" className="d-btn" style={{ ...selBtn, opacity: selected.size ? 1 : 0.5 }} onClick={() => selected.size && (copy(selMsgs), endSelect())}>{I.copy}Копировать</button>
          <button type="button" className="d-btn" style={{ ...selBtn, opacity: selected.size ? 1 : 0.5 }} onClick={() => selected.size && setForward(selMsgs)}>{I.forward}Переслать</button>
          <button type="button" className="d-btn danger" aria-label="Удалить" style={{ ...selBtn, flex: '0 0 64px', opacity: selected.size ? 1 : 0.5 }} onClick={() => selected.size && setConfirmDel(selMsgs)}>{I.trash}</button>
        </div>
      ) : canWrite ? (
        <div style={{ padding: desktop ? `6px ${SIDE} 22px` : '4px 12px calc(14px + env(safe-area-inset-bottom, 0px))' }}>
          {(replyTo || editing) && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '0 0 6px 54px', background: CARD, borderRadius: 16, padding: '7px 8px 7px 12px', animation: 'msg-in 0.3s cubic-bezier(0.2,0.9,0.25,1.1)' }}>
              <div style={{ color: LILAC, display: 'flex' }}>{editing ? I.edit : I.reply}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: LILAC, fontSize: 12, fontWeight: 800 }}>{editing ? (editing.film ? 'Изменить подпись' : 'Редактирование') : `Ответ ${nameOf(replyTo.from)}`}</div>
                <div style={{ color: '#8E8E93', fontSize: 13, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{messageSummary(editing || replyTo)}</div>
              </div>
              <button type="button" aria-label="Отменить" onClick={() => { if (editing) setText(''); setEditing(null); setReplyTo(null); }} style={{ background: 'none', border: 'none', padding: 6, cursor: 'pointer', display: 'flex' }}>{I.x}</button>
            </div>
          )}
          <form onSubmit={submit} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button type="button" aria-label="Отправить фильм" onClick={() => setPicker(true)} style={{ ...roundBtn, width: desktop ? fluid(46, 52) : 46, height: desktop ? fluid(46, 52) : 46, background: FIELD }}>{I.film()}</button>
            <div style={{ flex: 1, minWidth: 0, position: 'relative' }}>
              <input ref={inputRef} value={text} onChange={(e) => setText(e.target.value)} placeholder={editing?.film ? 'Подпись' : 'Сообщение'} enterKeyHint="send" maxLength={2000}
                onKeyDown={(e) => e.key === 'Escape' && (editing || replyTo) && (e.stopPropagation(), setEditing(null), setReplyTo(null), editing && setText(''))}
                style={{ width: '100%', height: desktop ? fluid(46, 52) : 46, borderRadius: 26, border: 'none', outline: 'none', background: FIELD, color: '#fff', fontFamily: 'inherit', fontSize: desktop ? fluid(16, 17) : 16, fontWeight: 700, padding: '0 52px 0 18px', display: 'block' }} />
              <SendBtn on={!!text.trim() || (editing?.film && editing.text)} check={!!editing} />
            </div>
          </form>
        </div>
      ) : (
        <div className="d-label" style={{ textAlign: 'center', padding: '14px 20px 26px' }}>Писать можно только друзьям</div>
      )}

      {toast && (
        <div style={{ position: 'absolute', left: '50%', bottom: 90, transform: 'translateX(-50%)', background: FIELD, color: '#fff', fontSize: 14, fontWeight: 700, padding: '10px 16px', borderRadius: 16, whiteSpace: 'nowrap', animation: 'fadeIn 0.2s ease', zIndex: 5 }}>{toast}</div>
      )}

      {menu && <MessageMenu menu={menu} me={me} desktop={desktop} pinnedId={entry.pinned?.id} canWrite={canWrite} nameOf={nameOf} readAt={readAt}
        onClose={() => setMenu(null)} onAction={action} onReact={(e) => { react(menu.msg, e); setMenu(null); }} />}
      {picker && <FilmPicker onClose={() => setPicker(false)} onSend={(f, caption) => { setPicker(false); send({ film: filmForChat(f), text: caption }); }} />}
      {open && !adding && (
        <FilmSheet key={open.id} film={open.film} readOnly onClose={() => setOpen(null)}
          onAdd={open.from === me ? undefined : () => setAdding(open.film)} />
      )}
      {adding && <CategoryChoice film={adding} onPick={addTo} onClose={() => setAdding(null)} />}
      {confirmDel && (
        <DeleteSheet msgs={confirmDel} me={me} onClose={() => setConfirmDel(null)}
          onDelete={(forAll) => { const l = confirmDel; setConfirmDel(null); endSelect(); removeAnimated(l, forAll); }} />
      )}
      {forward && <ForwardSheet friendIds={friendIds} prof={prof} onClose={() => setForward(null)} onPick={doForward} />}
    </div>
  );
}

function SendBtn({ on, check }) {
  return (
    <button type="submit" aria-label={check ? 'Сохранить' : 'Отправить'} tabIndex={on ? 0 : -1} style={{
      position: 'absolute', right: 4, top: 'calc(50% - 19px)', width: 38, height: 38, borderRadius: '50%', border: 'none', padding: 0, cursor: 'pointer',
      background: PURPLE, display: 'flex', alignItems: 'center', justifyContent: 'center',
      opacity: on ? 1 : 0, transform: on ? 'scale(1)' : 'scale(0.6)', pointerEvents: on ? 'auto' : 'none',
      transition: 'opacity 0.2s ease, transform 0.25s cubic-bezier(0.2,0.9,0.25,1.3)',
    }}>{check ? <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 5 5 9-10" /></svg> : I.send}</button>
  );
}

function Status({ m, readAt, light }) {
  if (m.status === 'failed') return <span style={{ color: '#FF453A', fontWeight: 900 }}>!</span>;
  if (m.status === 'sending') return I.clockIc(light);
  return m.at <= readAt ? I.checks(LILAC) : I.check(light);
}

function Meta({ m, me, readAt, inline }) {
  const mine = m.from === me;
  const light = mine ? 'rgba(255,255,255,0.55)' : '#8E8E93';
  return (
    <span style={{ float: inline ? 'none' : 'right', marginLeft: 10, marginTop: inline ? 0 : 6, flexShrink: 0, fontSize: 11, fontWeight: 700, color: light, display: 'inline-flex', alignItems: 'center', gap: 3, position: 'relative', top: 2 }}>
      {m.edited && 'изм. '}{clock(m.at)}{mine && <Status m={m} readAt={readAt} light={light} />}
    </span>
  );
}

const hasReactions = (m) => Object.values(m.reactions || {}).some(Boolean);
// Reactions + time on one line under the message
function Footer({ m, me, readAt, onReact }) {
  if (!hasReactions(m)) return <Meta m={m} me={me} readAt={readAt} />;
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 6, clear: 'both' }}>
      <Reactions m={m} me={me} onReact={onReact} />
      <Meta m={m} me={me} readAt={readAt} inline />
    </div>
  );
}
function Reactions({ m, me, onReact }) {
  const list = Object.entries(m.reactions || {}).filter(([, e]) => e);
  if (!list.length) return null;
  const groups = {};
  list.forEach(([uid, e]) => { (groups[e] = groups[e] || []).push(uid); });
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
      {Object.entries(groups).map(([e, uids]) => {
        const mineR = uids.includes(me);
        return (
          <button key={e} type="button" onClick={(ev) => { ev.stopPropagation(); onReact(e); }} style={{
            border: 'none', cursor: 'pointer', fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', gap: 4,
            background: mineR ? '#7B61FF' : 'rgba(0,0,0,0.3)', color: '#fff', borderRadius: 12, padding: '2px 8px 2px 6px', fontSize: 14,
            animation: 'pop-in 0.35s cubic-bezier(0.2,0.9,0.25,1.4)',
          }}>{e}{uids.length > 1 && <span style={{ fontSize: 12, fontWeight: 800 }}>{uids.length}</span>}</button>
        );
      })}
    </div>
  );
}

function Bubble({ m, me, readAt, nameOf, onOpenFilm, onQuote, onReact, desktop, menuCopy }) {
  const mine = m.from === me;
  const radius = mine ? '20px 20px 6px 20px' : '20px 20px 20px 6px';
  const sub = mine ? 'rgba(255,255,255,0.6)' : '#8E8E93';
  const head = (
    <>
      {m.forwardedFrom && <div style={{ color: mine ? LILAC : '#9F8BFF', fontSize: 12, fontWeight: 800, marginBottom: 3 }}>Переслано от {m.forwardedFrom}</div>}
      {m.replyTo && (
        <div onClick={(e) => { e.stopPropagation(); onQuote?.(m.replyTo.id); }} style={{ background: 'rgba(0,0,0,0.25)', borderLeft: `3px solid ${LILAC}`, borderRadius: 10, padding: '4px 8px', marginBottom: 6, cursor: 'pointer' }}>
          <div style={{ color: LILAC, fontSize: 12, fontWeight: 800 }}>{nameOf(m.replyTo.from)}</div>
          <div style={{ color: mine ? 'rgba(255,255,255,0.8)' : '#c8c8c8', fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.replyTo.text}</div>
        </div>
      )}
    </>
  );
  if (m.film) {
    const i = m.film.info;
    const meta = i && [i.year, i.runtime && !i.seasons ? fmtRuntime(i.runtime) : '', i.seasons ? `${i.seasons} сез.` : ''].filter(Boolean).join(' · ');
    return (
      <div className="bubble" style={{ background: mine ? PURPLE : FIELD, borderRadius: radius, padding: 7, width: desktop ? fluid(280, 320) : 250, maxWidth: '100%' }}>
        <div style={{ padding: m.replyTo || m.forwardedFrom ? '2px 4px 0' : 0 }}>{head}</div>
        <div onClick={menuCopy ? undefined : onOpenFilm} style={{ display: 'flex', gap: 11, cursor: 'pointer' }}>
          <div style={{ width: desktop ? fluid(58, 66) : 58, aspectRatio: '58 / 86', borderRadius: 12, overflow: 'hidden', flexShrink: 0, background: mine ? 'rgba(0,0,0,0.25)' : '#1f1f1f', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {m.film.poster ? <img src={posterUrl(m.film.poster, 'w185')} alt="" draggable="false" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : I.film(22, 'rgba(255,255,255,0.4)')}
          </div>
          <div style={{ minWidth: 0, flex: 1, display: 'flex', flexDirection: 'column', paddingTop: 3 }}>
            <div style={{ color: '#fff', fontSize: desktop ? fluid(15, 17) : 15, fontWeight: 800, lineHeight: 1.2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{m.film.name}</div>
            {meta && <div style={{ color: sub, fontSize: 12, fontWeight: 700, marginTop: 3 }}>{meta}</div>}
            <div style={{ flex: 1 }} />
            {m.film.rating != null && <div style={{ alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: 4, background: 'rgba(0,0,0,0.3)', borderRadius: 9, padding: '3px 8px', color: ratingColor(m.film.rating), fontSize: 13, fontWeight: 800 }}>{I.star}{m.film.rating}</div>}
          </div>
        </div>
        <div style={{ padding: '6px 5px 1px', display: 'flow-root', color: '#fff', fontSize: desktop ? fluid(15, 17) : 15, fontWeight: 600, lineHeight: 1.35, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
          {m.text}
          <Footer m={m} me={me} readAt={readAt} onReact={onReact} />
        </div>
      </div>
    );
  }
  return (
    <div className="bubble" style={{ background: mine ? PURPLE : FIELD, color: '#fff', borderRadius: radius, padding: desktop ? '10px 15px 8px' : '9px 13px 7px', display: 'flow-root', fontSize: desktop ? fluid(15, 17) : 15, fontWeight: 600, lineHeight: 1.35, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
      {head}
      {m.text}
      <Footer m={m} me={me} readAt={readAt} onReact={onReact} />
    </div>
  );
}

function MessageRow({ m, me, desktop, gap, anim, readAt, leaving, selecting, selected, nameOf, onToggle, onOpenFilm, onQuote, onMenu, onHeart, onReact, onRetry }) {
  const mine = m.from === me;
  const rowRef = useRef(null);
  const bubbleRef = useRef(null);
  const press = useRef(null);
  const swallow = useRef(false);
  const lastTap = useRef(0);

  // Deleting: the bubble dissolves while the row closes up
  useLayoutEffect(() => {
    const el = rowRef.current;
    if (!leaving || !el) return;
    el.style.maxHeight = `${el.offsetHeight}px`;
    el.style.overflow = 'visible';
    requestAnimationFrame(() => {
      el.style.transition = 'max-height 0.3s ease 0.12s, margin 0.3s ease 0.12s';
      el.style.maxHeight = '0px'; el.style.marginTop = '0px';
    });
  }, [leaving]);

  const openMenu = () => {
    if (m.status) { if (m.status === 'failed') onRetry(); return; }
    window.getSelection?.()?.removeAllRanges(); // a long press may have started selecting text
    const r = bubbleRef.current.getBoundingClientRect();
    navigator.vibrate?.(8);
    onMenu({ left: r.left, top: r.top, width: r.width, height: r.height });
  };
  const down = (e) => {
    swallow.current = false; // only the click that ends a long press is swallowed
    if (selecting || e.button > 0) return;
    const x = e.clientX, y = e.clientY;
    press.current = { x, y, t: setTimeout(() => { press.current = null; swallow.current = true; openMenu(); }, 430) };
  };
  const moveP = (e) => { if (press.current && Math.hypot(e.clientX - press.current.x, e.clientY - press.current.y) > 8) { clearTimeout(press.current.t); press.current = null; } };
  const up = () => { if (press.current) { clearTimeout(press.current.t); press.current = null; } };
  const clickCapture = (e) => {
    if (swallow.current) { swallow.current = false; e.stopPropagation(); e.preventDefault(); return; }
    if (selecting) { e.stopPropagation(); onToggle(); return; }
    if (m.status === 'failed') { e.stopPropagation(); onRetry(); return; }
    // Double tap — ❤️
    const now = Date.now();
    if (!m.film && now - lastTap.current < 300) { lastTap.current = 0; onHeart(); return; }
    lastTap.current = now;
  };

  return (
    <div ref={rowRef} data-mid={m.id} style={{ marginTop: gap, display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}
      onClickCapture={clickCapture} onPointerDown={down} onPointerMove={moveP} onPointerUp={up} onPointerCancel={up}
      onContextMenu={(e) => { if (selecting) return; e.preventDefault(); openMenu(); }}>
      {selecting && (
        <div style={{ width: 24, height: 24, borderRadius: '50%', flexShrink: 0, border: selected ? 'none' : '2px solid #515151', background: selected ? '#7B61FF' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'pop-in 0.25s ease', transition: 'background 0.15s' }}>
          {selected && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 5 5 9-10" /></svg>}
        </div>
      )}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', justifyContent: mine ? 'flex-end' : 'flex-start' }}>
        <div ref={bubbleRef} className={leaving ? 'msg-gone' : anim} style={{ maxWidth: desktop ? '62%' : '80%', minWidth: 0, opacity: m.status === 'sending' ? 0.85 : 1, transition: 'opacity 0.3s', WebkitTouchCallout: 'none', userSelect: desktop ? 'text' : 'none' }}
          onDoubleClick={(e) => { if (desktop && !m.film && !selecting) { e.preventDefault(); onHeart(); } }}>
          <Bubble m={m} me={me} readAt={readAt} nameOf={nameOf} onOpenFilm={onOpenFilm} onQuote={onQuote} onReact={onReact} desktop={desktop} />
        </div>
      </div>
    </div>
  );
}

// Long press menu: blurred backdrop, the message lifted in place, reactions above, actions below
function MessageMenu({ menu, me, pinnedId, canWrite, nameOf, readAt, desktop, onClose, onAction, onReact }) {
  const { msg: m, rect } = menu;
  const mine = m.from === me;
  const [all, setAll] = useState(false);
  const items = [
    canWrite && ['reply', 'Ответить', I.reply],
    ['copy', 'Копировать', I.copy],
    mine && canWrite && ['edit', m.film ? 'Изменить подпись' : 'Изменить', I.edit],
    canWrite && ['pin', pinnedId === m.id ? 'Открепить' : 'Закрепить', I.pin],
    ['forward', 'Переслать', I.forward],
    ['delete', 'Удалить', I.trash, true],
    'sep',
    ['select', 'Выбрать', I.select],
  ].filter(Boolean);
  const vh = window.innerHeight, vw = window.innerWidth;
  const barH = all ? 196 : 48, menuH = items.length * 44 + 4, gap = 8;
  const bubbleH = Math.min(rect.height, vh * 0.45);
  const total = barH + gap + bubbleH + gap + menuH;
  // Keep the whole group on screen: move it up/down only as much as needed
  let top = rect.top - barH - gap;
  top = Math.max(12, Math.min(top, vh - total - 12));
  const bubbleTop = top + barH + gap;
  const right = vw - rect.left - rect.width;
  const side = mine ? { right: Math.max(10, right) } : { left: Math.max(10, rect.left) };
  const mineR = m.reactions?.[me];
  // Releasing the long press fires a click right where the menu now is — only clicks
  // that started inside the open menu count
  const armed = useRef(false);
  // While the menu is open nothing on the page may get selected
  useEffect(() => {
    const clear = () => { const sel = window.getSelection?.(); if (sel && !sel.isCollapsed) sel.removeAllRanges(); };
    clear();
    document.addEventListener('selectionchange', clear);
    return () => document.removeEventListener('selectionchange', clear);
  }, []);
  const guard = (e) => { if (!armed.current) { e.stopPropagation(); e.preventDefault(); } };

  return createPortal(
    <div className="chat-menu" style={{ position: 'fixed', inset: 0, zIndex: 600 }} onContextMenu={(e) => e.preventDefault()}
      onPointerDownCapture={() => { armed.current = true; }} onClickCapture={guard}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', animation: 'fadeIn 0.25s ease' }} />
      {/* Reactions */}
      <div style={{ position: 'absolute', top, ...side, maxWidth: vw - 20, background: CARD, borderRadius: all ? 24 : 26, padding: all ? 10 : '5px 6px', animation: 'pop-in 0.35s cubic-bezier(0.2,0.9,0.25,1.25)', transformOrigin: mine ? '100% 100%' : '0 100%' }}>
        {all ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 36px)', gap: 2, maxHeight: 176, overflowY: 'auto' }}>
            {ALL_EMOJI.map((e) => <EmojiBtn key={e} e={e} on={mineR === e} onClick={() => onReact(e)} />)}
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {QUICK.map((e, i) => <EmojiBtn key={e} e={e} on={mineR === e} delay={i * 0.03} onClick={() => onReact(e)} />)}
            <button type="button" aria-label="Все реакции" onClick={() => setAll(true)} style={{ width: 36, height: 36, borderRadius: '50%', border: 'none', background: FIELD, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', marginLeft: 2 }}>{I.down}</button>
          </div>
        )}
      </div>
      {/* The message, lifted */}
      <div style={{ position: 'absolute', top: bubbleTop, ...(mine ? { right: Math.max(10, right) } : { left: Math.max(10, rect.left) }), width: rect.width, maxHeight: bubbleH, overflow: 'hidden', animation: 'lift 0.3s cubic-bezier(0.2,0.9,0.25,1.3) forwards', transformOrigin: mine ? '100% 50%' : '0 50%', pointerEvents: 'none' }}>
        <Bubble m={m} me={me} readAt={readAt} nameOf={nameOf} menuCopy desktop={desktop} onReact={() => {}} />
      </div>
      {/* Actions */}
      <div style={{ position: 'absolute', top: bubbleTop + bubbleH + gap, ...side, width: 230, background: CARD, borderRadius: 22, padding: '6px 0', animation: 'pop-in 0.32s cubic-bezier(0.2,0.9,0.25,1.2)', transformOrigin: mine ? '100% 0' : '0 0' }}>
        {items.map((it, i) => it === 'sep'
          ? <div key="sep" style={{ height: 1, background: FIELD, margin: '4px 14px' }} />
          : (
            <button key={it[0]} type="button" className="chat-menu-item" onClick={() => onAction(it[0], m)} style={{
              animationDelay: `${0.04 + i * 0.03}s`, width: '100%', height: 42, display: 'flex', alignItems: 'center', gap: 14, padding: '0 16px',
              background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 16, fontWeight: 700, color: it[3] ? '#FF453A' : '#fff', textAlign: 'left',
            }}>{it[2]}{it[1]}</button>
          ))}
      </div>
    </div>,
    document.body,
  );
}

function EmojiBtn({ e, on, delay = 0, onClick }) {
  return (
    <button type="button" onClick={onClick} style={{
      width: 36, height: 36, borderRadius: '50%', border: 'none', cursor: 'pointer', fontSize: 23, lineHeight: 1, padding: 0,
      background: on ? '#7B61FF' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
      animation: `pop-in 0.35s cubic-bezier(0.2,0.9,0.25,1.5) ${delay}s both`, transition: 'transform 0.15s',
    }}
      onPointerEnter={(ev) => (ev.currentTarget.style.transform = 'scale(1.25)')} onPointerLeave={(ev) => (ev.currentTarget.style.transform = '')}>{e}</button>
  );
}

// Bottom sheet shell in the app's style (pull down to close works for it too)
function Sheet({ title, onClose, children, footer }) {
  const stop = (e) => e.stopPropagation();
  return createPortal(
    <div onClick={stop}>
      <div className="sheet-backdrop" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 620, animation: 'fadeIn 0.2s ease' }} onClick={onClose} />
      <div className="glass sheet-panel" style={{
        position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 430,
        borderRadius: '28px 28px 0 0', padding: '14px 22px 26px', zIndex: 621, maxHeight: '86dvh', display: 'flex', flexDirection: 'column',
        animation: 'slideUp 0.35s cubic-bezier(0.34,1.26,0.64,1)',
      }}>
        <div className="sheet-handle" style={{ width: 36, height: 4, borderRadius: 2, margin: '0 auto 16px', flexShrink: 0 }} />
        {title && <div className="d-title" style={{ flexShrink: 0 }}>{title}</div>}
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
  const [caption, setCaption] = useState('');
  // My films: rated ones first (newest on top), then the rest
  const films = useMemo(() => getCategories().flatMap((c) => c.films.map((f) => ({ ...f, key: `${c.id}/${f.id}` })))
    .sort((a, b) => (b.rating != null) - (a.rating != null) || (b.ratedAt || 0) - (a.ratedAt || 0) || (b.addedAt || 0) - (a.addedAt || 0)), []);
  const shown = films.filter((f) => !q.trim() || f.name.toLowerCase().includes(q.trim().toLowerCase()));
  const go = (e) => { e?.preventDefault(); if (sel) onSend(sel, caption.trim()); };
  return (
    <Sheet title="Отправить фильм" onClose={onClose}
      footer={sel ? (
        // Like sending a photo in Telegram: an optional caption goes with the film
        <form onSubmit={go} style={{ position: 'relative', animation: 'msg-in 0.3s cubic-bezier(0.2,0.9,0.25,1.1)' }}>
          <input value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Добавить подпись…" enterKeyHint="send" maxLength={1000}
            style={{ width: '100%', height: 46, borderRadius: 23, border: 'none', outline: 'none', background: FIELD, color: '#fff', fontFamily: 'inherit', fontSize: 16, fontWeight: 700, padding: '0 52px 0 18px' }} />
          <button type="submit" aria-label="Отправить" style={{ position: 'absolute', right: 4, top: 4, width: 38, height: 38, borderRadius: '50%', border: 'none', padding: 0, cursor: 'pointer', background: PURPLE, display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'pop-in 0.3s cubic-bezier(0.2,0.9,0.25,1.4)' }}>{I.send}</button>
        </form>
      ) : <div className="d-label" style={{ textAlign: 'center', height: 46, lineHeight: '46px' }}>Выбери фильм</div>}>
      <input className="d-field" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Поиск по твоим фильмам" style={{ marginBottom: 12 }} />
      {shown.length === 0 && <div className="d-label" style={{ textAlign: 'center', padding: 20 }}>{films.length ? 'Ничего не нашлось' : 'Сначала добавь фильмы в категории'}</div>}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
        {shown.map((f) => {
          const on = sel?.key === f.key;
          return (
            <div key={f.key} onClick={() => { setSel(on ? null : f); if (!on) setCaption(f.review || ''); }} style={{ cursor: 'pointer', minWidth: 0 }}>
              <div style={{ position: 'relative', aspectRatio: '2 / 3', borderRadius: 14, overflow: 'hidden', background: FIELD, boxShadow: on ? '0 0 0 3px #7B61FF' : 'none', transform: on ? 'scale(0.95)' : 'none', transition: 'box-shadow 0.2s, transform 0.25s cubic-bezier(0.2,0.9,0.25,1.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {f.poster ? <img src={posterUrl(f.poster, 'w185')} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} /> : I.film(24, '#515151')}
                {f.rating != null && <div style={{ position: 'absolute', top: 6, right: 6, background: 'rgba(0,0,0,0.65)', color: ratingColor(f.rating), borderRadius: 8, padding: '1px 7px', fontSize: 12, fontWeight: 800 }}>{f.rating}</div>}
                {on && <div style={{ position: 'absolute', left: 6, bottom: 6, width: 24, height: 24, borderRadius: '50%', background: '#7B61FF', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'pop-in 0.3s cubic-bezier(0.2,0.9,0.25,1.5)' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 5 5 9-10" /></svg>
                </div>}
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

function DeleteSheet({ msgs, me, onClose, onDelete }) {
  const n = msgs.length;
  const anyMine = msgs.some((m) => m.from === me && !m.status);
  const allMine = msgs.every((m) => m.from === me);
  return (
    <Sheet title={n === 1 ? 'Удалить сообщение?' : `Удалить ${n} ${plural(n, 'сообщение', 'сообщения', 'сообщений')}?`} onClose={onClose}>
      {anyMine && !allMine && <div className="d-label" style={{ textAlign: 'center', marginBottom: 12, lineHeight: '18px' }}>Сообщения друга удалятся только у тебя</div>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {anyMine && <button type="button" className="d-btn danger" onClick={() => onDelete(true)}>Удалить у всех</button>}
        <button type="button" className={`d-btn${anyMine ? '' : ' danger'}`} onClick={() => onDelete(false)}>Удалить у себя</button>
        <button type="button" className="d-btn ghost" onClick={onClose}>Отмена</button>
      </div>
    </Sheet>
  );
}

function ForwardSheet({ friendIds, prof, onClose, onPick }) {
  return (
    <Sheet title="Переслать" onClose={onClose}>
      {friendIds.length === 0 && <div className="d-label" style={{ textAlign: 'center', padding: 20 }}>Пока нет друзей</div>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {friendIds.map((uid) => (
          <div key={uid} onClick={() => onPick(uid)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 8, borderRadius: 18, background: FIELD, cursor: 'pointer' }}>
            <Avatar p={prof(uid)} size={40} />
            <div style={{ color: '#fff', fontSize: 16, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{prof(uid)?.name || '…'}</div>
          </div>
        ))}
      </div>
    </Sheet>
  );
}
