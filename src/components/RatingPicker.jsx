import { useState, useRef, useEffect } from 'react';

const ITEM_HEIGHT = 72;
const RATINGS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export default function RatingPicker({ film, onRate, onClose, bgColor }) {
  const [selected, setSelected] = useState(film.rating ?? 7);
  const containerRef = useRef(null);
  const startY = useRef(0);
  const currentOffset = useRef(0);
  const isDragging = useRef(false);

  const getOffset = (val) => -(val - 1) * ITEM_HEIGHT;

  const [offset, setOffset] = useState(getOffset(film.rating ?? 7));

  const snapToNearest = (rawOffset) => {
    const index = Math.round(-rawOffset / ITEM_HEIGHT);
    const clamped = Math.max(0, Math.min(RATINGS.length - 1, index));
    setSelected(RATINGS[clamped]);
    const snapped = -clamped * ITEM_HEIGHT;
    setOffset(snapped);
    currentOffset.current = snapped;
  };

  const handleTouchStart = (e) => {
    startY.current = e.touches[0].clientY;
    isDragging.current = true;
  };

  const handleTouchMove = (e) => {
    if (!isDragging.current) return;
    const dy = e.touches[0].clientY - startY.current;
    const newOffset = currentOffset.current + dy;
    const maxOffset = 0;
    const minOffset = -(RATINGS.length - 1) * ITEM_HEIGHT;
    setOffset(Math.max(minOffset, Math.min(maxOffset, newOffset)));
  };

  const handleTouchEnd = (e) => {
    isDragging.current = false;
    const dy = e.changedTouches[0].clientY - startY.current;
    const raw = currentOffset.current + dy;
    snapToNearest(raw);
  };

  const handleMouseDown = (e) => {
    startY.current = e.clientY;
    isDragging.current = true;
  };
  const handleMouseMove = (e) => {
    if (!isDragging.current) return;
    const dy = e.clientY - startY.current;
    const newOffset = currentOffset.current + dy;
    const maxOffset = 0;
    const minOffset = -(RATINGS.length - 1) * ITEM_HEIGHT;
    setOffset(Math.max(minOffset, Math.min(maxOffset, newOffset)));
  };
  const handleMouseUp = (e) => {
    if (!isDragging.current) return;
    isDragging.current = false;
    const dy = e.clientY - startY.current;
    snapToNearest(currentOffset.current + dy);
  };

  useEffect(() => {
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 500,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      {/* Blurred bg */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: bgColor,
        opacity: 0.85,
        backdropFilter: 'blur(20px)',
      }} />

      {/* Close */}
      <button
        onClick={onClose}
        style={{
          position: 'absolute',
          top: 60,
          right: 20,
          background: 'rgba(255,255,255,0.25)',
          border: 'none',
          borderRadius: 50,
          width: 44,
          height: 44,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          color: 'white',
          fontSize: 20,
          zIndex: 1,
        }}
      >✕</button>

      {/* Film name */}
      <div style={{
        position: 'absolute',
        top: '22%',
        color: 'rgba(255,255,255,0.6)',
        fontSize: 17,
        fontWeight: 500,
        textAlign: 'center',
        padding: '0 40px',
        zIndex: 1,
      }}>
        {film.name}
      </div>

      {/* Drum */}
      <div style={{
        position: 'relative',
        height: ITEM_HEIGHT * 3,
        width: 200,
        overflow: 'hidden',
        zIndex: 1,
        cursor: 'grab',
        userSelect: 'none',
      }}
        ref={containerRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
      >
        {/* Selected highlight */}
        <div style={{
          position: 'absolute',
          top: ITEM_HEIGHT,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 120,
          height: ITEM_HEIGHT,
          background: '#1c1c1e',
          borderRadius: 24,
          zIndex: 0,
          pointerEvents: 'none',
        }} />

        {/* Items */}
        <div style={{
          transform: `translateY(${offset + ITEM_HEIGHT}px)`,
          transition: isDragging.current ? 'none' : 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
          position: 'relative',
          zIndex: 1,
        }}>
          {RATINGS.map((r) => {
            const isSelected = r === selected;
            const diff = Math.abs(r - selected);
            const opacity = diff === 0 ? 1 : diff === 1 ? 0.55 : 0.2;
            const scale = diff === 0 ? 1 : 0.78;
            return (
              <div
                key={r}
                style={{
                  height: ITEM_HEIGHT,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: diff === 0 ? 52 : 40,
                  fontWeight: 800,
                  color: isSelected ? '#30D158' : 'white',
                  opacity,
                  transform: `scale(${scale})`,
                  transition: 'all 0.2s',
                  letterSpacing: '-2px',
                }}
              >
                {r}
              </div>
            );
          })}
        </div>

        {/* Fade top/bottom */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, transparent 35%, transparent 65%, rgba(0,0,0,0.4) 100%)',
          pointerEvents: 'none',
          zIndex: 2,
        }} />
      </div>

      {/* Rate button */}
      <button
        onClick={() => onRate(selected)}
        style={{
          position: 'absolute',
          bottom: 80,
          background: 'rgba(255,255,255,0.22)',
          border: 'none',
          borderRadius: 100,
          padding: '16px 60px',
          color: 'white',
          fontSize: 18,
          fontWeight: 700,
          cursor: 'pointer',
          backdropFilter: 'blur(10px)',
          transition: 'transform 0.15s',
          zIndex: 1,
        }}
        onTouchStart={e => e.currentTarget.style.transform = 'scale(0.95)'}
        onTouchEnd={e => e.currentTarget.style.transform = 'scale(1)'}
      >
        Оценить
      </button>
    </div>
  );
}
