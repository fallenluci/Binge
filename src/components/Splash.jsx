import Mascot from './Mascot';

// Launch screen on phones: "Dori" centred, mascot rising from the bottom.
// Same mascot position as the sign-in screen, so fading the splash out
// leaves the mascot in place and only the logo moves.
export default function Splash({ leaving }) {
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed', inset: 0, zIndex: 1000, background: '#000', overflow: 'hidden',
        maxWidth: 430, margin: '0 auto',
        opacity: leaving ? 0 : 1, transition: 'opacity 0.4s ease',
        pointerEvents: leaving ? 'none' : 'auto',
      }}
    >
      <Mascot />
      <div className="auth-reveal" style={{
        position: 'absolute', left: 0, right: 0, top: 'calc(50% - 81.5px)', zIndex: 1,
        textAlign: 'center', color: '#fff',
        fontSize: 96, fontWeight: 800, lineHeight: '96px', letterSpacing: '-1.2px',
      }}>Dori</div>
    </div>
  );
}
