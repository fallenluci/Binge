import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useIsDesktop } from './useIsDesktop';

/**
 * Screen transitions for full-screen pages (category, profile, someone's profile).
 * Phone: the page pushes in from the right and slides back out; drag it to the right to go back.
 * Desktop: a soft fade with a slight zoom.
 * The page stays mounted while it animates out (with the last content it had).
 */

// Is the touch inside something that scrolls sideways (a row of posters)? Then don't take it as "back".
function inHorizontalScroller(target, root) {
  for (let el = target; el && el !== root; el = el.parentElement) {
    if (el.scrollWidth > el.clientWidth + 2) {
      const ox = getComputedStyle(el).overflowX;
      if (ox === 'auto' || ox === 'scroll') return true;
    }
  }
  return false;
}

/** Drag an element to the right to go back (phone). Moves the element directly, no re-renders. */
export function useSwipeBack(ref, onBack, enabled) {
  const cb = useRef(onBack);
  cb.current = onBack;
  useEffect(() => {
    const el = ref.current;
    if (!el || !enabled) return;
    let s = null;
    const start = (e) => {
      s = null;
      if (e.touches.length !== 1) return;
      const t = e.target;
      if (t.closest?.('input, textarea, [data-noswipe], .chat-menu') || inHorizontalScroller(t, el)) return;
      s = { x: e.touches[0].clientX, y: e.touches[0].clientY, t: e.timeStamp, dx: 0, v: 0, mode: null };
    };
    const move = (e) => {
      if (!s) return;
      const dx = e.touches[0].clientX - s.x, dy = e.touches[0].clientY - s.y;
      if (!s.mode) {
        if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return;
        s.mode = dx > 0 && dx > Math.abs(dy) * 1.2 ? 'drag' : 'skip';
        if (s.mode === 'drag') { el.style.transition = 'none'; el.style.animation = 'none'; }
      }
      if (s.mode !== 'drag') return;
      e.preventDefault();
      const d = Math.max(0, dx);
      s.v = (d - s.dx) / Math.max(1, e.timeStamp - s.t); s.t = e.timeStamp; s.dx = d;
      el.style.transform = `translateX(${d}px)`;
    };
    const end = () => {
      if (!s || s.mode !== 'drag') { s = null; return; }
      const { dx, v } = s; s = null;
      const w = el.offsetWidth;
      if (dx > w * 0.33 || v > 0.5) {
        el.style.transition = 'transform 0.25s cubic-bezier(0.2,0.8,0.2,1)';
        el.style.transform = `translateX(${w}px)`;
        el.dataset.swiped = '1';
        setTimeout(() => cb.current(), 230);
      } else {
        el.style.transition = 'transform 0.3s cubic-bezier(0.2,0.8,0.2,1)';
        el.style.transform = 'translateX(0)';
      }
    };
    el.addEventListener('touchstart', start, { passive: true });
    el.addEventListener('touchmove', move, { passive: false });
    el.addEventListener('touchend', end, { passive: true });
    el.addEventListener('touchcancel', end, { passive: true });
    return () => {
      el.removeEventListener('touchstart', start); el.removeEventListener('touchmove', move);
      el.removeEventListener('touchend', end); el.removeEventListener('touchcancel', end);
    };
  }, [ref, enabled]);
}

const OUT_MS = 300;

export function Screen({ show, onBack, z = 20, contentKey, background, children }) {
  const desktop = useIsDesktop();
  const ref = useRef(null);
  const last = useRef(children);
  if (show) last.current = children;
  const [phase, setPhase] = useState(show ? 'in' : 'gone'); // in | out | gone

  useLayoutEffect(() => {
    const el = ref.current;
    if (show) {
      if (phase !== 'in') setPhase('in');
      if (el) { el.style.transition = ''; el.style.transform = ''; delete el.dataset.swiped; }
      return;
    }
    if (phase !== 'in') return;
    // Already dragged off-screen — nothing more to animate
    if (!el || el.dataset.swiped) { setPhase('gone'); return; }
    setPhase('out');
    const t = setTimeout(() => setPhase('gone'), OUT_MS);
    return () => clearTimeout(t);
  }, [show]); // eslint-disable-line react-hooks/exhaustive-deps

  // Same screen, new content (someone's profile → one of their categories): a soft swap
  const prevKey = useRef(contentKey);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || prevKey.current === contentKey) return;
    prevKey.current = contentKey;
    el.style.transition = 'none'; el.style.transform = '';
    delete el.dataset.swiped;
    // The content fades in over the screen's own (black) background, not over the page below
    const c = el.firstElementChild;
    if (!c) return;
    c.style.animation = 'none'; void c.offsetWidth;
    c.style.animation = 'screen-swap 0.32s cubic-bezier(0.2,0.8,0.2,1)';
  }, [contentKey]);

  useSwipeBack(ref, () => onBack?.(), !desktop && show && !!onBack);

  if (phase === 'gone' && !show) return null;
  const anim = phase === 'out'
    ? (desktop ? 'screen-fade-out 0.2s ease forwards' : `screen-pop ${OUT_MS}ms cubic-bezier(0.4,0,0.2,1) forwards`)
    : (desktop ? 'screen-fade-in 0.28s cubic-bezier(0.2,0.8,0.2,1)' : 'screen-push 0.38s cubic-bezier(0.2,0.8,0.2,1)');
  return (
    <div ref={ref} className="screen"
      onAnimationEnd={(e) => { if (e.target === e.currentTarget && phase === 'in') e.currentTarget.style.animation = 'none'; }}
      style={{
        position: 'absolute', inset: 0, zIndex: z, animation: anim, background,
        pointerEvents: phase === 'out' ? 'none' : 'auto',
        boxShadow: desktop ? 'none' : '-24px 0 48px rgba(0,0,0,0.55)',
      }}>
      {show ? children : last.current}
    </div>
  );
}
