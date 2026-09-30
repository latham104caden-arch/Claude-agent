# Vial image pipeline

`public/vial/vial.webp` is the one product photo every product uses (slate
label design). The product name and size are live text laid over the blank
label by `components/Vial.tsx`, so labels always match the catalog.

To rebuild it from a new studio shot with the same framing (2000×2000):

```bash
# needs playwright-core + Chromium (set CHROME_PATH if not the default)
node scripts/vial/build-vial.mjs <photo.jpg> [preview.png]
```

It writes `design/vial-blank.jpg` (name/pill erased, cropped) and
`public/vial/vial.webp` (backdrop keyed to transparent). If playwright-core is
installed elsewhere, copy the script there and run it with
`REPO_ROOT=/path/to/repo/`.

The pixel boxes in the script's `CFG` are for the current photo. If the
framing changes, re-measure them and update the label text positions
(`.vp-name`, `.vp-opt`) and the aspect ratio in `styles/shop.css`.
