import { useIsDesktop } from '../lib/useIsDesktop';

// The tilted, bottom-cropped mascot shared by the splash and the sign-in screen.
// Position is 1:1 with the Figma mockups: phone (844pt tall) and desktop (1024px tall).
// On shorter screens it slides down so the sign-in card never covers it.
export default function Mascot({ animate = true, onReady }) {
  const desktop = useIsDesktop();
  const frame = desktop
    ? { size: 697, dx: 1, bottom: 38, frameH: 1024 }
    : { size: 567, dx: 6, bottom: 10.6, frameH: 844 };
  return (
    <img
      src="/dori-mascot.webp"
      decoding="sync"
      onLoad={onReady}
      onError={onReady}
      alt=""
      aria-hidden="true"
      draggable="false"
      className={animate ? 'auth-mascot' : 'auth-mascot is-static'}
      style={{
        position: 'absolute', left: `calc(50% + ${frame.dx}px)`,
        bottom: `calc(${frame.bottom}px - max(0px, (${frame.frameH}px - var(--app-h)) * 0.72))`,
        width: frame.size, height: frame.size, maxWidth: 'none',
        pointerEvents: 'none', userSelect: 'none', zIndex: 0,
      }}
    />
  );
}
