import { useRef, useState } from 'react';
import CroppedImage, { clampPos, layoutImage, DEFAULT_POS } from './CroppedImage';
import { useIsDesktop } from '../lib/useIsDesktop';

const PURPLE = '#351E88';
const btn = {
  height: 46, borderRadius: 18, border: 'none', cursor: 'pointer', flex: 1,
  fontFamily: 'inherit', fontSize: 16, fontWeight: 700, color: '#fff',
};

/**
 * Full-screen crop editor: drag to move, pinch / mouse wheel / slider to zoom.
 * shape: 'circle' (avatar) or 'banner' (same proportions as the profile banner).
 */
export default function PhotoCropper({ src, shape, initialPos, onDone, onCancel }) {
  const [pos, setPos] = useState(initialPos || DEFAULT_POS);
  const geom = useRef(null); // { nat, box } once the image is measured
  const pointers = useRef(new Map());
  const gesture = useRef(null);

  const apply = (next) => setPos(geom.current ? clampPos(geom.current.nat, geom.current.box, next) : next);

  const onPointerDown = (e) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    startGesture();
  };
  const startGesture = () => {
    const pts = [...pointers.current.values()];
    gesture.current = {
      pos, pts,
      dist: pts.length > 1 ? Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y) : 0,
    };
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
  const onPointerUp = (e) => {
    pointers.current.delete(e.pointerId);
    startGesture(); // continue smoothly if one finger stays down
  };
  const onWheel = (e) => apply({ ...pos, scale: pos.scale * Math.exp(-e.deltaY * 0.0015) });

  const isCircle = shape === 'circle';
  // The banner frame has the proportions of the banner on this layout (phone 390×360, desktop 710×198)
  const desktop = useIsDesktop();

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 500, background: '#000', display: 'flex', justifyContent: 'center', animation: 'fadeIn 0.2s ease' }}>
      <div style={{ width: '100%', maxWidth: desktop && !isCircle ? 758 : 430, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 'calc(60px + var(--top-shift)) 0 40px' }}>
        <div style={{ color: '#fff', fontSize: 24, fontWeight: 700, lineHeight: '24px' }}>{isCircle ? 'Аватар' : 'Баннер'}</div>
        <div style={{ color: '#515151', fontSize: 13, fontWeight: 700, marginTop: 10 }}>Двигай фото и меняй размер</div>

        <div style={{ flex: 1, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <CroppedImage
            src={src}
            pos={pos}
            onMeasure={(m) => { geom.current = m; if (m) setPos((p) => clampPos(m.nat, m.box, p)); }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            onWheel={onWheel}
            style={{
              touchAction: 'none', cursor: 'grab', background: '#171717',
              ...(isCircle
                ? { width: 280, height: 280, borderRadius: '50%' }
                : desktop ? { width: 'calc(100% - 48px)', aspectRatio: '710 / 198', borderRadius: '37.5px 37.5px 0 0' } : { width: '100%', aspectRatio: '390 / 360' }),
              boxShadow: '0 0 0 1px #2C2C2C',
            }}
          />
        </div>

        <div style={{ width: 254, display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8E8E93" strokeWidth="2.5" strokeLinecap="round"><rect x="5" y="5" width="14" height="14" rx="3" /></svg>
          <input
            type="range" min="1" max="4" step="0.01" value={pos.scale}
            onChange={(e) => apply({ ...pos, scale: Number(e.target.value) })}
            style={{ flex: 1, accentColor: PURPLE }}
          />
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8E8E93" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="4" /></svg>
        </div>

        <div style={{ width: 254, display: 'flex', gap: 8 }}>
          <button type="button" onClick={onCancel} style={{ ...btn, background: '#2C2C2C' }}>Отмена</button>
          <button type="button" onClick={() => onDone(pos)} style={{ ...btn, background: PURPLE }}>Готово</button>
        </div>
      </div>
    </div>
  );
}
