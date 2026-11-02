import { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import CroppedImage, { clampPos, layoutImage, DEFAULT_POS } from './CroppedImage';
import { useIsDesktop } from '../lib/useIsDesktop';
import { tileAspect } from '../lib/cover';

const SUBTITLE = 'Двигай фото, меняй размер щипком, колёсиком или ползунком';

/**
 * One photo editor for the avatar, the profile banner and category covers.
 * Drag to move, pinch / mouse wheel / slider to zoom. The part of the photo that
 * won't be visible stays dimmed around the frame, so it's clear what gets cut.
 * shape: 'circle' (avatar) | 'banner' (profile banner) | 'tile' (category cover)
 */
export default function PhotoCropper({ src, shape, title, initialPos, onDone, onCancel }) {
  const desktop = useIsDesktop();
  const [pos, setPos] = useState(initialPos || DEFAULT_POS);
  const [geo, setGeo] = useState(null); // { nat, box } once the image is measured
  const geom = useRef(null);
  const pointers = useRef(new Map());
  const gesture = useRef(null);

  const apply = (next) => setPos(geom.current ? clampPos(geom.current.nat, geom.current.box, next) : next);

  const startGesture = () => {
    const pts = [...pointers.current.values()];
    gesture.current = { pos, pts, dist: pts.length > 1 ? Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y) : 0 };
  };
  const onPointerDown = (e) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    startGesture();
  };
  const onPointerMove = (e) => {
    if (!pointers.current.has(e.pointerId) || !geom.current) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const g = gesture.current;
    const pts = [...pointers.current.values()];
    if (pts.length > 1 && g.dist) {
      const d = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      apply({ ...g.pos, scale: g.pos.scale * (d / g.dist) });
    } else if (pts.length === 1 && g.pts.length === 1) {
      const { w, h } = layoutImage(geom.current.nat, geom.current.box, g.pos);
      apply({ ...g.pos, x: g.pos.x - (pts[0].x - g.pts[0].x) / w, y: g.pos.y - (pts[0].y - g.pts[0].y) / h });
    }
  };
  const onPointerUp = (e) => { pointers.current.delete(e.pointerId); startGesture(); };
  const onWheel = (e) => apply({ ...pos, scale: pos.scale * Math.exp(-e.deltaY * 0.0015) });

  // Frame of the same shape and proportions as where the photo is shown
  let frame;
  if (shape === 'circle') frame = { width: 'min(280px, calc(100vw - 96px))', aspectRatio: '1 / 1', borderRadius: '50%' };
  else if (shape === 'banner') frame = desktop
    ? { width: 'min(1100px, calc(100vw - 96px))', aspectRatio: '1100 / 280', borderRadius: '37.5px 37.5px 0 0' }
    : { width: 'calc(100vw - 48px)', maxWidth: 382, aspectRatio: '390 / 360', borderRadius: 28 };
  else { const t = tileAspect(desktop); frame = { width: desktop ? 'min(375px, calc(100vw - 96px))' : 'calc(min(100vw, 430px) - 32px)', aspectRatio: t.ratio, borderRadius: t.radius }; }

  const ghost = geo ? layoutImage(geo.nat, geo.box, pos) : null;
  const zoom = Math.min(1, Math.max(0, (pos.scale - 1) / 3));

  // Portal content still bubbles React events to the opener (sheets with swipe-to-close,
  // the profile swipe-back) — stop them here.
  return createPortal(
    <div onTouchStart={e => e.stopPropagation()} onTouchMove={e => e.stopPropagation()} onTouchEnd={e => e.stopPropagation()} onClick={e => e.stopPropagation()} style={{ position: 'fixed', inset: 0, zIndex: 540, background: '#000', display: 'flex', flexDirection: 'column', alignItems: 'center', overflow: 'hidden', animation: 'fadeIn 0.2s ease', padding: `calc(60px + var(--top-shift)) 24px calc(32px + env(safe-area-inset-bottom, 0px))` }}>
      <div className="d-title">{title}</div>
      <div className="d-label" style={{ marginTop: 8, textAlign: 'center', maxWidth: 300, lineHeight: '18px' }}>{SUBTITLE}</div>

      <div style={{ flex: 1, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ position: 'relative', ...frame }}>
          {/* The whole photo, dimmed: what stays outside the frame */}
          {ghost && (
            <img src={src} alt="" draggable={false} style={{
              position: 'absolute', left: ghost.left, top: ghost.top, width: ghost.w, height: ghost.h, maxWidth: 'none',
              opacity: 0.28, pointerEvents: 'none', userSelect: 'none',
            }} />
          )}
          <CroppedImage
            src={src}
            pos={pos}
            onMeasure={(m) => { geom.current = m; setGeo(m); if (m) setPos((p) => clampPos(m.nat, m.box, p)); }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            onWheel={onWheel}
            style={{
              position: 'absolute', inset: 0, borderRadius: frame.borderRadius, background: '#171717',
              touchAction: 'none', cursor: 'grab', boxShadow: '0 0 0 2px rgba(255,255,255,0.85), 0 20px 60px rgba(0,0,0,0.6)',
            }}
          />
        </div>
      </div>

      <div style={{ width: 'min(300px, 100%)', display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28 }}>
        <button type="button" aria-label="Уменьшить" onClick={() => apply({ ...pos, scale: pos.scale / 1.15 })} className="d-zoom">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.8" strokeLinecap="round"><path d="M5 12h14" /></svg>
        </button>
        <input
          type="range" min="1" max="4" step="0.01" value={pos.scale}
          onChange={(e) => apply({ ...pos, scale: Number(e.target.value) })}
          className="d-range" style={{ '--fill': `${zoom * 100}%` }}
        />
        <button type="button" aria-label="Увеличить" onClick={() => apply({ ...pos, scale: pos.scale * 1.15 })} className="d-zoom">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.8" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
        </button>
      </div>

      <div style={{ width: 'min(300px, 100%)', display: 'flex', gap: 8 }}>
        <button type="button" className="d-btn" onClick={onCancel}>Отмена</button>
        <button type="button" className="d-btn primary" onClick={() => onDone(pos)}>Готово</button>
      </div>
    </div>,
    document.body,
  );
}
