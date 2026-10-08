/** One stroke-icon set for the whole site (24×24, currentColor). */
const PATHS: Record<string, React.ReactNode> = {
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
  chevron: <path d="m9 6 6 6-6 6" />,
  menu: <path d="M3 6h18M3 12h18M3 18h18" />,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  plus: <path d="M12 5v14M5 12h14" />,
  minus: <path d="M5 12h14" />,
  search: (<><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></>),
  user: (<><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></>),
  bag: (<><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" /><path d="M3 6h18" /><path d="M16 10a4 4 0 0 1-8 0" /></>),
  check: <path d="M20 6 9 17l-5-5" />,
  shield: (<><path d="M12 3l7 3v5.5c0 4.3-2.9 7.9-7 9.5-4.1-1.6-7-5.2-7-9.5V6z" /><path d="m9 12 2 2 4-4.5" /></>),
  flask: (<><path d="M9.4 2.8v5.4L4.9 17a2.4 2.4 0 0 0 2.1 3.6h10a2.4 2.4 0 0 0 2.1-3.6l-4.5-8.8V2.8" /><path d="M8.2 2.8h7.6" /><path d="M7.1 13.6h9.8" /></>),
  cert: (<><path d="M17.6 11.2V5.2a1.8 1.8 0 0 0-1.8-1.8H6.2a1.8 1.8 0 0 0-1.8 1.8v13.6a1.8 1.8 0 0 0 1.8 1.8h4" /><path d="M7.6 7.6h6.6M7.6 11h4.4" /><circle cx="16.4" cy="15.2" r="3.4" /><path d="m14.2 17.9-.5 3 2.7-1.4 2.7 1.4-.5-3" /></>),
  truck: (<><path d="M2.6 6.4h10.8v9.9H2.6z" /><path d="M13.4 9.7h4.2l3.4 3.4v3.2h-7.6z" /><circle cx="7.1" cy="18.3" r="1.7" /><circle cx="17.2" cy="18.3" r="1.7" /></>),
  lock: (<><rect x="4.6" y="10.2" width="14.8" height="10.2" rx="2.2" /><path d="M8.2 10.2V7.6a3.8 3.8 0 0 1 7.6 0v2.6" /><path d="M12 14.2v2.3" /></>),
  mail: (<><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3.5 6.5 8.5 6 8.5-6" /></>),
  book: (<><path d="M12 6.6C10.4 5.2 8.4 4.6 5.2 4.6a1 1 0 0 0-1 1v11.2a1 1 0 0 0 1 1c3.2 0 5.2.6 6.8 2" /><path d="M12 6.6c1.6-1.4 3.6-2 6.8-2a1 1 0 0 1 1 1v11.2a1 1 0 0 1-1 1c-3.2 0-5.2.6-6.8 2z" /><path d="M12 6.6v13.2" /></>),
  purity: <path d="M12 3.4c3.3 3.7 5.5 6.5 5.5 9.2a5.5 5.5 0 0 1-11 0c0-2.7 2.2-5.5 5.5-9.2Z" />,
  identity: (<><circle cx="11" cy="11" r="6.5" /><path d="m20 20-4.4-4.4" /><path d="M8.5 11h5M11 8.5v5" /></>),
  sterility: (<><path d="M12 2v4M12 18v4M4.9 4.9l2.8 2.8M16.3 16.3l2.8 2.8M2 12h4M18 12h4M4.9 19.1l2.8-2.8M16.3 7.7l2.8-2.8" /><circle cx="12" cy="12" r="3" /></>),
  coa: (<><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" /><path d="M14 3v5h5" /><path d="m9 14 2 2 4-4" /></>),
  star: <path d="M12 2.6l2.9 5.9 6.5.95-4.7 4.58 1.11 6.47L12 17.45 6.19 20.5 7.3 14.03 2.6 9.45l6.5-.95z" />,
  snow: (<><path d="M12 2v20M4.9 7l14.2 10M4.9 17 19.1 7" /></>),
  sun: (<><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>),
  info: (<><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></>),
  phone: (<><rect x="6.5" y="2.6" width="11" height="18.8" rx="2.4" /><path d="M11.4 18.2h1.2" /></>),
  gift: (<><rect x="3.5" y="8.5" width="17" height="4" rx="1" /><path d="M5 12.5V20a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-7.5M12 8.5V21" /><path d="M12 8.5C10.5 5 7 4.6 7 6.6 7 8.5 12 8.5 12 8.5ZM12 8.5c1.5-3.5 5-3.9 5-1.9 0 1.9-5 1.9-5 1.9Z" /></>),
  bell: (<><path d="M6 9.5a6 6 0 0 1 12 0c0 6.2 2.4 7.6 2.4 7.6H3.6S6 15.7 6 9.5" /><path d="M10.2 20.4a1.9 1.9 0 0 0 3.6 0" /></>),
  copy: (<><rect x="8.6" y="8.6" width="12" height="12" rx="2.2" /><path d="M15.4 8.6V5.6a2.2 2.2 0 0 0-2.2-2.2H5.6a2.2 2.2 0 0 0-2.2 2.2v7.6a2.2 2.2 0 0 0 2.2 2.2h3" /></>),
  share: (<><path d="M12 3v12" /><path d="m7.8 7.2 4.2-4.2 4.2 4.2" /><path d="M8.6 10.6H6.4a1.6 1.6 0 0 0-1.6 1.6v7.2A1.6 1.6 0 0 0 6.4 21h11.2a1.6 1.6 0 0 0 1.6-1.6v-7.2a1.6 1.6 0 0 0-1.6-1.6h-2.2" /></>),
};

export type IconName = keyof typeof PATHS;

export function Icon({ name, className, strokeWidth = 1.9 }: { name: string; className?: string; strokeWidth?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill={name === "star" ? "currentColor" : "none"}
      stroke={name === "star" ? "none" : "currentColor"}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      {PATHS[name] ?? PATHS.info}
    </svg>
  );
}
