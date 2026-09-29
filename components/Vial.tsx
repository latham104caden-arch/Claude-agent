/**
 * Product vial: the studio photo (public/vial/vial.webp — blank label,
 * transparent background) with the product name and size set as live text on
 * the label. One image serves every product, and the label always matches the
 * catalog (including the RUO naming guard) because it is rendered from data,
 * never baked into a picture.
 *
 * Text is sized in container-query units (cqw) so it stays locked to the
 * label at every rendered size, from 18px thumbnails to the PDP stage.
 */
export const VIAL_SRC = "/vial/vial.webp";

export function Vial({
  name,
  option,
  className = "vial",
}: {
  name: string;
  option?: string;
  /** Kept for API compatibility; the photo has its own label design. */
  accent?: string;
  className?: string;
}) {
  const label = name.length > 12 ? name.split(" ")[0] : name;
  // Fit within ~52% of the vial width (bold sans ≈ 0.66em per glyph), cap at the photo's own size.
  const size = Math.min(12.6, +(52 / (Math.max(label.length, 1) * 0.66)).toFixed(2));
  return (
    <span className={"vial-photo " + className} role="img" aria-label={`${name}${option ? " " + option : ""} research vial`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={VIAL_SRC} alt="" width={412} height={852} decoding="async" draggable={false} />
      <span className="vp-name" style={{ fontSize: `${size}cqw` }}>{label}</span>
      {option ? <span className="vp-opt">{option.replace(/\s+/g, "")}</span> : null}
    </span>
  );
}
