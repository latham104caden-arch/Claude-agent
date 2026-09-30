# Vial image pipeline

Every product shows one of five studio photos:

| File | Photo | Used for |
|---|---|---|
| `public/vial/vial-repair.webp` | teal vial | Repair & Immune |
| `public/vial/vial-metabolic.webp` | navy vial | Metabolic & GH, bundles |
| `public/vial/vial-cognitive.webp` | maroon vial | Cognitive & Longevity |
| `public/vial/vial-supply.webp` | gray vial, dark print | Lab Supplies (Reconstitution Solution) |
| `public/vial/vial-nasal.webp` | maroon nasal spray bottle | Nasal Research |

The printed product name and size pill are erased from each photo. The real
name and size are laid over the label as live text by `components/Vial.tsx`,
so labels always match the catalog (including the RUO naming guard). Products
pick a photo through `accent`, which `data/products.ts` sets from the category.
Names longer than 16 characters go on two lines and the size pill moves down.

To rebuild from new studio shots (2000×2000, same framing; any subset of tones):

```bash
# needs playwright-core + Chromium (set CHROME_PATH if not the default)
node scripts/vial/build-vials.mjs repair=<teal.jpg> cognitive=<maroon.jpg> metabolic=<navy.jpg> \
  supply=<gray.jpg> nasal=<nasal.jpg> [preview.png]
```

It finds each label, erases the placeholder name and pill, cuts the product
out of the backdrop and crops everything to one 746×1740 box (vials anchored
to the label; the nasal bottle, a solid white shape on a near-white backdrop,
is traced from its shaded outline and scaled to stand like a vial). It also writes
`design/vial-blank-<tone>.jpg` (erased and cropped, backdrop intact). If
playwright-core is installed elsewhere, copy the script there and run it with
`REPO_ROOT=/path/to/repo/`.

Don't commit the source photos: they carry a placeholder product name.

If the framing changes, re-check the per-photo text positions
(`.vial-photo--<tone>` in `styles/shop.css`). The script prints where the
printed name and pill sat, as a percentage of the crop; `CALIB_DIR=<dir>`
saves the un-erased crops to compare against (don't commit those).
