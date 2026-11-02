import { useLayoutEffect, useRef, useState } from 'react';

/**
 * Crop model shared by the editor and every place the photo is shown:
 *   pos = { x, y, scale }
 *   x, y  — point of the image (0..1) placed at the centre of the frame
 *   scale — zoom on top of "cover" (1 = image just covers the frame)
 * Because it's relative, the same crop looks the same in a 42px avatar and a 155px one.
 */
export const DEFAULT_POS = { x: 0.5, y: 0.5, scale: 1 };

export function layoutImage(nat, box, pos = DEFAULT_POS) {
  const s = Math.max(box.w / nat.w, box.h / nat.h) * (pos.scale ?? 1);
  const w = nat.w * s, h = nat.h * s;
  let left = box.w / 2 - (pos.x ?? 0.5) * w;
  let top = box.h / 2 - (pos.y ?? 0.5) * h;
  // never leave an empty edge
  left = Math.min(0, Math.max(box.w - w, left));
  top = Math.min(0, Math.max(box.h - h, top));
  return { left, top, w, h };
}

export function clampPos(nat, box, pos) {
  const scale = Math.min(4, Math.max(1, pos.scale ?? 1));
  const { left, top, w, h } = layoutImage(nat, box, { ...pos, scale });
  return { x: (box.w / 2 - left) / w, y: (box.h / 2 - top) / h, scale };
}

export default function CroppedImage({ src, pos, style, className, onMeasure, children, ...rest }) {
  const boxRef = useRef(null);
  const [box, setBox] = useState(null);
  const [nat, setNat] = useState(null);

  useLayoutEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      // A hidden tab (display: none) measures 0×0 — keep the last real size, otherwise
      // the photo would be laid out again and jump when the tab is shown.
      if (width === 0 || height === 0) return;
      setBox((b) => (b && b.w === width && b.h === height ? b : { w: width, h: height }));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useLayoutEffect(() => { onMeasure?.(nat && box ? { nat, box } : null); }, [nat, box]); // eslint-disable-line react-hooks/exhaustive-deps

  const geo = src && nat && box && box.w > 0 ? layoutImage(nat, box, pos || DEFAULT_POS) : null;

  return (
    <div ref={boxRef} className={className} style={{ position: 'relative', overflow: 'hidden', ...style }} {...rest}>
      {src && (
        <img
          key={src}
          src={src}
          alt=""
          draggable={false}
          onLoad={(e) => setNat({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })}
          style={geo
            ? { position: 'absolute', left: geo.left, top: geo.top, width: geo.w, height: geo.h, maxWidth: 'none', userSelect: 'none', pointerEvents: 'none' }
            : { position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: nat ? 1 : 0, pointerEvents: 'none' }}
        />
      )}
      {children}
    </div>
  );
}
