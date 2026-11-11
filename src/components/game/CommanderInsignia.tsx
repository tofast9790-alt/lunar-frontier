/** Original mission insignia (SVG) — moon crescent, polar outpost marker and star. */
export function CommanderInsignia({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 200" className={className} role="img" aria-label="Lunar Frontier commander insignia">
      <circle cx="100" cy="100" r="92" fill="var(--panel-strong)" stroke="var(--amber)" strokeWidth="4" />
      <circle cx="100" cy="100" r="80" fill="none" stroke="var(--cyan)" strokeWidth="1.5" strokeDasharray="4 6" />
      <circle cx="100" cy="112" r="44" fill="var(--muted-foreground)" />
      <circle cx="118" cy="100" r="40" fill="var(--panel-strong)" />
      <circle cx="80" cy="128" r="5" fill="var(--secondary)" />
      <circle cx="72" cy="104" r="3.5" fill="var(--secondary)" />
      <path d="M100 30 L106 46 L122 46 L109 56 L114 72 L100 62 L86 72 L91 56 L78 46 L94 46 Z" fill="var(--amber)" />
      <path d="M62 150 Q100 170 138 150" fill="none" stroke="var(--cyan)" strokeWidth="2" />
      <text x="100" y="186" textAnchor="middle" fontFamily="IBM Plex Mono, monospace" fontSize="10" letterSpacing="3" fill="var(--foreground)">
        LF-01 COMMANDER
      </text>
    </svg>
  );
}
