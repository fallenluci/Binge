import { useLayoutEffect, useRef, useState } from 'react';

/**
 * Desktop "back" button — the same everywhere (my profile, a friend's profile, categories).
 * Sits beside the content column at the level of the banner / cover and sticks 24px from the
 * top while the page scrolls, so you can leave from anywhere without scrolling back up.
 * Put it right before the banner, as a child of the full-height content column.
 * If the window is too narrow for room beside the column, it moves inside, into the corner.
 */
export default function DeskBack({ onClick, label = 'Назад', close = false }) {
  const ref = useRef(null);
  const [inside, setInside] = useState(false);
  useLayoutEffect(() => {
    const check = () => { const p = ref.current?.parentElement; if (p) setInside(p.getBoundingClientRect().left < 72); };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  return (
    <div ref={ref} style={{ position: 'sticky', top: 24, height: 0, zIndex: 40, flexShrink: 0 }}>
      <button type="button" onClick={onClick} aria-label={label} title={label} className="glass desk-back" style={{
        position: 'absolute', top: inside ? 16 : 0, left: inside ? 16 : -66, width: 42, height: 42, borderRadius: '50%', border: 'none', padding: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
      }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          {close ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M19 12H5M12 19l-7-7 7-7" />}
        </svg>
      </button>
    </div>
  );
}
