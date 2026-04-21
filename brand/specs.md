# LinkedIn content specs

Canvas dimensions, file-size limits, and asset-resolution rules for everything we generate for LinkedIn. Applies to both the legacy and exploration brand directions.

**Two separate concerns to not confuse:**
1. **Canvas dimensions** — the size of the final exported image/video.
2. **Source asset resolution** — the pixel density of the doodles/logos we *place onto* the canvas.

A properly-sized canvas with underweight source assets still produces blurry output. Both have to be right.

---

## 1. Canvas dimensions (the final export)

### Feed images
| Format | Dimensions | Aspect | Notes |
|---|---|---|---|
| **Square** (default for us) | **1200×1200** | 1:1 | Safest all-around. LinkedIn will accept 1080×1080 and upscale, but native 1200×1200 is sharper. |
| **Vertical** | **1080×1350** | 4:5 | Best mobile engagement. Use for text-heavy statement cards or data cards. |
| Horizontal | 1200×627 | 1.91:1 | Only for link-preview-style images. Rarely our use case. |

**File format:** PNG for static images with sharp edges (our case). JPG only for photo-heavy content.
**Max file size:** 5MB per image. We should rarely exceed 1MB.
**Minimum dimensions LinkedIn accepts:** 400×400. Don't go near that floor.

### GIFs
- Same canvas dimensions as feed images (1200×1200 or 1080×1350).
- **Max file size:** 8MB.
- **Frame rate:** 15–30fps. Keep under 10 seconds of content.
- LinkedIn auto-loops them in-feed — design for that.

### Video
| Format | Dimensions | Aspect |
|---|---|---|
| **Square** (default for us) | **1080×1080** | 1:1 |
| **Vertical** (mobile-optimized) | **1080×1920** | 9:16 |
| Landscape | 1920×1080 | 16:9 |

- **File format:** MP4 (H.264 codec) preferred. MOV also accepted.
- **Frame rate:** 30fps. Don't exceed.
- **Length:** 3 seconds min, 10 min max. Practical sweet spot for feed engagement is 30–90 seconds.
- **Max file size:** 5GB. Practical target: keep under 200MB.
- **Audio:** AAC stereo.
- **Aspect range accepted:** 1:2.4 to 2.4:1.

### Carousel (document post)
- 1080×1080 or 1080×1350 per slide.
- Upload as PDF. Up to 300 pages.
- Each slide generates as a 1080×1080 or 1080×1350 image, then we assemble a PDF.

### Profile / company banners (less frequent)
- Personal profile cover: 1584×396.
- Company page cover: 1128×191.

---

## 2. Source asset resolution (the doodles, logos, icons we place)

**Rule of thumb:** source assets must be **at least 3× the display size in pixels**, to survive both CSS scaling and Retina/2x rendering.

Example: if a doodle is displayed at 120px wide on a 1080px canvas, the source PNG must be ≥ 360px wide.

### Status of current doodles (`brand/assets/doodles/`)

| Asset | Source dims | Status | Action |
|---|---|---|---|
| logos/kiln-mark-black.png | 370×400 | Borderline — fine at ~100px display | Re-export at 2× for headroom |
| doodles/burst-star.png | 280×267 | Borderline | Re-export at 2× |
| doodles/curl-cluster.png | 82×69 | **Too small** | **Re-export at 4×+** |
| doodles/squiggle-cluster.png | 60×74 | **Too small** | **Re-export at 4×+** |
| doodles/paper-airplane.png | 100×77 | **Too small** | **Re-export at 3×+** |
| doodles/envelope.png | 102×102 | **Too small** | **Re-export at 3×+** |
| doodles/cloud-blob.png | 102×102 | **Too small** | **Re-export at 3×+** |
| doodles/planet-ring.png | 102×102 | **Too small** | **Re-export at 3×+** |
| doodles/spiral.png | 102×102 | **Too small** | **Re-export at 3×+** |
| texture-topographic.png | 1080×1080 | Fine | — |

### Target source dimensions

For each doodle, we want source dimensions **at least as large as the widest we'd ever display it**, times 2 for Retina, times a small safety margin. In practice:

| Role on card | Typical display size | Minimum source size |
|---|---|---|
| Small corner accent | 80–120 px | **360×360** (3×) |
| Mid-size feature doodle | 160–240 px | **720×720** (3×) |
| Hero / large feature | 320–480 px | **1440×1440** (3×) |
| Full logo lockup | 200–300 px | **900×900** (3×) |

### How to re-export from Figma

1. Select the doodle layer.
2. In the right panel → **Export** section.
3. Add a PNG export, set to **3×** or **4×**.
4. Click "Export [N] layers."
5. Replace the existing file at the same path in `linkedin/brand/assets/doodles/`.

Same process for the logo. Save as `kiln-mark-black.png` and `kiln-lockup-black.png`, overwriting the existing low-res versions.

---

## 3. Canvas defaults for our templates

Unless a specific post calls for otherwise, render at these defaults:

| Content type | Canvas | Source asset min |
|---|---|---|
| Statement card (one big headline) | 1080×1080 or 1200×1200 | 3× rule above |
| Carousel slide | 1080×1350 (portrait) | 3× rule above |
| Quote / takeaway card | 1080×1080 | 3× rule above |
| CTA card | 1080×1080 | 3× rule above |
| Tools map / flowchart | 1200×1200 or 1080×1350 | 3× rule above |
| GIF (animated takeaway) | 1080×1080 | 3× rule above |
| Video (square cut) | 1080×1080 | native 1080p footage |

---

## 4. LinkedIn compression — things to anticipate

LinkedIn re-encodes uploads on their server. A few defensive moves:
- Export PNGs with lossless compression (no aggressive optimization). A 2MB sharp PNG will compress better than a pre-compressed 400KB PNG.
- Avoid thin 1px strokes — LinkedIn's JPG re-encode blurs them. Our doodles are already heavier-weight strokes, so this is mostly fine.
- For video, upload the highest quality you reasonably can; LinkedIn's encode will downsample to ~2–4 Mbps anyway, so giving it more to work with helps.
