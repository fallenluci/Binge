import { useRef, useState } from 'react';

// Drag-to-reposition editor: shows image in a tile-sized box,
// user drags to pan the image, result stored as {x,y} percentages
// used as CSS background-position.
export default function ImagePositionEditor({ image, position, onChange }) {
  const boxRef = useRef(null);
  const startPos = useRef({ x: 50, y: 50 });
  const startPoint = useRef({ x: 0, y: 0 });
  const dragging = useRef(false);

  const BOX_W = 342; // approx tile width inside modal padding
  const BOX_H = 160;

  const onDown = (clientX, clientY) => {
    dragging.current = true;
    startPoint.current = { x: clientX, y: clientY };
    startPos.current = { ...position };
  };
  const onMove = (clientX, clientY) => {
    if (!dragging.current) return;
    const dx = clientX - startPoint.current.x;
    const dy = clientY - startPoint.current.y;
    const nx = Math.max(0, Math.min(100, startPos.current.x - (dx / BOX_W) * 100));
    const ny = Math.max(0, Math.min(100, startPos.current.y - (dy / BOX_H) * 100));
    onChange({ x: nx, y: ny });
  };
  const onUp = () => { dragging.current = false; };

  return (
    <div>
      <div
        ref={boxRef}
        style={{
          width: '100%', height: BOX_H, borderRadius: 16, overflow: 'hidden',
          position: 'relative', cursor: 'grab', userSelect: 'none',
          background: image ? `url(${image}) ${position.x}% ${position.y}%/cover no-repeat` : '#222',
          border: '1px solid rgba(255,255,255,0.15)', touchAction: 'none',
        }}
        onMouseDown={e => onDown(e.clientX, e.clientY)}
        onMouseMove={e => onMove(e.clientX, e.clientY)}
        onMouseUp={onUp}
        onMouseLeave={onUp}
        onTouchStart={e => onDown(e.touches[0].clientX, e.touches[0].clientY)}
        onTouchMove={e => onMove(e.touches[0].clientX, e.touches[0].clientY)}
        onTouchEnd={onUp}
      >
        {/* Grid overlay to make dragging feel intentional */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)',
          backgroundSize: '33.3% 33.3%',
        }} />
        <div style={{
          position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(0,0,0,0.55)', color: 'white', fontSize: 11, fontWeight: 600,
          padding: '4px 10px', borderRadius: 20, pointerEvents: 'none',
        }}>Перетащи, чтобы подогнать</div>
      </div>
    </div>
  );
}
