# Vial image pipeline

`public/vial/vial.webp` is the one product photo every product uses. The name
and size are live text laid over the blank label by `components/Vial.tsx`.

To regenerate it from a new studio shot (same framing as the original):

```bash
# needs playwright-core + Chromium (see CLAUDE.md for the local browser path)
node scripts/vial/blank-vial.mjs <photo.jpg> design/vial-blank.jpg      # erase name + size pill, crop
node scripts/vial/alpha-vial.mjs design/vial-blank.jpg public/vial/vial.webp preview.png  # white → transparent
```

The pixel boxes in both scripts (erase area, crop, label/cap/crimp zones) are
for the original photo. If the framing changes, re-measure them and update the
label text positions (`.vp-name`, `.vp-opt`) in `styles/shop.css`.
