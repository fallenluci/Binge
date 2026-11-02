import { useState } from 'react';
import Mascot from './Mascot';

// Launch screen on phones: "Dori" centred, mascot at the bottom (Figma mockup).
// Opacity-only: the black backdrop covers the app immediately, the content fades in
// once the mascot image is decoded (so nothing pops in), and the whole splash fades out.
// The mascot sits exactly where it is on the sign-in screen, so it doesn't jump.
export default function Splash({ leaving, onShown }) {
  const [ready, setReady] = useState(false);
  const show = () => { if (!ready) { setReady(true); onShown?.(); } };
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed', inset: 0, zIndex: 1000, background: '#000', overflow: 'hidden',
        maxWidth: 430, margin: '0 auto',
        opacity: leaving ? 0 : 1, transition: 'opacity 0.45s ease', willChange: 'opacity',
        pointerEvents: leaving ? 'none' : 'auto',
      }}
    >
      <div style={{ position: 'absolute', inset: 0, opacity: ready ? 1 : 0, transition: 'opacity 0.35s ease', willChange: 'opacity' }}>
        <Mascot animate={false} onReady={show} />
        <div style={{
          position: 'absolute', left: 0, right: 0, top: 'calc(50% - 81.5px)', zIndex: 1,
          textAlign: 'center', color: '#fff',
          fontSize: 96, fontWeight: 800, lineHeight: '96px', letterSpacing: '-1.2px',
        }}>Dori</div>
      </div>
    </div>
  );
}
