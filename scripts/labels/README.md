# Vial labels

`build-labels.mjs` renders one flat label PNG per product per size (no vial)
into `design/labels/<category>/<slug>-<size>.png`, plus an
`overview-<category>.png` sheet per category. Products, sizes and colors come
from the live catalog (`lib/catalog.ts`); bundles are skipped.

- Size: 1.75 in × 0.75 in, 1050×450 px at 600 dpi (DPI is stamped in the file).
- Label color follows the product's vial on the site (`accent`): teal Repair
  & Immune, navy Metabolic & GH, maroon Cognitive & Longevity and Nasal,
  white with dark print for Lab Supplies.
- Names too long for one line wrap to two, like the site.
- Names in `data/ruo-banned.json` are refused.
- No bleed is included. Add it if the printer asks for it.

```bash
# needs playwright-core + Chromium (CHROME_PATH to override)
node scripts/labels/build-labels.mjs
```
If playwright-core lives elsewhere, copy the script there and run it with
`REPO_ROOT=/path/to/repo/`.
