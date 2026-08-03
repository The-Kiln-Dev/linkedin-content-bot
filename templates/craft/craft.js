/* Ink & Kiln craft kit — seeded hand-drawn SVG vocabulary.

   Every generator (carousel, info-card, freeform) pulls its hand-drawn
   structure from here so the whole system shares one hand. All geometry is
   seeded: the same (seed, args) always renders the same wobble, different
   seeds wobble differently. Never use Math.random() — renders must be
   reproducible per slide.

   Exports:
     rngFromString(seed)          → mulberry32 PRNG seeded from a string
     roughDefs()                  → SVG <defs> with displacement filters (inject once per page)
     grainCss()                   → CSS background-image data-URI for paper grain
     handLine(rng, x1,y1,x2,y2, opts)
     handArrow(rng, x1,y1,x2,y2, opts)     → curved connector + open head
     handCircle(rng, cx,cy,rx,ry, opts)    → open self-crossing loop
     handUnderline(rng, x,y,w, opts)       → 1–2 pass marker stroke
     handBox(rng, x,y,w,h, opts)           → rectangle, corners overshoot
     handBracket(rng, x,y,h, opts)         → left square bracket
     handAsterisk(rng, cx,cy,r, opts)
     handStar(rng, cx,cy,r, opts)          → 4-point sparkle
     handCheck(rng, x,y,s, opts)
     markerHighlight(rng, x,y,w,h, opts)   → translucent swipe behind text
     glazeDipPath(rng, w, depth, opts)     → wavy-bottom band path (top edge band)
     svg(w,h,inner,opts)                   → svg wrapper helper

   All draw functions return SVG markup strings (path/g elements) meant to be
   placed inside an <svg> that has roughDefs() injected. Stroke color defaults
   to var(--ink); pass opts.stroke to override.
*/

'use strict';

/* ---------- Seeded randomness ---------- */

function hashString(str) {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return h >>> 0;
}

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function rngFromString(seed) {
  return mulberry32(hashString(String(seed)));
}

/* ---------- Path machinery ---------- */

/* Subdivide a polyline and jitter each interior point perpendicular to its
   segment. amp is the max jitter in px. Returns array of points. */
function jitterPolyline(rng, pts, amp, step) {
  const out = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const [x1, y1] = pts[i];
    const [x2, y2] = pts[i + 1];
    const dx = x2 - x1, dy = y2 - y1;
    const len = Math.hypot(dx, dy) || 1;
    const n = Math.max(2, Math.round(len / step));
    const px = -dy / len, py = dx / len; // unit perpendicular
    for (let j = 0; j < n; j++) {
      const t = j / n;
      // ease jitter to 0 at endpoints of the whole polyline
      const globalT = (i + t) / (pts.length - 1);
      const edgeEase = Math.min(1, Math.min(globalT, 1 - globalT) * 6);
      const o = (rng() * 2 - 1) * amp * edgeEase;
      out.push([x1 + dx * t + px * o, y1 + dy * t + py * o]);
    }
  }
  out.push(pts[pts.length - 1]);
  return out;
}

