# Vial image pipeline

Every product shows one of three studio vial photos, one per category color:

| File | Label | Used for |
|---|---|---|
| `public/vial/vial-repair.webp` | teal | Repair & Immune |
| `public/vial/vial-metabolic.webp` | navy | Metabolic & GH, plus bundles and supplies |
| `public/vial/vial-cognitive.webp` | maroon | Cognitive & Longevity, nasal |

The printed product name and size pill are erased from each photo. The real
name and size are laid over the label as live text by `components/Vial.tsx`,
so labels always match the catalog (including the RUO naming guard). Products
pick a photo through `accent` ("repair" | "metabolic" | "cognitive"), which
`data/products.ts` sets from the category.

To rebuild from new studio shots (2000×2000, same framing):

```bash
# needs playwright-core + Chromium (set CHROME_PATH if not the default)
node scripts/vial/build-vials.mjs repair=<teal.jpg> cognitive=<maroon.jpg> metabolic=<navy.jpg> [preview.png]
```

It finds each label, crops all three to the same box around it (746×1740),
erases the name and pill, and keys the backdrop to transparent. It also writes
`design/vial-blank-<tone>.jpg` (erased and cropped, backdrop intact). If
playwright-core is installed elsewhere, copy the script there and run it with
`REPO_ROOT=/path/to/repo/`.

Don't commit the source photos: they carry a placeholder product name.

If the framing changes, re-check the text positions (`.vp-name`, `.vp-opt`)
and the aspect ratio in `styles/shop.css`. The script prints where the printed
name and pill sat, as a percentage of the crop.
