import { useId } from "react";

/**
 * Brand vial illustration (SVG) used until real product photography exists.
 * Pharma-style: flip-off cap, brushed crimp, clear glass, wrap label with a
 * vertical wordmark, lyophilized cake. Brand colors come from CSS tokens;
 * the neutral greys below are illustration-only shading.
 */
export function Vial({
  name,
  option,
  accent = "var(--mint)",
  className = "vial",
}: {
  name: string;
  option?: string;
  accent?: string;
  className?: string;
}) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const id = (s: string) => `v${uid}${s}`;
  const label = name.length > 10 ? name.split(" ")[0] : name;
  // Fit the name into ~50 units of label width (bold sans ≈ 0.64em per glyph).
  const size = Math.min(15, +(50 / (label.length * 0.64)).toFixed(1));

  return (
    <svg className={className} viewBox="0 0 120 240" role="img" aria-label={`${name}${option ? " " + option : ""} research vial`}>
      <defs>
        <linearGradient id={id("glass")} x1="0" x2="1">
          <stop offset="0" stopColor="#D9DEE3" />
          <stop offset="0.12" stopColor="#F6F8FA" />
          <stop offset="0.5" stopColor="#FFFFFF" stopOpacity="0.6" />
          <stop offset="0.86" stopColor="#EEF1F4" />
          <stop offset="1" stopColor="#CDD3D9" />
        </linearGradient>
        <linearGradient id={id("crimp")} x1="0" x2="1">
          <stop offset="0" stopColor="#8E939B" />
          <stop offset="0.18" stopColor="#E9EBEE" />
          <stop offset="0.35" stopColor="#B5BAC1" />
          <stop offset="0.55" stopColor="#F7F8F9" />
          <stop offset="0.78" stopColor="#AEB3BA" />
          <stop offset="1" stopColor="#80858D" />
        </linearGradient>
        <linearGradient id={id("cap")} x1="0" x2="1">
          <stop offset="0" stopColor="var(--navy-deep)" />
          <stop offset="0.45" stopColor="var(--navy-soft)" />
          <stop offset="1" stopColor="var(--navy-deep)" />
        </linearGradient>
        <linearGradient id={id("wrap")} x1="0" x2="1">
          <stop offset="0" stopColor="#000" stopOpacity="0.14" />
          <stop offset="0.14" stopColor="#000" stopOpacity="0" />
          <stop offset="0.8" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.16" />
        </linearGradient>
        <linearGradient id={id("cake")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="1" stopColor="#EDEDE6" />
        </linearGradient>
        <clipPath id={id("body")}>
          <rect x="20" y="66" width="80" height="164" rx="13" />
        </clipPath>
      </defs>

      {/* flip-off cap */}
      <rect x="33" y="4" width="54" height="20" rx="6" fill={`url(#${id("cap")})`} />
      <rect x="37" y="6" width="46" height="3" rx="1.5" fill="#FFFFFF" opacity="0.18" />
      {/* aluminium crimp */}
      <rect x="29" y="21" width="62" height="28" rx="4" fill={`url(#${id("crimp")})`} />
      <rect x="29" y="44" width="62" height="5" rx="2" fill="#000" opacity="0.08" />
      {/* neck + shoulder */}
      <path d="M36 49h48v6c0 4 16 5 16 17v4H20v-4c0-12 16-13 16-17z" fill={`url(#${id("glass")})`} stroke="#C9CFD6" strokeWidth="0.8" />
      {/* body */}
      <rect x="20" y="66" width="80" height="164" rx="13" fill={`url(#${id("glass")})`} stroke="#C9CFD6" strokeWidth="0.8" />
      <g clipPath={`url(#${id("body")})`}>
        {/* lyophilized cake */}
        <path d="M20 200c10-3 22 2 40-1s28 2 40-1v40H20z" fill={`url(#${id("cake")})`} />
        {/* label */}
        <rect x="20" y="90" width="80" height="100" fill="#FFFFFF" />
        <rect x="20" y="90" width="80" height="4" fill={accent} />
        <text x="29" y="118" fontFamily="Inter Variable, system-ui, sans-serif" fontSize={size} fontWeight="700" letterSpacing="-0.3" fill="var(--navy)">{label}</text>
        {option ? (
          <>
            <rect x="30" y="126" width={Math.max(26, option.length * 5.2 + 10)} height="11" rx="5.5" fill="var(--navy)" />
            <text x="35" y="134" fontFamily="Inter Variable, system-ui, sans-serif" fontSize="6.4" fontWeight="700" letterSpacing="0.4" fill="#FFFFFF">{option.toUpperCase()}</text>
          </>
        ) : null}
        <rect x="30" y="150" width="30" height="0.8" fill="#D5D8DD" />
        <text x="30" y="160" fontFamily="Inter Variable, system-ui, sans-serif" fontSize="4.2" fontWeight="600" letterSpacing="0.5" fill="#6B7080">≥99% PURITY · HPLC</text>
        <text x="30" y="168" fontFamily="Inter Variable, system-ui, sans-serif" fontSize="4.2" fontWeight="600" letterSpacing="0.5" fill="#6B7080">RESEARCH USE ONLY</text>
        {/* vertical wordmark */}
        <text transform="translate(92 182) rotate(-90)" fontFamily="Newsreader Variable, Georgia, serif" fontSize="15" fontWeight="600" letterSpacing="-0.2" fill="var(--navy)">Revised</text>
        <rect x="20" y="90" width="80" height="100" fill={`url(#${id("wrap")})`} />
        {/* glass highlights: strong on bare glass, a faint gloss across the label */}
        {[[68, 22], [190, 38]].map(([y, h]) => (
          <g key={y}>
            <rect x="26" y={y} width="5" height={h} rx="2.5" fill="#FFFFFF" opacity="0.8" />
            <rect x="89" y={y} width="2.4" height={h} rx="1.2" fill="#FFFFFF" opacity="0.5" />
          </g>
        ))}
        <rect x="23" y="90" width="3" height="100" fill="#FFFFFF" opacity="0.35" />
      </g>
    </svg>
  );
}
