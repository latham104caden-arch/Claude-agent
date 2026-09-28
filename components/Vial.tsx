/**
 * Brand vial illustration, drawn in SVG so every product has consistent art
 * before real photography exists. Swap for <Image> once product shots land.
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
  const label = name.length > 10 ? name.split(" ")[0] : name;
  // Fit the name inside the 64-unit label (bold sans ≈ 0.68em per glyph).
  const size = Math.min(13, +(52 / (label.length * 0.7)).toFixed(1));
  const id = "g" + name.replace(/[^a-z0-9]/gi, "");
  return (
    <svg className={className} viewBox="0 0 100 180" role="img" aria-label={`${name}${option ? " " + option : ""} research vial`}>
      <defs>
        <linearGradient id={`${id}-glass`} x1="0" x2="1">
          <stop offset="0" stopColor="#E9ECEF" />
          <stop offset="0.35" stopColor="#FFFFFF" />
          <stop offset="1" stopColor="#D5D9DE" />
        </linearGradient>
        <linearGradient id={`${id}-cap`} x1="0" x2="1">
          <stop offset="0" stopColor="#1E2233" />
          <stop offset="0.4" stopColor="#3A405A" />
          <stop offset="1" stopColor="#1E2233" />
        </linearGradient>
      </defs>
      {/* cap */}
      <rect x="22" y="4" width="56" height="30" rx="5" fill={`url(#${id}-cap)`} />
      <rect x="22" y="28" width="56" height="8" fill="#C9CDD4" />
      {/* neck + body */}
      <path d="M30 36h40v8c0 3 12 6 12 14v108a10 10 0 0 1-10 10H28a10 10 0 0 1-10-10V58c0-8 12-11 12-14z" fill={`url(#${id}-glass)`} stroke="#C4C9D0" strokeWidth="1" />
      {/* powder */}
      <path d="M19 150h62v16a10 10 0 0 1-10 10H29a10 10 0 0 1-10-10z" fill="#F4F4EF" />
      {/* glass highlight — drawn under the label so it never crosses text */}
      <rect x="24" y="60" width="4" height="96" rx="2" fill="#FFFFFF" opacity="0.7" />
      {/* label */}
      <rect x="18" y="72" width="64" height="70" fill="#FFFFFF" />
      <rect x="18" y="72" width="64" height="70" fill="none" stroke="#E4E6EA" strokeWidth="0.6" />
      <rect x="18" y="72" width="64" height="7" fill={accent} />
      <text x="50" y="92" textAnchor="middle" fontFamily="system-ui, sans-serif" fontSize="6" fontWeight="700" letterSpacing="1.4" fill="#5B6072">REVISED</text>
      <text x="50" y={112} textAnchor="middle" fontFamily="system-ui, sans-serif" fontSize={size} fontWeight="800" fill="#2B3044">{label}</text>
      {option ? (
        <text x="50" y="126" textAnchor="middle" fontFamily="system-ui, sans-serif" fontSize="7" fontWeight="700" fill="#1F7A4D">{option.toUpperCase()}</text>
      ) : null}
      <text x="50" y="137" textAnchor="middle" fontFamily="system-ui, sans-serif" fontSize="4.2" fontWeight="600" letterSpacing="0.6" fill="#5B6072">RESEARCH USE ONLY</text>
    </svg>
  );
}
