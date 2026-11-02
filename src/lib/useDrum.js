import { useEffect, useRef, useState } from 'react';

const FRICTION = 0.94;      // per-frame velocity decay
const MIN_VELOCITY = 0.02;  // px/ms below which we stop and snap

/**
 * Physics of a vertical picker drum (rating picker, Random category filter):
 * the drum follows the finger/mouse, keeps spinning with inertia after a flick,
 * slows down by friction and settles on the nearest item with a smooth ease-out.
 *
 * Returns the current offset (px, 0 = first item centred), the index under the
 * centre line and the handlers to put on the drum element.
 */
export function useDrum({ count, itemH, initialIndex = 0, onChange }) {
  const maxIdx = Math.max(0, count - 1);
  const [selected, setSelected] = useState(initialIndex);
  const [offset, setOffset] = useState(-initialIndex * itemH);

  const cur = useRef(-initialIndex * itemH);
  const startY = useRef(0);
  const startOffset = useRef(0);
  const dragging = useRef(false);
  const lastMove = useRef({ y: 0, t: 0 });
  const velocity = useRef(0); // px per ms
  const frame = useRef(null);
  const selRef = useRef(initialIndex);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const geo = useRef({ maxIdx, itemH });
  geo.current = { maxIdx, itemH };

  const clamp = (v) => Math.max(-geo.current.maxIdx * geo.current.itemH, Math.min(0, v));
  const indexAt = (o) => Math.max(0, Math.min(geo.current.maxIdx, Math.round(-o / geo.current.itemH)));

  const setIdx = (idx) => {
    if (idx === selRef.current) return;
    selRef.current = idx;
    setSelected(idx);
    onChangeRef.current?.(idx);
  };
  const moveTo = (o) => { cur.current = o; setOffset(o); setIdx(indexAt(o)); };

  const cancel = () => { if (frame.current) cancelAnimationFrame(frame.current); frame.current = null; };

  // Smooth settle on an item (ease-out cubic, 380 ms)
  const animateTo = (target) => {
    cancel();
    const start = cur.current;
    const t0 = performance.now();
    const step = (now) => {
      const t = Math.min(1, (now - t0) / 380);
      const eased = 1 - Math.pow(1 - t, 3);
      cur.current = start + (target - start) * eased;
      setOffset(cur.current);
      if (t < 1) frame.current = requestAnimationFrame(step);
      else { cur.current = target; setOffset(target); frame.current = null; }
    };
    frame.current = requestAnimationFrame(step);
  };

  const snapTo = (o) => {
    const idx = indexAt(o);
    setIdx(idx);
    animateTo(-idx * geo.current.itemH);
  };

  const runMomentum = () => {
    cancel();
    const step = () => {
      velocity.current *= FRICTION;
      if (Math.abs(velocity.current) < MIN_VELOCITY) { snapTo(cur.current); return; }
      const next = cur.current + velocity.current * 16; // ~ms per frame
      if (next !== clamp(next)) { moveTo(clamp(next)); snapTo(cur.current); return; } // hit an end
      moveTo(next);
      frame.current = requestAnimationFrame(step);
    };
    frame.current = requestAnimationFrame(step);
  };

  const start = (y) => {
    cancel();
    dragging.current = true;
    startY.current = y;
    startOffset.current = cur.current;
    lastMove.current = { y, t: performance.now() };
    velocity.current = 0;
  };
  const move = (y) => {
    if (!dragging.current) return;
    const now = performance.now();
    moveTo(clamp(startOffset.current + (y - startY.current)));
    const dt = now - lastMove.current.t;
    if (dt > 0) velocity.current = velocity.current * 0.7 + ((y - lastMove.current.y) / dt) * 0.3;
    lastMove.current = { y, t: now };
  };
  const end = () => {
    if (!dragging.current) return;
    dragging.current = false;
    if (Math.abs(velocity.current) > MIN_VELOCITY) runMomentum();
    else snapTo(cur.current);
  };

  // Mouse keeps working when it leaves the drum mid-drag
  useEffect(() => {
    const up = () => end();
    const mv = (e) => move(e.clientY);
    window.addEventListener('mouseup', up);
    window.addEventListener('mousemove', mv);
    return () => {
      window.removeEventListener('mouseup', up);
      window.removeEventListener('mousemove', mv);
      cancel();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handlers = {
    onTouchStart: (e) => start(e.touches[0].clientY),
    onTouchMove: (e) => move(e.touches[0].clientY),
    onTouchEnd: end,
    onTouchCancel: end,
    onMouseDown: (e) => start(e.clientY),
  };

  return { offset, selected, handlers };
}
