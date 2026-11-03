import { useState, useEffect, useRef } from 'react';
import { getCategories, setCategoryOrder, togglePin } from '../store';
import TopBar from '../components/TopBar';
import CroppedImage from '../components/CroppedImage';
import { coverCrop } from '../lib/cover';
import { useIsDesktop } from '../lib/useIsDesktop';

const LONG_PRESS_MS = 450;

const PinIcon = ({ size = 14, color = '#fff' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 17v5" /><path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z" />
  </svg>
);

/**
 * Home: category tiles. Long press (phone) or right click (desktop) on a tile opens
 * a small menu: pin / rearrange / appearance. In rearrange mode tiles are dragged
 * with a finger or the mouse; pinned ones always stay on top.
 */
export default function HomePage({ onOpenCategory, onProfile, onRefresh, profile, refreshKey, badge }) {
  const [cats, setCats] = useState(getCategories); // no empty first frame
  const desktop = useIsDesktop();
  const [menu, setMenu] = useState(null);       // category the menu is open for
  const [arranging, setArranging] = useState(false);
  const [order, setOrder] = useState(null);     // ids while rearranging
  const [drag, setDrag] = useState(null);       // { id, dx, dy }
  const press = useRef(null);
  const dragInfo = useRef(null);
  const tileRefs = useRef(new Map());

  useEffect(() => { setCats(getCategories()); }, [refreshKey]);

  const byId = new Map(cats.map((c) => [c.id, c]));
  const shown = arranging && order ? order.map((id) => byId.get(id)).filter(Boolean) : cats;
  const pinnedCount = cats.filter((c) => c.pinned).length;

  // ---- long press / right click → menu ----
  const startPress = (e, cat) => {
    if (arranging || e.pointerType === 'mouse') return;
    const x = e.clientX, y = e.clientY;
    press.current = { x, y, t: setTimeout(() => {
      press.current = null;
      navigator.vibrate?.(10);
      // The finger lifting after a long press still produces a click — swallow that one,
      // otherwise it would hit the tile (opening it) or a button of the menu under the finger.
      const swallow = (ev) => { ev.preventDefault(); ev.stopPropagation(); window.removeEventListener('click', swallow, true); };
      window.addEventListener('click', swallow, true);
      setTimeout(() => window.removeEventListener('click', swallow, true), 800);
      setMenu(cat);
    }, LONG_PRESS_MS) };
  };
  const movePress = (e) => {
    if (press.current && Math.hypot(e.clientX - press.current.x, e.clientY - press.current.y) > 10) { clearTimeout(press.current.t); press.current = null; }
  };
  const endPress = () => { if (press.current) { clearTimeout(press.current.t); press.current = null; } };
  const onTileClick = (cat) => {
    if (arranging) return;
    onOpenCategory(cat.id);
  };

  // ---- rearrange ----
  const startArrange = () => { setMenu(null); setOrder(cats.map((c) => c.id)); setArranging(true); };
  const finishArrange = () => { if (order) setCategoryOrder(order); setArranging(false); setOrder(null); setDrag(null); setCats(getCategories()); onRefresh?.(); };

  const onDragStart = (e, cat) => {
    if (!arranging) return;
    e.preventDefault();
    const ids = order;
    // Slot rectangles stay fixed while dragging (all tiles are the same size)
    const slots = ids.map((id) => tileRefs.current.get(id).getBoundingClientRect());
    const from = ids.indexOf(cat.id);
    const pinned = !!cat.pinned;
    const lo = pinned ? 0 : pinnedCount, hi = pinned ? pinnedCount - 1 : ids.length - 1;
    dragInfo.current = { id: cat.id, x0: e.clientX, y0: e.clientY, slots, start: slots[from], lo, hi };
    setDrag({ id: cat.id, dx: 0, dy: 0 });
    // Follow the pointer on the window: React moves tile nodes while reordering,
    // which would drop a pointer capture set on the tile itself.
    const move = (ev) => onDragMove(ev);
    const up = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); window.removeEventListener('pointercancel', up); onDragEnd(); };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
  };
  const onDragMove = (e) => {
    const d = dragInfo.current;
    if (!d) return;
    const px = e.clientX, py = e.clientY;
    // which slot is the pointer over (nearest centre), kept inside the tile's group
    let best = 0, bestDist = Infinity;
    d.slots.forEach((r, i) => {
      const dist = Math.hypot(px - (r.left + r.width / 2), py - (r.top + r.height / 2));
      if (dist < bestDist) { bestDist = dist; best = i; }
    });
    best = Math.max(d.lo, Math.min(d.hi, best));
    setOrder((ids) => {
      const cur = ids.indexOf(d.id);
      if (cur === best) return ids;
      const next = ids.filter((id) => id !== d.id);
      next.splice(best, 0, d.id);
      return next;
    });
    setDrag({ id: d.id, x: d.start.left + (px - d.x0), y: d.start.top + (py - d.y0) });
  };
  const onDragEnd = () => { dragInfo.current = null; setDrag(null); };

  const offsetFor = (cat, index) => {
    if (!drag || drag.id !== cat.id || drag.x == null) return null;
    const slot = dragInfo.current?.slots[index];
    return slot ? { x: drag.x - slot.left, y: drag.y - slot.top } : null;
  };

  return (
    <div className="page dotted-bg" style={{ paddingBottom: 140 }}>
      <TopBar onOpenCategory={onOpenCategory} onProfile={onProfile} onRefresh={onRefresh} profile={profile} badge={badge} />

      {arranging && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12, padding: desktop ? '18px 0 0' : '16px 16px 0',
          maxWidth: desktop ? 769 : 'none', margin: '0 auto', position: 'sticky', top: 0, zIndex: 20,
        }}>
          <div style={{ flex: 1, color: '#8E8E93', fontSize: 14, fontWeight: 700, lineHeight: '18px', paddingLeft: 4 }}>Перетаскивай плитки, чтобы поменять порядок</div>
          <button type="button" className="d-btn primary" onClick={finishArrange} style={{ width: 'auto', padding: '0 22px', flexShrink: 0, boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}>Готово</button>
        </div>
      )}

      {/* Phone: one column of wide tiles. Desktop: 2-column grid of 375×200 tiles (Figma desktop). */}
      <div style={desktop
        ? { maxWidth: 769, margin: '0 auto', paddingTop: arranging ? 16 : 32, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }
        : { padding: '20px 16px 0', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {cats.length === 0 && (
          <div className="glass" style={{ borderRadius: 28, padding: '60px 24px', textAlign: 'center', gridColumn: '1 / -1' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🎬</div>
            <div style={{ fontSize: 20, fontWeight: 500, color: 'var(--text)', marginBottom: 6 }}>Пока пусто</div>
            <div style={{ fontSize: 15, color: 'var(--text-dim)' }}>Нажми + чтобы добавить категорию</div>
          </div>
        )}

        {shown.map((cat, index) => {
          const off = offsetFor(cat, index);
          const dragging = !!off;
          return (
            <div
              key={cat.id}
              ref={(el) => { if (el) tileRefs.current.set(cat.id, el); else tileRefs.current.delete(cat.id); }}
              onClick={() => onTileClick(cat)}
              onContextMenu={(e) => { e.preventDefault(); if (!arranging) setMenu(cat); }}
              onPointerDown={(e) => (arranging ? onDragStart(e, cat) : startPress(e, cat))}
              onPointerMove={(e) => { if (!arranging) movePress(e); }}
              onPointerUp={() => { if (!arranging) endPress(); }}
              onPointerCancel={() => { if (!arranging) endPress(); }}
              className="tile"
              style={{
                cursor: arranging ? (dragging ? 'grabbing' : 'grab') : 'pointer',
                height: desktop ? 200 : 160,
                borderRadius: desktop ? 37.5 : 28,
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                background: cat.color,
                touchAction: arranging ? 'none' : 'auto',
                transform: off ? `translate(${off.x}px, ${off.y}px) scale(1.03)` : 'none',
                transition: dragging ? 'none' : 'transform 0.2s cubic-bezier(0.25,0.46,0.45,0.94), box-shadow 0.2s',
                zIndex: dragging ? 10 : 'auto',
                boxShadow: dragging ? '0 24px 60px rgba(0,0,0,0.7)' : arranging ? '0 0 0 2px #2C2C2C' : 'none',
              }}
            >
              {/* Cover photo: same crop model and editor as the profile photos */}
              {cat.image && <CroppedImage src={cat.image} pos={coverCrop(cat)} style={{ position: 'absolute', inset: 0 }} />}
              <div style={{
                position: 'absolute', inset: 0,
                background: cat.image ? 'rgba(0,0,0,0.4)' : 'linear-gradient(to bottom, rgba(0,0,0,0.05), rgba(0,0,0,0.25))',
              }} />
              <span style={{
                position: 'relative', zIndex: 1, fontSize: desktop ? 36 : 28, fontWeight: 700, color: '#fff',
                letterSpacing: '-0.5px', textAlign: 'center', padding: '0 20px',
                textShadow: '0 2px 12px rgba(0,0,0,0.4)', pointerEvents: 'none',
              }}>{cat.name}</span>
              {cat.pinned && (
                <span title="Закреплена" style={{ position: 'absolute', top: 12, right: 12, width: 28, height: 28, borderRadius: '50%', background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                  <PinIcon />
                </span>
              )}
              {arranging && (
                <span style={{ position: 'absolute', left: 14, top: '50%', marginTop: -10, opacity: 0.8, pointerEvents: 'none' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff"><circle cx="9" cy="6" r="1.6" /><circle cx="15" cy="6" r="1.6" /><circle cx="9" cy="12" r="1.6" /><circle cx="15" cy="12" r="1.6" /><circle cx="9" cy="18" r="1.6" /><circle cx="15" cy="18" r="1.6" /></svg>
                </span>
              )}
            </div>
          );
        })}
      </div>


      {menu && (
        <>
          <div className="sheet-backdrop" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 398, animation: 'fadeIn 0.2s ease' }} onClick={() => setMenu(null)} />
          <div className="glass sheet-panel" style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: 430, borderRadius: '28px 28px 0 0', padding: '14px 22px 32px', zIndex: 399, animation: 'slideUp 0.32s cubic-bezier(0.34,1.26,0.64,1)' }}>
            <div className="sheet-handle" style={{ width: 36, height: 4, borderRadius: 2, margin: '0 auto 18px' }} />
            <div className="d-title" style={{ marginBottom: 18 }}>{menu.name}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button type="button" className="d-btn" style={{ justifyContent: 'flex-start', padding: '0 16px', gap: 14, height: 52 }}
                onClick={() => { togglePin(menu.id); setMenu(null); setCats(getCategories()); onRefresh?.(); }}>
                <PinIcon size={20} /> {menu.pinned ? 'Открепить' : 'Закрепить наверху'}
              </button>
              <button type="button" className="d-btn" style={{ justifyContent: 'flex-start', padding: '0 16px', gap: 14, height: 52 }} onClick={startArrange} disabled={cats.length < 2}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 16 4 4 4-4" /><path d="M7 20V4" /><path d="m21 8-4-4-4 4" /><path d="M17 4v16" /></svg>
                Поменять порядок
              </button>
              <button type="button" className="d-btn" style={{ justifyContent: 'flex-start', padding: '0 16px', gap: 14, height: 52 }}
                onClick={() => { const id = menu.id; setMenu(null); onOpenCategory(id, 'appearance'); }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="13.5" cy="6.5" r=".5" fill="#fff" /><circle cx="17.5" cy="10.5" r=".5" fill="#fff" /><circle cx="8.5" cy="7.5" r=".5" fill="#fff" /><circle cx="6.5" cy="12.5" r=".5" fill="#fff" /><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" /></svg>
                Оформление
              </button>
              <button type="button" className="d-btn ghost" onClick={() => setMenu(null)}>Отмена</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
