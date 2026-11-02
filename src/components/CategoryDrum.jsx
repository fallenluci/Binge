import { useRef } from 'react';
import { useDrum } from '../lib/useDrum';

// Vertical capsule drum matching the rating-picker visual language:
// dark fill, gray stroke border, bold white selected item, dim gray item below.
const ITEM_H = 64;

export default function CategoryDrum({ items, selectedIndex, onSelect, onDone }) {
  // Same physics as the rating drum: inertia after a flick, friction, smooth settle
  const { offset, selected, handlers } = useDrum({ count: items.length, itemH: ITEM_H, initialIndex: selectedIndex, onChange: onSelect });
  // Close on a click on the free area — but not when a drag of the drum ends outside it
  const downOnBackdrop = useRef(false);

  return (
    <div
      onPointerDown={e => { downOnBackdrop.current = e.target === e.currentTarget; }}
      onClick={e => { if (downOnBackdrop.current && e.target === e.currentTarget) onDone(); }}
      style={{
        position: 'fixed', inset: 0, zIndex: 500,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        gap: 28,
        background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
      }}
    >
      <div
        style={{
          position: 'relative', width: 150, height: 210, overflow: 'hidden',
          cursor: 'grab', userSelect: 'none', touchAction: 'pan-x',
          background: 'rgb(23,23,23)', borderRadius: 105,
          border: '3px solid #8E8E93',
        }}
        {...handlers}
      >
        <div style={{
          position: 'relative', transform: `translateY(${offset + ITEM_H}px)`,
        }}>
          {items.map((item, idx) => {
            const isCenter = idx === selected;
            return (
              <div key={item.id ?? idx} style={{
                height: ITEM_H, display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <span style={{
                  fontSize: isCenter ? 22 : 16,
                  fontWeight: isCenter ? 700 : 500,
                  color: isCenter ? '#fff' : 'var(--text-dim)',
                  opacity: isCenter ? 1 : 0.6,
                  transition: 'all 0.2s',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  maxWidth: 120, textAlign: 'center',
                }}>{item.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      <button
        type="button"
        onClick={onDone}
        style={{
          background: 'rgb(141,141,146)', border: 'none', borderRadius: 999,
          padding: '14px 44px', color: '#515151', fontSize: 16, fontWeight: 700,
          cursor: 'pointer',
        }}
      >Готово</button>
    </div>
  );
}
