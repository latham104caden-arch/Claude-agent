# Vial labels

`build-labels.mjs` renders one flat label PNG per peptide (no vial) into
`design/labels/<category>/`, plus an `overview-<category>.png` sheet per
category.

- Size: 1.75 in × 0.75 in, 1050×450 px at 600 dpi (DPI is stamped in the file).
- Category = label color: teal Repair & Immune, navy Metabolic & GH,
  maroon Cognitive & Longevity.
- Strengths are placeholders until the real lineup is confirmed; edit the
  `CATEGORIES` list and re-run.
- Names in `data/ruo-banned.json` are refused.
- No bleed is included. Add it if the printer asks for it.

```bash
# needs playwright-core + Chromium (CHROME_PATH to override)
node scripts/labels/build-labels.mjs
```
If playwright-core lives elsewhere, copy the script there and run it with
`REPO_ROOT=/path/to/repo/`.
