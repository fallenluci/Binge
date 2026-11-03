import QRCode from 'qrcode';

/**
 * Dori-styled QR codes as SVG strings. The code is built with the highest error
 * correction (H, ~30%) so a logo in the middle doesn't break scanning.
 *   style 'dots'   — round dots, purple rounded "eyes"
 *   style 'purple' — purple gradient dots, white eyes
 *   style 'liquid' — connected rounded modules, purple eyes
 */
export function styledQr(text, { style = 'dots', logo = null, size = 300 } = {}) {
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
      const X = x * m, Y = y * m, W = m + 0.4;
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
    body += `<rect x="${X - m * 0.6}" y="${Y - m * 0.6}" width="${L + m * 1.2}" height="${L + m * 1.2}" rx="${m * 2.4}" fill="#171717"/>`
      + `<image href="${logo}" x="${X}" y="${Y}" width="${L}" height="${L}" preserveAspectRatio="xMidYMid meet"/>`;
  }

  const defs = '<defs><linearGradient id="dg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#9B7BFF"/><stop offset="1" stop-color="#4B2DC0"/></linearGradient></defs>';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="100%" height="100%">${defs}${body}</svg>`;
}
