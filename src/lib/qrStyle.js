import QRCode from 'qrcode';

/**
 * Dori-styled QR codes as SVG strings. The code is built with the highest error
 * correction (H, ~30%) so a logo in the middle doesn't break scanning.
 *   style 'dots'   — round dots, purple rounded "eyes"
 *   style 'purple' — purple gradient dots, white eyes
 *   style 'liquid' — connected rounded modules, purple eyes
 */
// logoRound — the logo is a person's avatar: shown as a circle
export function styledQr(text, { style = 'dots', logo = null, logoRound = false, size = 300 } = {}) {
  const qr = QRCode.create(text, { errorCorrectionLevel: 'H' });
  const n = qr.modules.size;
  const at = (x, y) => x >= 0 && y >= 0 && x < n && y < n && qr.modules.get(y, x);
  const m = size / n;
  const inEye = (x, y) => (x < 7 && y < 7) || (x >= n - 7 && y < 7) || (x < 7 && y >= n - 7);
  // empty square in the middle for the logo (≈ 22% of the side)
  const hole = logo ? Math.ceil(n * 0.22) | 1 : 0;
  const h0 = Math.floor((n - hole) / 2);
  const inHole = (x, y) => logo && x >= h0 - 1 && x < h0 + hole + 1 && y >= h0 - 1 && y < h0 + hole + 1;

  const dotFill = style === 'purple' ? 'url(#dg)' : '#fff';
  const eyeOuter = style === 'purple' ? '#fff' : '#7B5CFF';
  const eyeInner = style === 'purple' ? '#fff' : '#fff';
  let body = '';

  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    if (!at(x, y) || inEye(x, y) || inHole(x, y)) continue;
    const cx = (x + 0.5) * m, cy = (y + 0.5) * m;
    if (style === 'liquid') {
      // rounded tile; corners next to a neighbour are square so modules flow together
      const r = m * 0.5;
      const tl = at(x - 1, y) || at(x, y - 1) ? 0 : r, tr = at(x + 1, y) || at(x, y - 1) ? 0 : r;
      const br = at(x + 1, y) || at(x, y + 1) ? 0 : r, bl = at(x - 1, y) || at(x, y + 1) ? 0 : r;
      const X = x * m, Y = y * m, W = m + Math.max(0.6, m * 0.08); // overlap a bit so no hairline seams show
      body += `<path d="M${X + tl},${Y}H${X + W - tr}${tr ? `A${tr},${tr} 0 0 1 ${X + W},${Y + tr}` : ''}V${Y + W - br}${br ? `A${br},${br} 0 0 1 ${X + W - br},${Y + W}` : ''}H${X + bl}${bl ? `A${bl},${bl} 0 0 1 ${X},${Y + W - bl}` : ''}V${Y + tl}${tl ? `A${tl},${tl} 0 0 1 ${X + tl},${Y}` : ''}Z" fill="${dotFill}"/>`;
    } else {
      body += `<circle cx="${cx.toFixed(2)}" cy="${cy.toFixed(2)}" r="${(m * 0.42).toFixed(2)}" fill="${dotFill}"/>`;
    }
  }

  const eye = (ex, ey) => {
    const X = ex * m, Y = ey * m, s7 = 7 * m, s3 = 3 * m;
    return `<rect x="${X + m * 0.5}" y="${Y + m * 0.5}" width="${s7 - m}" height="${s7 - m}" rx="${m * 2}" fill="none" stroke="${eyeOuter}" stroke-width="${m}"/>`
      + `<rect x="${X + 2 * m}" y="${Y + 2 * m}" width="${s3}" height="${s3}" rx="${m * 1.1}" fill="${eyeInner}"/>`;
  };
  body += eye(0, 0) + eye(n - 7, 0) + eye(0, n - 7);

  if (logo) {
    const L = hole * m, X = h0 * m, Y = h0 * m;
    if (logoRound) {
      const c = X + L / 2, r = L / 2;
      body += `<circle cx="${c}" cy="${Y + L / 2}" r="${r + m * 0.7}" fill="#171717"/>`
        + `<clipPath id="lc"><circle cx="${c}" cy="${Y + L / 2}" r="${r}"/></clipPath>`
        + `<image href="${logo}" x="${X}" y="${Y}" width="${L}" height="${L}" preserveAspectRatio="xMidYMid slice" clip-path="url(#lc)"/>`;
    } else {
      body += `<rect x="${X - m * 0.6}" y="${Y - m * 0.6}" width="${L + m * 1.2}" height="${L + m * 1.2}" rx="${m * 2.4}" fill="#171717"/>`
        + `<image href="${logo}" x="${X}" y="${Y}" width="${L}" height="${L}" preserveAspectRatio="xMidYMid meet"/>`;
    }
  }

  const defs = '<defs><linearGradient id="dg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#9B7BFF"/><stop offset="1" stop-color="#4B2DC0"/></linearGradient></defs>';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="100%" height="100%">${defs}${body}</svg>`;
}

const esc = (t) => String(t || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/**
 * The whole share card as one SVG (for "Сохранить картинку"): dark card with a purple
 * glow, the QR code with the avatar in the middle, the name and a caption.
 * logo must be a data: URL — an SVG drawn into a canvas can't load other files.
 */
export function qrCardSvg({ url, logo, logoRound, title, caption, w = 1080, h = 1350 }) {
  const q = 760, qx = (w - q) / 2, qy = 170;
  const qr = styledQr(url, { style: 'liquid', logo, logoRound, size: q })
    .replace('<svg ', `<svg x="${qx}" y="${qy}" width="${q}" height="${q}" `).replace(/ width="100%" height="100%"/, '');
  const font = "-apple-system, 'SF Pro Display', 'Helvetica Neue', Arial, sans-serif";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
<defs><radialGradient id="bg" cx="50%" cy="40%" r="62%"><stop offset="0" stop-color="#2a1a66"/><stop offset="1" stop-color="#0b0b0d"/></radialGradient></defs>
<rect width="${w}" height="${h}" fill="url(#bg)"/>
${qr}
<text x="${w / 2}" y="${qy + q + 130}" text-anchor="middle" font-family="${font}" font-size="68" font-weight="800" fill="#fff">${esc(title)}</text>
<text x="${w / 2}" y="${qy + q + 195}" text-anchor="middle" font-family="${font}" font-size="34" font-weight="700" fill="#8E8E93">${esc(caption)}</text>
<text x="${w / 2}" y="${h - 60}" text-anchor="middle" font-family="${font}" font-size="40" font-weight="800" fill="#ffffff" fill-opacity="0.35">Dori</text>
</svg>`;
}

