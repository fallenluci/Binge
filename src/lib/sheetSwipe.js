import { DESKTOP_QUERY } from './useIsDesktop';

// Pull a bottom sheet down to close it (phone only — on desktop sheets are centred windows).
// One listener for every `.sheet-panel`: the sheet follows the finger while its content is
// scrolled to the top; let go far/fast enough and it slides away, then the sheet's own
// backdrop is clicked so the component closes the usual way. Otherwise it springs back.
const CLOSE_DIST = 110; // px
const CLOSE_SPEED = 0.6; // px/ms

function scrolledAbove(target, panel) {
  for (let el = target; el && el !== panel.parentNode; el = el.parentNode) {
    if (el.scrollTop > 0) return true;
    if (el === panel) break;
  }
  return false;
}

export function installSheetSwipe() {
  let s = null; // active gesture

  const reset = (panel, base, backdrop) => {
    panel.style.transition = 'transform 0.25s cubic-bezier(0.2,0.8,0.2,1)';
    panel.style.transform = base;
    if (backdrop) { backdrop.style.transition = 'opacity 0.25s ease'; backdrop.style.opacity = ''; }
    setTimeout(() => { panel.style.transition = ''; if (backdrop) backdrop.style.transition = ''; }, 260);
  };

  document.addEventListener('touchstart', (e) => {
    s = null;
    if (e.touches.length !== 1 || window.matchMedia(DESKTOP_QUERY).matches) return;
    const panel = e.target.closest?.('.sheet-panel');
    if (!panel || panel.hasAttribute('data-noswipe') || e.target.closest('[data-noswipe], input[type=range]')) return;
    let backdrop = panel.previousElementSibling;
    while (backdrop && !backdrop.classList.contains('sheet-backdrop')) backdrop = backdrop.previousElementSibling;
    if (!backdrop) return;
    const t = e.touches[0];
    s = { panel, backdrop, x: t.clientX, y: t.clientY, t: e.timeStamp, dy: 0, v: 0, mode: null, base: panel.style.transform, scrolled: scrolledAbove(e.target, panel) };
  }, { passive: true, capture: true });

  document.addEventListener('touchmove', (e) => {
    if (!s) return;
    const t = e.touches[0];
    const dx = t.clientX - s.x, dy = t.clientY - s.y;
    if (!s.mode) {
      if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
      // Only a downward pull from the top of the content drags the sheet; anything else scrolls
      s.mode = dy > 0 && Math.abs(dy) > Math.abs(dx) && !s.scrolled ? 'drag' : 'skip';
      if (s.mode === 'drag') { s.panel.style.transition = 'none'; s.panel.style.animation = 'none'; document.activeElement?.blur?.(); }
    }
    if (s.mode !== 'drag') return;
    e.preventDefault();
    const d = Math.max(0, dy);
    s.v = (d - s.dy) / Math.max(1, e.timeStamp - s.t); s.t = e.timeStamp; s.dy = d;
    s.panel.style.transform = `${s.base} translateY(${d}px)`;
    s.backdrop.style.opacity = String(Math.max(0.2, 1 - d / 500));
  }, { passive: false, capture: true });

  const end = () => {
    if (!s || s.mode !== 'drag') { s = null; return; }
    const { panel, backdrop, base, dy, v } = s; s = null;
    if (dy > CLOSE_DIST || v > CLOSE_SPEED) {
      panel.style.transition = 'transform 0.22s ease-in';
      panel.style.transform = `${base} translateY(${panel.offsetHeight + 40}px)`;
      backdrop.style.transition = 'opacity 0.22s ease'; backdrop.style.opacity = '0';
      setTimeout(() => { backdrop.dataset.closing = '1'; backdrop.click(); }, 200);
    } else reset(panel, base, backdrop);
  };
  document.addEventListener('touchend', end, { passive: true, capture: true });

  // Tapping outside a sheet: it slides down (a centred window on desktop fades out) before it closes.
  // The click is held back, the panel animates, then the backdrop is clicked again for real.
  document.addEventListener('click', (e) => {
    const bd = e.target;
    if (!bd.classList?.contains('sheet-backdrop') || bd.dataset.closing) return;
    let panel = bd.nextElementSibling;
    while (panel && !panel.classList.contains('sheet-panel')) panel = panel.nextElementSibling;
    if (!panel) return;
    e.stopPropagation(); e.preventDefault();
    bd.dataset.closing = '1';
    const desk = window.matchMedia(DESKTOP_QUERY).matches;
    panel.style.animation = 'none';
    panel.style.transition = desk ? 'opacity 0.18s ease, scale 0.18s ease' : 'translate 0.24s cubic-bezier(0.4,0,1,1)';
    if (desk) { panel.style.opacity = '0'; panel.style.scale = '0.96'; }
    else panel.style.translate = `0 ${panel.offsetHeight + 40}px`;
    bd.style.transition = 'opacity 0.22s ease'; bd.style.opacity = '0';
    setTimeout(() => { if (bd.isConnected) bd.click(); }, desk ? 170 : 220);
  }, true);
  document.addEventListener('touchcancel', end, { passive: true, capture: true });
}