/* Catmull-Rom → cubic bezier path string for smooth hand feel. */
function smoothPath(pts) {
  if (pts.length < 3) {
    return `M ${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)} L ${pts[pts.length - 1][0].toFixed(1)} ${pts[pts.length - 1][1].toFixed(1)}`;
  }
  let d = `M ${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C ${c1x.toFixed(1)} ${c1y.toFixed(1)}, ${c2x.toFixed(1)} ${c2y.toFixed(1)}, ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return d;
}

function strokeAttrs(opts) {
  const o = opts || {};
  const stroke = o.stroke || 'var(--ink)';
  const width = o.width != null ? o.width : 5;
  const opacity = o.opacity != null ? o.opacity : 1;
  const filter = o.filter === null ? '' : ` filter="url(#${o.filter || 'rough-fine'})"`;
  return `fill="none" stroke="${stroke}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round" opacity="${opacity}"${filter}`;
}

/* ---------- Vocabulary ---------- */

function handLine(rng, x1, y1, x2, y2, opts) {
  const o = opts || {};
  const amp = o.amp != null ? o.amp : 2.2;
  const pts = jitterPolyline(rng, [[x1, y1], [x2, y2]], amp, o.step || 26);
  let out = `<path d="${smoothPath(pts)}" ${strokeAttrs(o)}/>`;
  if (o.passes === 2) {
    const pts2 = jitterPolyline(rng, [[x1 + 2, y1 + 1.5], [x2 - 1, y2 + 1]], amp * 1.2, o.step || 26);
    out += `<path d="${smoothPath(pts2)}" ${strokeAttrs({ ...o, opacity: (o.opacity || 1) * 0.55 })}/>`;
  }
  return out;
}

function handArrow(rng, x1, y1, x2, y2, opts) {
  const o = opts || {};
  const dx = x2 - x1, dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 1;
  // bow the shaft: control point offset perpendicular by curve amount
  const curve = o.curve != null ? o.curve : (rng() * 2 - 1) * len * 0.18;
  const mx = x1 + dx / 2 - (dy / len) * curve;
  const my = y1 + dy / 2 + (dx / len) * curve;
  const shaftPts = jitterPolyline(rng, [[x1, y1], [mx, my], [x2, y2]], o.amp != null ? o.amp : 2, 24);
  let out = `<path d="${smoothPath(shaftPts)}" ${strokeAttrs(o)}/>`;
  // head: direction at the end ≈ from mid control to end
  const hx = x2 - mx, hy = y2 - my;
  const hlen = Math.hypot(hx, hy) || 1;
  const ux = hx / hlen, uy = hy / hlen;
  const size = o.head != null ? o.head : Math.max(14, Math.min(26, len * 0.12));
  const a = 0.5 + rng() * 0.15; // ~28-37deg
  const rot = (ux0, uy0, ang) => [ux0 * Math.cos(ang) - uy0 * Math.sin(ang), ux0 * Math.sin(ang) + uy0 * Math.cos(ang)];
  const [l1x, l1y] = rot(-ux, -uy, a);
  const [l2x, l2y] = rot(-ux, -uy, -a);
  out += `<path d="M ${(x2 + l1x * size).toFixed(1)} ${(y2 + l1y * size).toFixed(1)} L ${x2.toFixed(1)} ${y2.toFixed(1)} L ${(x2 + l2x * size).toFixed(1)} ${(y2 + l2y * size).toFixed(1)}" ${strokeAttrs(o)}/>`;
  return out;
}

function handCircle(rng, cx, cy, rx, ry, opts) {
  const o = opts || {};
  const start = rng() * Math.PI * 2;
  const total = Math.PI * 2 + 0.5 + rng() * 0.5; // overshoot: loop crosses itself
  const n = 34;
  const drift = (o.drift != null ? o.drift : 0.035);
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const a = start + t * total;
    const wob = 1 + (rng() * 2 - 1) * drift;
    // slight center drift over the stroke, like a hand not returning exactly
    const ddx = (t) * rx * 0.05 * (rng() > 0.5 ? 1 : -1) * 0.4;
    pts.push([cx + Math.cos(a) * rx * wob + ddx, cy + Math.sin(a) * ry * wob]);
  }
  return `<path d="${smoothPath(pts)}" ${strokeAttrs(o)}/>`;
}

function handUnderline(rng, x, y, w, opts) {
  const o = opts || {};
  const amp = o.amp != null ? o.amp : 3;
  let out = handLine(rng, x, y, x + w, y + (rng() * 2 - 1) * 3, { ...o, amp });
  if (o.passes !== 1) {
    out += handLine(rng, x + w * 0.03, y + 8, x + w * (0.86 + rng() * 0.12), y + 8 + (rng() * 2 - 1) * 3,
      { ...o, amp: amp * 1.1, width: (o.width || 5) * 0.85, opacity: (o.opacity || 1) * 0.8 });
  }
  return out;
}

function handBox(rng, x, y, w, h, opts) {
  const o = opts || {};
  const os = o.overshoot != null ? o.overshoot : 8; // px past each corner
  const amp = o.amp != null ? o.amp : 2.4;
  const seg = (x1, y1, x2, y2, ox1, oy1, ox2, oy2) =>
    handLine(rng, x1 + ox1, y1 + oy1, x2 + ox2, y2 + oy2, { ...o, amp });
  return [
    seg(x, y, x + w, y, -os * rng(), 0, os * rng(), 0),
    seg(x + w, y, x + w, y + h, 0, -os * rng(), 0, os * rng()),
    seg(x + w, y + h, x, y + h, os * rng(), 0, -os * rng(), 0),
    seg(x, y + h, x, y, 0, os * rng(), 0, -os * rng()),
  ].join('');
}

function handBracket(rng, x, y, h, opts) {
  const o = opts || {};
  const arm = o.arm != null ? o.arm : 18;
  const pts = jitterPolyline(rng, [[x + arm, y], [x, y + 4], [x, y + h - 4], [x + arm, y + h]], o.amp != null ? o.amp : 2, 22);
  return `<path d="${smoothPath(pts)}" ${strokeAttrs(o)}/>`;
}

function handAsterisk(rng, cx, cy, r, opts) {
  const o = opts || {};
  let out = '';
  const arms = 3;
  for (let i = 0; i < arms; i++) {
    const a = (Math.PI / arms) * i + (rng() * 2 - 1) * 0.12;
    const dx = Math.cos(a) * r, dy = Math.sin(a) * r;
    out += handLine(rng, cx - dx, cy - dy, cx + dx, cy + dy, { ...o, amp: 1.4 });
  }
  return out;
}

function handStar(rng, cx, cy, r, opts) {
  const o = opts || {};
  let out = '';
  const pairs = [[0, -r, 0, r * 0.32], [0, r, 0, -r * 0.32], [-r, 0, -r * 0.32, 0], [r, 0, r * 0.32, 0]];
  // 4-point sparkle: two crossing tapered strokes
  out += handLine(rng, cx, cy - r, cx, cy + r, { ...o, amp: 1.2 });
  out += handLine(rng, cx - r * 0.82, cy, cx + r * 0.82, cy, { ...o, amp: 1.2 });
  void pairs;
  return out;
}

function handCheck(rng, x, y, s, opts) {
  const o = opts || {};
  const pts = jitterPolyline(rng, [[x, y + s * 0.5], [x + s * 0.38, y + s * 0.92], [x + s, y]], o.amp != null ? o.amp : 1.6, 14);
  return `<path d="${smoothPath(pts)}" ${strokeAttrs(o)}/>`;
}

function markerHighlight(rng, x, y, w, h, opts) {
  const o = opts || {};
  const color = o.color || 'var(--accent)';
  const opacity = o.opacity != null ? o.opacity : 0.28;
  // swipe: a fat single stroke with wavering baseline, rounded ends
  const midY = y + h / 2;
  const pts = jitterPolyline(rng, [[x - 4, midY + (rng() * 2 - 1) * 3], [x + w + 6, midY + (rng() * 2 - 1) * 4]], 2.5, 30);
  return `<path d="${smoothPath(pts)}" fill="none" stroke="${color}" stroke-width="${h}" stroke-linecap="round" opacity="${opacity}" filter="url(#rough-bold)"/>`;
}

/* Glaze dip: a band anchored to the top edge of (0,0 → w), inner edge wavy.
   depth = average band thickness. Returns a closed path (fill with gradient). */
function glazeDipPath(rng, w, depth, opts) {
  const o = opts || {};
  const amp = o.amp != null ? o.amp : depth * 0.22;
  const n = o.waves != null ? o.waves : 7;
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const x = (w / n) * i;
    const y = depth + (rng() * 2 - 1) * amp;
    pts.push([x, y]);
  }
  const edge = jitterPolyline(rng, pts, 3, 40);
  let d = `M 0 0 L ${w} 0 L ${edge[edge.length - 1][0].toFixed(1)} ${edge[edge.length - 1][1].toFixed(1)}`;
  // walk the wavy edge right→left as smooth curve
  const rev = edge.slice().reverse();
  for (let i = 0; i < rev.length - 1; i++) {
    const p0 = rev[Math.max(0, i - 1)];
    const p1 = rev[i];
    const p2 = rev[i + 1];
    const p3 = rev[Math.min(rev.length - 1, i + 2)];
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C ${c1x.toFixed(1)} ${c1y.toFixed(1)}, ${c2x.toFixed(1)} ${c2y.toFixed(1)}, ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  d += ' Z';
  return d;
}

/* ---------- Page-level assets ---------- */

function roughDefs() {
  return `
    <filter id="rough-fine" x="-10%" y="-10%" width="120%" height="120%">
      <feTurbulence type="fractalNoise" baseFrequency="0.032 0.045" numOctaves="2" seed="11" result="n"/>
      <feDisplacementMap in="SourceGraphic" in2="n" scale="2.6" xChannelSelector="R" yChannelSelector="G"/>
    </filter>
    <filter id="rough-bold" x="-10%" y="-10%" width="120%" height="120%">
      <feTurbulence type="fractalNoise" baseFrequency="0.02 0.05" numOctaves="2" seed="4" result="n"/>
      <feDisplacementMap in="SourceGraphic" in2="n" scale="5.5" xChannelSelector="R" yChannelSelector="G"/>
    </filter>`;
}

/* Paper grain as data-URI SVG (feTurbulence noise → subtle dark speckle). */
function grainCss() {
  const svgStr = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="240">`,
    `<filter id="g"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="8" stitchTiles="stitch"/>`,
    `<feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0.6 0.6 0.6 0 0"/></filter>`,
    `<rect width="240" height="240" filter="url(#g)" opacity="0.55"/>`,
    `</svg>`,
  ].join('');
  return `url("data:image/svg+xml,${encodeURIComponent(svgStr)}")`;
}

function svg(w, h, inner, opts) {
  const o = opts || {};
  const cls = o.class ? ` class="${o.class}"` : '';
  const style = o.style ? ` style="${o.style}"` : '';
  return `<svg${cls}${style} width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg"><defs>${roughDefs()}</defs>${inner}</svg>`;
}

const CRAFT = {
  rngFromString,
  roughDefs,
  grainCss,
  svg,
  handLine,
  handArrow,
  handCircle,
  handUnderline,
  handBox,
  handBracket,
  handAsterisk,
  handStar,
  handCheck,
  markerHighlight,
  glazeDipPath,
};

/* Node (generators) and browser (freeform / animation compositions) */
if (typeof module !== 'undefined' && module.exports) module.exports = CRAFT;
if (typeof window !== 'undefined') window.Craft = CRAFT;
