/*
 * Layout primitives for freeform thematic compositions.
 *
 * Problem this solves: hand-placing text inside non-rectangular shapes (circles,
 * lens/Venn regions, trapezoids) always fails because the shape's width varies
 * with Y. Text anchored at a fixed (x, y) overflows the shape at certain rows.
 *
 * Solution: model every shape, compute its bounds at each row of text, place
 * text at the row's true center, then validate that the rendered bbox fits.
 *
 * Usage:
 *   const left  = new Layout.Circle(350, 470, 235);
 *   const right = new Layout.Circle(630, 470, 235);
 *   const leftPocket  = new Layout.Pocket(left, [right]);
 *   const rightPocket = new Layout.Pocket(right, [left]);
 *   const lens        = new Layout.Intersection(left, right);
 *
 *   Layout.placeText(svgRoot, leftPocket, [
 *     "Tech-stack lookups", "Bulk enrichment", "CRM write-back"
 *   ], { centerY: 470, lineHeight: 38, fontSize: 14, fontWeight: 700 });
 *
 *   Layout.validate(); // logs any overflows found
 *
 * Call Layout.placeText BEFORE the snapshot fires (synchronously at DOM-ready).
 * Call Layout.validate() at the end to print a report.
 */

(function (global) {
  'use strict';

  const SVG_NS = 'http://www.w3.org/2000/svg';

  /** ===== Shapes =====
   *  Each shape exposes:
   *    boundsAtY(y) → { left, right, center, width } | null
   *    contains(x, y) → boolean (optional, used by validate)
   *
   *  All coordinates are in the shape's containing SVG viewBox space.
   */

  class Circle {
    constructor(cx, cy, r) { this.cx = cx; this.cy = cy; this.r = r; }
    boundsAtY(y) {
      const dy = y - this.cy;
      if (Math.abs(dy) >= this.r) return null;
      const halfWidth = Math.sqrt(this.r * this.r - dy * dy);
      const left = this.cx - halfWidth;
      const right = this.cx + halfWidth;
      return { left, right, center: this.cx, width: 2 * halfWidth };
    }
    contains(x, y) {
      const dx = x - this.cx, dy = y - this.cy;
      return dx * dx + dy * dy <= this.r * this.r;
    }
  }

  /** Pocket = inside `inside` AND outside all `outside` shapes.
   *  Used for Venn-style non-overlap regions. */
  class Pocket {
    constructor(inside, outside) {
      this.inside = inside;
      this.outside = outside || [];
    }
    boundsAtY(y) {
      let b = this.inside.boundsAtY(y);
      if (!b) return null;
      let left = b.left, right = b.right;
      for (const shape of this.outside) {
        const sb = shape.boundsAtY(y);
        if (!sb) continue;
        // If outside shape doesn't intersect the current bounds, no change
        if (sb.right <= left || sb.left >= right) continue;
        // If outside shape fully covers current bounds, region is empty at this y
        if (sb.left <= left && sb.right >= right) return null;
        // Outside shape covers the left part
        if (sb.left <= left && sb.right < right) {
          left = sb.right;
        }
        // Outside shape covers the right part
        else if (sb.left > left && sb.right >= right) {
          right = sb.left;
        }
        // Outside shape is strictly in the middle — pick the bigger remaining slice
        else if (sb.left > left && sb.right < right) {
          const leftSlice  = sb.left - left;
          const rightSlice = right - sb.right;
          if (leftSlice >= rightSlice) { right = sb.left; }
          else { left = sb.right; }
        }
      }
      return { left, right, center: (left + right) / 2, width: right - left };
    }
    contains(x, y) {
      if (!this.inside.contains || !this.inside.contains(x, y)) return false;
      for (const shape of this.outside) {
        if (shape.contains && shape.contains(x, y)) return false;
      }
      return true;
    }
  }

  /** Intersection = inside ALL of `shapes`.
   *  Used for the lens region of two circles (the overlap in a Venn). */
  class Intersection {
    constructor(...shapes) { this.shapes = shapes; }
    boundsAtY(y) {
      let left = -Infinity, right = Infinity;
      for (const shape of this.shapes) {
        const b = shape.boundsAtY(y);
        if (!b) return null;
        left = Math.max(left, b.left);
        right = Math.min(right, b.right);
      }
      if (right <= left) return null;
      return { left, right, center: (left + right) / 2, width: right - left };
    }
    contains(x, y) {
      return this.shapes.every(s => s.contains && s.contains(x, y));
    }
  }

  /** Trapezoid = polygon with 4 vertices (top-left, top-right, bottom-right, bottom-left).
   *  Used for pyramid layers. Assumes vertical top/bottom edges (y-aligned).
   *  Specifically: top edge at y = topY (between topLeftX and topRightX),
   *                bottom edge at y = botY (between botLeftX and botRightX).
   *  Sides are straight lines interpolated linearly. */
  class Trapezoid {
    constructor(opts) {
      // opts: { topY, botY, topLeftX, topRightX, botLeftX, botRightX }
      Object.assign(this, opts);
    }
    boundsAtY(y) {
      if (y < this.topY || y > this.botY) return null;
      const t = (y - this.topY) / (this.botY - this.topY);
      const left  = this.topLeftX  + t * (this.botLeftX  - this.topLeftX);
      const right = this.topRightX + t * (this.botRightX - this.topRightX);
      return { left, right, center: (left + right) / 2, width: right - left };
    }
    contains(x, y) {
      const b = this.boundsAtY(y);
      return b !== null && x >= b.left && x <= b.right;
    }
  }

  /** Rectangle. */
  class Rect {
    constructor(x, y, w, h) { this.x = x; this.y = y; this.w = w; this.h = h; }
    boundsAtY(y) {
      if (y < this.y || y > this.y + this.h) return null;
      return { left: this.x, right: this.x + this.w, center: this.x + this.w / 2, width: this.w };
    }
    contains(x, y) {
      return x >= this.x && x <= this.x + this.w && y >= this.y && y <= this.y + this.h;
    }
  }

  /** Sector (pie slice) of a circle from angle a1 to a2 (radians).
   *  Used for radial / hub-and-spoke layouts. */
  class Sector {
    constructor(cx, cy, r, a1, a2) {
      this.cx = cx; this.cy = cy; this.r = r;
      this.a1 = a1; this.a2 = a2;
    }
    boundsAtY(y) {
      // Approximation: the sector's bounds at y = intersection of circle at y AND angular wedge
      // For simple use cases (e.g., radial label placement) this is rarely needed,
      // so we return the bounding box of the angular extent at y.
      const circle = new Circle(this.cx, this.cy, this.r);
      const cb = circle.boundsAtY(y);
      if (!cb) return null;
      // For now treat as the full chord; refine if needed.
      return cb;
    }
    contains(x, y) {
      const dx = x - this.cx, dy = y - this.cy;
      const inRadius = dx * dx + dy * dy <= this.r * this.r;
      if (!inRadius) return false;
      const ang = Math.atan2(dy, dx);
      const norm = (a) => ((a % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
      const aa = norm(ang), a1 = norm(this.a1), a2 = norm(this.a2);
      return a1 <= a2 ? (aa >= a1 && aa <= a2) : (aa >= a1 || aa <= a2);
    }
  }

  /** ===== Validation registry =====
   *  Every placeText call registers each text element with its containing shape.
   *  validate() iterates the registry and checks each rendered bbox fits.
   */
  const registry = [];

  function approxTextWidth(line, fontSize) {
    // Rough approximation when getBBox() isn't available (off-DOM).
    // Inter at 14px: avg char width ≈ 7.5px for sentence-case body text.
    const charWidthRatio = 0.55;
    return line.length * fontSize * charWidthRatio;
  }

  function measureText(svgRoot, text, fontFamily, fontSize, fontWeight) {
    // Use a hidden <text> in the SVG to get a real bbox.
    const t = document.createElementNS(SVG_NS, 'text');
    t.setAttribute('font-family', fontFamily);
    t.setAttribute('font-size', fontSize);
    t.setAttribute('font-weight', fontWeight);
    t.style.visibility = 'hidden';
    t.textContent = text;
    svgRoot.appendChild(t);
    let w = 0;
    try { w = t.getBBox().width; } catch (e) { w = approxTextWidth(text, fontSize); }
    svgRoot.removeChild(t);
    return w;
  }

  /** Place an array of text lines inside `shape`, vertically centered around `centerY`.
   *  Each line is anchored at the shape's center for its row.
   *  Returns the array of created <text> elements. */
  function placeText(svgRoot, shape, lines, opts) {
    opts = opts || {};
    const {
      centerY      = 0,
      lineHeight   = 22,
      padding      = 12,
      fontFamily   = 'Inter, sans-serif',
      fontSize     = 14,
      fontWeight   = 700,
      textAnchor   = 'middle',
      fill         = '#0a0a0a',
      letterSpacing = '0',
      group        = null,        // optional <g> parent; defaults to svgRoot
      label        = null,        // optional label for validation reports
    } = opts;

    const parent = group || svgRoot;
    const totalH = (lines.length - 1) * lineHeight;
    const startY = centerY - totalH / 2;
    const created = [];

    lines.forEach((line, i) => {
      const y = startY + i * lineHeight;
      const bounds = shape.boundsAtY(y);
      if (!bounds) {
        console.warn(`[layout] line ${i} ("${line}") cannot be placed at y=${y} — region empty`);
        return;
      }
      const w = measureText(svgRoot, line, fontFamily, fontSize, fontWeight);
      const availableWidth = bounds.width - 2 * padding;
      if (w > availableWidth) {
        console.warn(
          `[layout] OVERFLOW: line ${i} ("${line}") width ${w.toFixed(1)}px > available ${availableWidth.toFixed(1)}px ` +
          `at y=${y} in region [${bounds.left.toFixed(1)}, ${bounds.right.toFixed(1)}]` +
          (label ? ` of shape "${label}"` : '')
        );
      }
      const t = document.createElementNS(SVG_NS, 'text');
      t.setAttribute('x', bounds.center);
      t.setAttribute('y', y);
      t.setAttribute('text-anchor', textAnchor);
      t.setAttribute('font-family', fontFamily);
      t.setAttribute('font-size', fontSize);
      t.setAttribute('font-weight', fontWeight);
      t.setAttribute('fill', fill);
      if (letterSpacing !== '0') t.setAttribute('letter-spacing', letterSpacing);
      t.textContent = line;
      parent.appendChild(t);

      registry.push({ el: t, shape, line, y, label });
      created.push(t);
    });

    return created;
  }

  /** Place a single text element. Same as placeText with one line. */
  function placeLine(svgRoot, shape, line, opts) {
    return placeText(svgRoot, shape, [line], opts)[0];
  }

  /** After all placement, iterate the registry and confirm each text's rendered
   *  bbox fits inside its shape's bounds at that y. Logs warnings for overflows.
   *  Returns { placed, overflows, details } where details is an array of every
   *  text element's check result (useful for debug overlay rendering). */
  /** Validate placed text fits its shape.
   *  opts.margin: tolerance for strict mathematical overflow (default 0.5px)
   *  opts.aestheticPadding: minimum visual breathing room required between
   *      text edge and shape edge (default 0; pass e.g. 18 to flag text
   *      that fits the curve but visually crowds it).
   *  Returns { placed, overflows, details }. */
  function validate(opts) {
    opts = opts || {};
    const margin = opts.margin || 0.5;
    const aestheticPadding = opts.aestheticPadding || 0;
    const details = [];
    let overflows = 0;
    for (const entry of registry) {
      try {
        const bbox = entry.el.getBBox();
        const bounds = entry.shape.boundsAtY(entry.y);
        if (!bounds) {
          details.push({ ...entry, status: 'no-bounds', bbox });
          overflows++;
          console.warn(`[layout-validate] "${entry.line}" — no bounds at y=${entry.y}`);
          continue;
        }
        const leftEdge  = bbox.x;
        const rightEdge = bbox.x + bbox.width;
        // Hard math overflow
        const leftOverHard  = leftEdge  < bounds.left  - margin;
        const rightOverHard = rightEdge > bounds.right + margin;
        // Aesthetic crowding (within padding distance of the edge)
        const leftCrowd  = leftEdge  < bounds.left  + aestheticPadding;
        const rightCrowd = rightEdge > bounds.right - aestheticPadding;
        const leftOver  = leftOverHard  || leftCrowd;
        const rightOver = rightOverHard || rightCrowd;
        const overflow  = leftOver || rightOver;
        const slack = {
          left:  leftEdge  - bounds.left,
          right: bounds.right - rightEdge,
        };
        details.push({
          line: entry.line, label: entry.label, y: entry.y,
          bbox: { x: leftEdge, width: bbox.width, right: rightEdge },
          bounds, overflow, leftOver, rightOver, leftOverHard, rightOverHard, slack,
        });
        if (overflow) {
          overflows++;
          console.warn(
            `[layout-validate] ${leftOverHard||rightOverHard ? 'OVERFLOW' : 'CROWDING'}: "${entry.line}"` +
            (entry.label ? ` (in ${entry.label})` : '') +
            ` rendered at [${leftEdge.toFixed(1)}, ${rightEdge.toFixed(1)}]` +
            ` slack [L:${slack.left.toFixed(1)}, R:${slack.right.toFixed(1)}]` +
            ` (need ${aestheticPadding}px)`
          );
        }
      } catch (e) {
        // getBBox can fail off-DOM; skip silently
      }
    }
    console.log(`[layout-validate] ${registry.length} text elements checked, ${overflows} overflows (aestheticPadding=${aestheticPadding}px)`);
    return { placed: registry.length, overflows, details };
  }

  /** Render a debug overlay into the given SVG: dashed rectangles for each
   *  placed text's bbox (green if it fits its shape, red if it overflows).
   *  Use during development to verify placement visually in the snapshot. */
  function drawDebug(svgRoot, opts) {
    const result = validate(opts);
    for (const d of result.details) {
      if (!d.bounds || !d.bbox) continue;
      const r = document.createElementNS(SVG_NS, 'rect');
      r.setAttribute('x', d.bbox.x);
      r.setAttribute('y', d.y - 14);
      r.setAttribute('width',  d.bbox.width);
      r.setAttribute('height', 18);
      r.setAttribute('fill', 'none');
      r.setAttribute('stroke', d.overflow ? '#ef4444' : '#10b981');
      r.setAttribute('stroke-width', '1');
      r.setAttribute('stroke-dasharray', '2 2');
      svgRoot.appendChild(r);

      // Also draw the shape bounds at this y as a thicker line
      const line = document.createElementNS(SVG_NS, 'line');
      line.setAttribute('x1', d.bounds.left);
      line.setAttribute('y1', d.y + 6);
      line.setAttribute('x2', d.bounds.right);
      line.setAttribute('y2', d.y + 6);
      line.setAttribute('stroke', d.overflow ? '#ef4444' : '#10b981');
      line.setAttribute('stroke-width', '1.5');
      line.setAttribute('opacity', '0.5');
      svgRoot.appendChild(line);
    }
    // Summary + list of overflows — drawn LARGE on a white panel so it's
    // readable in the snapshot. Comment out drawDebug for production renders.
    const panel = document.createElementNS(SVG_NS, 'rect');
    panel.setAttribute('x', 0);
    panel.setAttribute('y', 0);
    panel.setAttribute('width', 980);
    panel.setAttribute('height', 14 + 30 + result.details.filter(d => d.overflow).length * 26);
    panel.setAttribute('fill', '#ffffff');
    panel.setAttribute('opacity', '0.95');
    svgRoot.insertBefore(panel, svgRoot.firstChild);

    const t = document.createElementNS(SVG_NS, 'text');
    t.setAttribute('x', 12);
    t.setAttribute('y', 30);
    t.setAttribute('font-family', 'monospace');
    t.setAttribute('font-size', '20');
    t.setAttribute('font-weight', '700');
    t.setAttribute('fill', result.overflows > 0 ? '#ef4444' : '#10b981');
    t.textContent = `[layout debug] ${result.placed} placed, ${result.overflows} overflow`;
    svgRoot.appendChild(t);

    let row = 0;
    for (const d of result.details) {
      if (!d.overflow) continue;
      const l = document.createElementNS(SVG_NS, 'text');
      l.setAttribute('x', 12);
      l.setAttribute('y', 56 + row * 26);
      l.setAttribute('font-family', 'monospace');
      l.setAttribute('font-size', '17');
      l.setAttribute('fill', '#ef4444');
      const dir = d.leftOver && d.rightOver ? 'BOTH' : (d.leftOver ? 'LEFT' : 'RIGHT');
      const overshoot = d.leftOver
        ? (d.bounds.left - d.bbox.x).toFixed(0)
        : (d.bbox.right - d.bounds.right).toFixed(0);
      l.textContent = `${dir} +${overshoot}px @y${d.y}: "${d.line.slice(0, 36)}"`;
      svgRoot.appendChild(l);
      row++;
    }
    return result;
  }

  function clearRegistry() { registry.length = 0; }

  global.Layout = {
    Circle, Pocket, Intersection, Trapezoid, Rect, Sector,
    placeText, placeLine, validate, drawDebug, clearRegistry, registry,
  };
})(typeof window !== 'undefined' ? window : globalThis);
