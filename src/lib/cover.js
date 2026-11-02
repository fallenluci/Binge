import { DEFAULT_POS } from '../components/CroppedImage';

/**
 * Category cover photo crop, in the same model as the profile photos
 * ({ x, y } = point of the image at the centre of the frame, scale >= 1 on top of "cover").
 * Older categories stored CSS background percentages in `imagePosition`; they are
 * converted on the fly so nothing has to be migrated.
 */
export function coverCrop(cat) {
  if (cat?.imageCrop) return cat.imageCrop;
  const p = cat?.imagePosition;
  if (!p) return DEFAULT_POS;
  return { x: (p.x ?? 50) / 100, y: (p.y ?? 50) / 100, scale: Math.max(1, (p.scale ?? 100) / 100) };
}

// Proportions of a home-screen tile on this layout (the cover editor uses the same frame)
export function tileAspect(desktop) {
  if (desktop) return { ratio: '375 / 200', radius: 37.5 };
  const w = Math.min(typeof window !== 'undefined' ? window.innerWidth : 390, 430) - 32;
  return { ratio: `${w} / 160`, radius: 28 };
}
