# The Kiln Brand — Two Directions

We maintain two parallel brand directions. Every piece of generated content picks exactly one.

## The binary switch

When generating a LinkedIn asset, specify one direction:

- **`legacy`** — the cleaner, content-forward, editorial direction. White backgrounds, bold sans-serif headlines, 3D illustrated icons, hand-drawn doodles as hero-scale elements. Author-attributed with the "Patrick + photo" badge on cover and CTA slides.
- **`exploration`** — the newer atmospheric direction. Gradient borders with topographic texture, Lora italic serif headlines, hand-drawn monoline doodles as small accents, cream inner panels.

## Default direction by format

Unless overridden, each asset type defaults to one direction:

| Format | Default direction | Rationale |
|---|---|---|
| Statement card (single big headline) | `exploration` | Atmospheric single-message formats benefit from the gradient treatment |
| Quote card | `exploration` | Same |
| CTA card (standalone) | `exploration` | Same |
| **Info-card** (single dense multi-section image) | **`exploration`** | Pattern lists / benchmarks / data overviews stay on-brand with the gradient frame + Fraunces italic-emphasis treatment |
| **Carousel** (multi-slide document) | **`exploration`** | Italic-emphasis carries Patrick's voice more deliberately than the legacy bold-sans treatment; gradient frame creates a cohesive swipe-through signature. Legacy carousel is still available as an alternate. |
| Banner (profile / feed hero) | `legacy` | Clean, not overpowering |
| Tool / process diagrams | `legacy` | Utility-first |
| Branded GIF / video | direction of the matching static | Match the format family |

If you explicitly say "make the carousel in the exploration direction," I override — but defaults above are the norm.

## Folder layout

```
brand/
├── README.md                   ← this file
├── specs.md                    ← LinkedIn canvas dims + resolution rules (applies to both)
├── brand-legacy.md             ← legacy direction guide
├── brand-exploration.md        ← exploration direction guide
├── colors-legacy.json          ← legacy color tokens
├── colors-exploration.json     ← exploration color tokens + 5 gradient variants
└── assets/
    ├── legacy/
    │   ├── manifest.md
    │   ├── logos/              ← shared identity (duplicated from exploration)
    │   ├── icons-3d/           ← Fluent 3D-style illustrated icons (licensed)
    │   ├── doodles/            ← hand-drawn accents used in carousels
    │   └── people/             ← author-attribution photos (e.g., Patrick)
    └── exploration/
        ├── manifest.md
        ├── logos/              ← shared identity
        ├── doodles/            ← hand-drawn monoline accents (10 files)
        └── texture-topographic.png
```

## Templates are also direction-split

```
templates/
├── exploration/                (default direction)
│   ├── carousel/               ← multi-slide carousel generator (PNG)
│   ├── info-card/              ← single dense info-card generator (PNG)
│   └── card-statement.html     ← statement card (static HTML prototype)
└── legacy/                     (alternate direction)
    └── carousel/               ← editorial b&w carousel generator (PNG)
```

## Rules for me (Claude) when generating

1. **Pick one direction per asset.** Never mix legacy and exploration in the same output.
2. **Only use assets from the matching direction folder.** Don't pull a doodle from `exploration/` into a legacy template even if it seems to fit — ask first.
3. **Logos are shared.** Both direction folders contain the same logo files; use whichever path matches the template's direction.
4. **Author attribution (Patrick + photo) is legacy-only.** Never add it to exploration assets.
5. When unsure which direction fits a new format we haven't built yet, ask.
