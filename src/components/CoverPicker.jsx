import { useRef, useState } from 'react';
import CroppedImage, { DEFAULT_POS } from './CroppedImage';
import PhotoCropper from './PhotoCropper';
import PhotoMenu from './PhotoMenu';
import { compressImage } from '../lib/image';
import { tileAspect } from '../lib/cover';
import { useIsDesktop } from '../lib/useIsDesktop';

/**
 * Category cover: a live preview with the home-tile proportions plus the same photo
 * editor and photo menu as the profile avatar/banner.
 * value = { image, crop }, onChange(value)
 */
export default function CoverPicker({ name, color, value, onChange }) {
  const desktop = useIsDesktop();
  const fileRef = useRef(null);
  const [menu, setMenu] = useState(false);
  const [cropper, setCropper] = useState(null); // { src, pos, isNew }
  const t = tileAspect(desktop);

  const pick = () => fileRef.current?.click();
  const onFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const src = await compressImage(file);
      setCropper({ src, pos: DEFAULT_POS, isNew: true });
    } catch (err) { alert(err.message); }
  };

  const tile = (size) => (
    <div style={{ position: 'relative', overflow: 'hidden', width: size, aspectRatio: t.ratio, borderRadius: t.radius * (size === '100%' ? 1 : 0.5), background: color, flexShrink: 0 }}>
      {value.image && <CroppedImage src={value.image} pos={value.crop} style={{ position: 'absolute', inset: 0 }} />}
      <div style={{ position: 'absolute', inset: 0, background: value.image ? 'rgba(0,0,0,0.4)' : 'linear-gradient(to bottom, rgba(0,0,0,0.05), rgba(0,0,0,0.25))' }} />
    </div>
  );

  return (
    <>
      <div onClick={() => (value.image ? setMenu(true) : pick())} style={{ position: 'relative', cursor: 'pointer', marginBottom: 12 }}>
        {tile('100%')}
        <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 20px', textAlign: 'center', color: '#fff', fontWeight: 700, fontSize: desktop ? 30 : 26, letterSpacing: '-0.5px', textShadow: '0 2px 12px rgba(0,0,0,0.4)' }}>{name || 'Превью'}</span>
      </div>
      <button type="button" className="d-btn" style={{ marginBottom: 18 }} onClick={() => (value.image ? setMenu(true) : pick())}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="3" /><circle cx="9" cy="9" r="2" /><path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21" /></svg>
        {value.image ? 'Фото обложки' : 'Загрузить фото'}
      </button>
      <input ref={fileRef} type="file" accept="image/*" hidden onChange={onFile} />

      {menu && (
        <PhotoMenu
          title="Фото обложки"
          preview={tile(180)}
          onAdjust={() => { setMenu(false); setCropper({ src: value.image, pos: value.crop, isNew: false }); }}
          onReplace={() => { setMenu(false); pick(); }}
          onRemove={() => { setMenu(false); onChange({ image: null, crop: DEFAULT_POS }); }}
          onClose={() => setMenu(false)}
        />
      )}
      {cropper && (
        <PhotoCropper
          src={cropper.src}
          shape="tile"
          title="Обложка категории"
          initialPos={cropper.pos}
          onDone={(pos) => { onChange({ image: cropper.src, crop: pos }); setCropper(null); }}
          onCancel={() => setCropper(null)}
        />
      )}
    </>
  );
}
