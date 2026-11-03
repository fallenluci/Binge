import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { fileToDataUrl, qrCardSvg, squareImage, styledQr, svgToPng } from '../lib/qrStyle';

/**
 * Share a link: a Dori QR card (rounded modules, purple eyes, the person's avatar in
 * the middle — Dori when there is none), the link with "Скопировать", "Сохранить
 * картинку" (PNG of the card, e.g. for stories) and the system share sheet on phones.
 * card = { avatar, avatarPos, name, caption }
 */
export function LinkBlock({ url, title, card = {} }) {
  const [logo, setLogo] = useState(null);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    let alive = true;
    (card.avatar ? squareImage(card.avatar, card.avatarPos) : Promise.resolve(null))
      .then((a) => a || fileToDataUrl('/dori-logo.png'))
      .then((l) => { if (alive) setLogo(l); }).catch(() => {});
    return () => { alive = false; };
  }, [card.avatar]); // eslint-disable-line react-hooks/exhaustive-deps
  const round = !!card.avatar;
  const svg = useMemo(() => styledQr(url, { style: 'liquid', logo, logoRound: round }), [url, logo, round]);

  const copy = async () => {
    try { await navigator.clipboard.writeText(url); } catch {
      const t = document.createElement('textarea'); t.value = url; document.body.appendChild(t); t.select(); document.execCommand('copy'); t.remove();
    }
    setCopied(true); setTimeout(() => setCopied(false), 1800);
  };
  const canShare = typeof navigator !== 'undefined' && !!navigator.share;

  const saveImage = async () => {
    setSaving(true);
    try {
      const png = await svgToPng(qrCardSvg({ url, logo, logoRound: round, title: card.name || title, caption: card.caption || '' }), 1080, 1350);
      const name = `dori-${(card.name || title || 'qr').replace(/[^\p{L}\p{N}]+/gu, '-').toLowerCase()}.png`;
      const file = new File([png], name, { type: 'image/png' });
      // Phones: the share sheet has "Сохранить изображение"; elsewhere — a normal download
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file] }).catch(() => {});
      } else {
        const a = document.createElement('a'); a.href = URL.createObjectURL(png); a.download = name;
        document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 5000);
      }
    } catch (e) { console.error(e); }
    setSaving(false);
  };

  return (
    <div>
      <div style={{ margin: '4px 0 16px', padding: '22px 22px 18px', borderRadius: 30, textAlign: 'center', background: 'radial-gradient(circle at 50% 38%, #2a1a66 0%, #111 66%)' }}>
        <div style={{ width: 'min(230px, 62vw)', aspectRatio: '1 / 1', margin: '0 auto' }} dangerouslySetInnerHTML={{ __html: svg }} />
        {card.name && <div style={{ color: '#fff', fontSize: 20, fontWeight: 800, marginTop: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{card.name}</div>}
        {card.caption && <div style={{ color: '#8E8E93', fontSize: 12, fontWeight: 700, marginTop: 4 }}>{card.caption}</div>}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <div className="d-field" style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', color: '#8E8E93', fontSize: 14, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', userSelect: 'all' }}>
          {url.replace(/^https?:\/\//, '')}
        </div>
        <button type="button" className={`d-btn${copied ? '' : ' primary'}`} style={{ width: 'auto', padding: '0 18px', flexShrink: 0 }} onClick={copy}>
          {copied ? 'Готово ✓' : 'Скопировать'}
        </button>
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <button type="button" className="d-btn" onClick={saveImage} disabled={saving || !logo} style={{ opacity: saving ? 0.6 : 1 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v12" /><path d="m7 10 5 5 5-5" /><path d="M5 21h14" /></svg>
          {saving ? 'Готовлю…' : 'Сохранить картинку'}
        </button>
        {canShare && (
          <button type="button" className="d-btn" onClick={() => navigator.share({ title, url }).catch(() => {})}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v13" /><path d="m7 8 5-5 5 5" /><path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7" /></svg>
            Отправить…
          </button>
        )}
      </div>
    </div>
  );
}

export default function ShareSheet({ title, subtitle, url, card, onClose, children }) {
  const stop = (e) => e.stopPropagation();
  return createPortal(
    <div onTouchStart={stop} onTouchMove={stop} onTouchEnd={stop} onClick={stop}>
      <div className="sheet-backdrop" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 520, animation: 'fadeIn 0.2s ease' }} onClick={onClose} />
      <div className="glass sheet-panel" style={{
        position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 430,
        borderRadius: '28px 28px 0 0', padding: '14px 22px 30px', zIndex: 521, maxHeight: '90dvh', overflowY: 'auto',
        animation: 'slideUp 0.35s cubic-bezier(0.34,1.26,0.64,1)',
      }}>
        <div className="sheet-handle" style={{ width: 36, height: 4, borderRadius: 2, margin: '0 auto 18px' }} />
        <div className="d-title">{title}</div>
        {subtitle && <div className="d-label" style={{ textAlign: 'center', marginTop: 6, lineHeight: '18px' }}>{subtitle}</div>}
        <div style={{ marginTop: 18 }}>
          {children}
          {url && <LinkBlock url={url} title={title} card={card} />}
        </div>
        <button type="button" className="d-btn ghost" style={{ marginTop: 10 }} onClick={onClose}>Закрыть</button>
      </div>
    </div>,
    document.body,
  );
}

// iOS-like switch in the app's colours
export function Switch({ on, onChange, label, hint }) {
  return (
    <div onClick={() => onChange(!on)} style={{ display: 'flex', alignItems: 'center', gap: 14, background: '#2C2C2C', borderRadius: 18, padding: '12px 14px 12px 16px', cursor: 'pointer' }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ color: '#fff', fontSize: 16, fontWeight: 700 }}>{label}</div>
        {hint && <div style={{ color: '#8E8E93', fontSize: 13, fontWeight: 600, marginTop: 2, lineHeight: '17px' }}>{hint}</div>}
      </div>
      <div style={{ width: 50, height: 30, borderRadius: 15, background: on ? '#351E88' : '#3A3A3C', position: 'relative', flexShrink: 0, transition: 'background 0.2s' }}>
        <div style={{ position: 'absolute', top: 3, left: on ? 23 : 3, width: 24, height: 24, borderRadius: '50%', background: '#fff', transition: 'left 0.2s cubic-bezier(0.32,0.72,0,1)', boxShadow: '0 2px 6px rgba(0,0,0,0.3)' }} />
      </div>
    </div>
  );
}
