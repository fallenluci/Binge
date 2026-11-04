import { useEffect, useRef, useState } from 'react';
import { ratingColor } from '../store';
import { useIsDesktop } from '../lib/useIsDesktop';

const LIFE_MS = 6000;

/**
 * Right after rating a film with the drum: a small card at the bottom — "Оценка сохранена"
 * and an optional "Пара слов о фильме?" field. Untouched, it fades away after 6 s
 * (the thin bar shows the time left); while you type it stays.
 */
export default function ReviewPrompt({ film, rating, onSave, onClose }) {
  const desktop = useIsDesktop();
  const [text, setText] = useState(film.review || '');
  const [hold, setHold] = useState(false); // typing / focused — don't disappear
  const [leaving, setLeaving] = useState(false);
  const timer = useRef(null);

  const close = () => { setLeaving(true); setTimeout(onClose, 220); };
  useEffect(() => {
    if (hold) return;
    timer.current = setTimeout(close, LIFE_MS);
    return () => clearTimeout(timer.current);
  }, [hold]); // eslint-disable-line react-hooks/exhaustive-deps

  const save = (e) => {
    e?.preventDefault();
    const t = text.trim();
    if (t !== (film.review || '').trim()) onSave(t);
    close();
  };
  const rc = ratingColor(rating);

  return (
    <div style={{
      position: 'fixed', left: '50%', bottom: desktop ? 32 : 'calc(22px + env(safe-area-inset-bottom, 0px))', zIndex: 450,
      width: desktop ? 440 : 'calc(100% - 20px)', maxWidth: 440, transform: 'translateX(-50%)',
      animation: leaving ? 'none' : 'review-in 0.4s cubic-bezier(0.2,0.9,0.25,1.15)',
      opacity: leaving ? 0 : 1, translate: leaving ? '0 16px' : '0 0', transition: 'opacity 0.2s ease, translate 0.2s ease',
    }}>
      <form onSubmit={save} style={{ background: '#171717', borderRadius: 22, padding: '12px 12px 0', boxShadow: '0 16px 44px rgba(0,0,0,0.6)', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 2px' }}>
          <span className="rating-pill" style={{ fontSize: 13, minWidth: 30, height: 24, padding: '0 9px', color: rc, background: `${rc}20` }}>{rating}</span>
          <div style={{ flex: 1, minWidth: 0, color: '#fff', fontSize: 15, fontWeight: 800, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Оценка сохранена</div>
          <button type="button" aria-label="Закрыть" onClick={close} style={{ background: 'none', border: 'none', padding: 6, cursor: 'pointer', display: 'flex' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8E8E93" strokeWidth="2.6" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
          </button>
        </div>
        <div style={{ position: 'relative', marginTop: 10 }}>
          <input value={text} onChange={(e) => { setText(e.target.value); setHold(true); }} onFocus={() => setHold(true)}
            placeholder="Пара слов о фильме?" maxLength={280} enterKeyHint="done"
            style={{ width: '100%', height: 44, borderRadius: 22, border: 'none', outline: 'none', background: '#2C2C2C', color: '#fff', fontFamily: 'inherit', fontSize: 16, fontWeight: 700, padding: '0 50px 0 16px' }} />
          <button type="submit" aria-label="Сохранить отзыв" style={{ position: 'absolute', right: 4, top: 4, width: 36, height: 36, borderRadius: '50%', border: 'none', padding: 0, cursor: 'pointer', background: '#351E88', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 5 5 9-10" /></svg>
          </button>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#515151', fontSize: 11, fontWeight: 700, padding: '6px 4px 8px' }}>
          <span>Видно друзьям на твоём профиле</span>{hold && <span>{text.length}/280</span>}
        </div>
        {/* Time left before it goes away */}
        <div style={{ height: 3, margin: '0 -12px', background: '#232323' }}>
          {!hold && <div style={{ height: '100%', background: '#515151', animation: `review-timer ${LIFE_MS}ms linear forwards` }} />}
        </div>
      </form>
    </div>
  );
}
