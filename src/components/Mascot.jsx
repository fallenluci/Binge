// The tilted, bottom-cropped mascot shared by the splash and the sign-in screen.
// Position is 1:1 with the Figma mockup on an 844pt-tall screen; on shorter
// phones it slides down so the sign-in card never covers it.
export default function Mascot({ animate = true, onReady }) {
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
        position: 'absolute', left: 'calc(50% + 6px)', bottom: 'calc(10.6px - max(0px, (844px - 100dvh) * 0.72))',
        width: 567, height: 567, maxWidth: 'none',
        pointerEvents: 'none', userSelect: 'none', zIndex: 0,
      }}
    />
  );
}
