/**
 * Product vial: a studio photo per category color (public/vial/vial-<tone>.webp,
 * blank name area, transparent background) with the product name and size set
 * as live text on the label. The label always matches the catalog (including
 * the RUO naming guard) because it is rendered from data, never baked into a
 * picture. All three photos share one crop (scripts/vial/build-vials.mjs), so
 * the text positions in styles/shop.css fit every color.
 *
 * Text is sized in container-query units (cqw) so it stays locked to the
 * label at every rendered size, from 18px thumbnails to the PDP stage.
 */
/** Label colors with a photo; anything else (bundles, supplies) uses navy. */
const TONES = new Set(["repair", "metabolic", "cognitive"]);
export const VIAL_SRC = "/vial/vial-metabolic.webp";

export function Vial({
  name,
  option,
  accent,
  className = "vial",
}: {
  name: string;
  option?: string;
  /** Label color: "repair" | "metabolic" | "cognitive". Unset = navy. */
  accent?: string;
  className?: string;
}) {
  const label = name.length > 16 ? name.split(" ")[0] : name;
  // Fit left of the vertical wordmark (~58% of the vial width; semibold sans ≈ 0.62em per glyph),
  // capped at the size the name is printed in the studio design.
  const size = Math.min(15, +(58 / (Math.max(label.length, 1) * 0.62)).toFixed(2));
  return (
    <span className={"vial-photo " + className} role="img" aria-label={`${name}${option ? " " + option : ""} research vial`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={accent && TONES.has(accent) ? `/vial/vial-${accent}.webp` : VIAL_SRC} alt="" width={746} height={1740} decoding="async" draggable={false} />
      <span className="vp-name" style={{ fontSize: `${size}cqw` }}>{label}</span>
      {option ? <span className="vp-opt">{option.replace(/\s+/g, "")}</span> : null}
    </span>
  );
}