// Avatar cut to a square the same way the app shows it (its crop), as a data URL
export function squareImage(src, pos, size = 256) {
  return new Promise((resolve) => {
    if (!src) return resolve(null);
    const img = new Image();
    img.onload = () => {
      const p = pos || { x: 0.5, y: 0.5, scale: 1 };
      const s = Math.max(size / img.naturalWidth, size / img.naturalHeight) * (p.scale || 1);
      const w = img.naturalWidth * s, h = img.naturalHeight * s;
      const left = Math.min(0, Math.max(size - w, size / 2 - (p.x ?? 0.5) * w));
      const top = Math.min(0, Math.max(size - h, size / 2 - (p.y ?? 0.5) * h));
      const c = document.createElement('canvas'); c.width = c.height = size;
      c.getContext('2d').drawImage(img, left, top, w, h);
      resolve(c.toDataURL('image/jpeg', 0.9));
    };
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

export async function fileToDataUrl(path) {
  const blob = await (await fetch(path)).blob();
  return new Promise((r) => { const fr = new FileReader(); fr.onload = () => r(fr.result); fr.readAsDataURL(blob); });
}

// Rasterise an SVG string into a PNG blob
export function svgToPng(svg, w, h) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement('canvas'); c.width = w; c.height = h;
      c.getContext('2d').drawImage(img, 0, 0, w, h);
      c.toBlob((b) => (b ? resolve(b) : reject(new Error('PNG failed'))), 'image/png');
    };
    img.onerror = () => reject(new Error('SVG failed'));
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  });
}
