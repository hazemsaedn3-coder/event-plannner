/**
 * Vector ornaments for Noor. Everything is drawn with `currentColor` /
 * CSS variables so all three themes share the same artwork. No images.
 */

/** Eight-pointed star (khatam), the signature motif of Noor. */
export function Star8({ size = 14, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden>
      <path
        fill="currentColor"
        d="M12 0l2.6 5.7L20.5 3.5l-2.2 5.9L24 12l-5.7 2.6 2.2 5.9-5.9-2.2L12 24l-2.6-5.7-5.9 2.2 2.2-5.9L0 12l5.7-2.6L3.5 3.5l5.9 2.2z"
      />
    </svg>
  );
}

/** Hairline — star — hairline. */
export function Divider({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center gap-3 text-[var(--accent)] ${className}`} aria-hidden>
      <span className="h-px w-16 bg-gradient-to-l from-[var(--accent)] to-transparent rtl:bg-gradient-to-r" />
      <span className="h-1 w-1 rotate-45 bg-current opacity-60" />
      <Star8 size={12} />
      <span className="h-1 w-1 rotate-45 bg-current opacity-60" />
      <span className="h-px w-16 bg-gradient-to-r from-[var(--accent)] to-transparent rtl:bg-gradient-to-l" />
    </div>
  );
}

/**
 * Mihrab-style arch framing the hero. Drawn as two concentric outlines with
 * a star at the apex. Stretches to its container via preserveAspectRatio.
 */
export function ArchFrame({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 320 560"
      preserveAspectRatio="none"
      fill="none"
      aria-hidden
    >
      <path
        d="M10 552 V190 C10 100 80 40 160 12 C240 40 310 100 310 190 V552 Z"
        stroke="var(--accent)"
        strokeWidth="1.2"
        vectorEffect="non-scaling-stroke"
      />
      <path
        d="M22 540 V194 C22 112 86 58 160 30 C234 58 298 112 298 194 V540 Z"
        stroke="var(--accent)"
        strokeOpacity="0.45"
        strokeWidth="0.8"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

/** "17 ◆ 06 ◆ 2027" — a diamond, not a dot, so Arabic-Indic zero (٠) stays unambiguous. */
export function DateParts({ parts, className = "" }: { parts: [string, string, string]; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-3 ${className}`} dir="ltr">
      {parts.map((p, i) => (
        <span key={i} className="inline-flex items-center gap-3">
          {i > 0 && <span className="h-1.5 w-1.5 rotate-45 bg-[var(--accent)]" aria-hidden />}
          <span>{p}</span>
        </span>
      ))}
    </span>
  );
}

/** Small separator between inline facts (replaces "·", which reads as ٠ in Arabic). */
export function Dot() {
  return <span className="mx-2 inline-block h-1 w-1 translate-y-[-3px] rotate-45 bg-[var(--accent)] opacity-70" aria-hidden />;
}

/** Small corner flourish used on cards. */
export function Corner({ className = "" }: { className?: string }) {
  return (
    <svg width="34" height="34" viewBox="0 0 34 34" className={className} fill="none" aria-hidden>
      <path d="M1 33 V12 C1 6 6 1 12 1 H33" stroke="var(--accent)" strokeWidth="1" />
      <path d="M6 33 V15 C6 10 10 6 15 6 H33" stroke="var(--accent)" strokeOpacity="0.4" strokeWidth="0.8" />
      <circle cx="12" cy="12" r="1.6" fill="var(--accent)" />
    </svg>
  );
}

/** Line icons (stroke = currentColor). */
export function Icon({ name, className = "h-4 w-4" }: { name: IconName; className?: string }) {
  const common = {
    className,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.5,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };
  switch (name) {
    case "pin":
      return (
        <svg {...common}>
          <path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z" />
          <circle cx="12" cy="9.5" r="2.5" />
        </svg>
      );
    case "nav":
      return (
        <svg {...common}>
          <path d="M3 11l18-8-8 18-2-8z" />
        </svg>
      );
    case "calendar":
      return (
        <svg {...common}>
          <rect x="3.5" y="5" width="17" height="15" rx="2" />
          <path d="M3.5 10h17M8 3v4M16 3v4" />
        </svg>
      );
    case "clock":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8.5" />
          <path d="M12 7.5V12l3 2" />
        </svg>
      );
    case "music":
      return (
        <svg {...common}>
          <path d="M9 18V5l11-2v13" />
          <circle cx="6.5" cy="18" r="2.5" />
          <circle cx="17.5" cy="16" r="2.5" />
        </svg>
      );
    case "music-off":
      return (
        <svg {...common}>
          <path d="M9 18V5l11-2v13" />
          <circle cx="6.5" cy="18" r="2.5" />
          <circle cx="17.5" cy="16" r="2.5" />
          <path d="M3 3l18 18" />
        </svg>
      );
    case "copy":
      return (
        <svg {...common}>
          <rect x="8" y="8" width="12" height="12" rx="2" />
          <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
        </svg>
      );
    case "gift":
      return (
        <svg {...common}>
          <rect x="3.5" y="9" width="17" height="11" rx="1.5" />
          <path d="M2.5 9h19M12 9v11M12 9S10 4 7.5 4.5 7 8.5 12 9zM12 9s2-5 4.5-4.5S17 8.5 12 9z" />
        </svg>
      );
    case "dress":
      return (
        <svg {...common}>
          <path d="M9 3h6l-1 4 4 13H6l4-13z" />
        </svg>
      );
    case "check":
      return (
        <svg {...common}>
          <path d="M5 12.5l4.5 4.5L19 7.5" />
        </svg>
      );
    case "phone":
      return (
        <svg {...common}>
          <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" />
        </svg>
      );
    case "chat":
      return (
        <svg {...common}>
          <path d="M4 20l1.3-3.9A8 8 0 1 1 8 19z" />
          <path d="M9 10.5c.5 2 2.5 4 4.5 4.5l1-1.2 1.8.8" />
        </svg>
      );
    case "share":
      return (
        <svg {...common}>
          <circle cx="18" cy="5.5" r="2.5" />
          <circle cx="6" cy="12" r="2.5" />
          <circle cx="18" cy="18.5" r="2.5" />
          <path d="M8.2 10.8l7.6-4.1M8.2 13.2l7.6 4.1" />
        </svg>
      );
    case "note":
      return (
        <svg {...common}>
          <path d="M6 3.5h9l3.5 3.5v13.5H6z" />
          <path d="M14.5 3.5V7.5H18.5M9 12h6M9 15.5h6" />
        </svg>
      );
    case "close":
      return (
        <svg {...common}>
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      );
    case "chevron":
      return (
        <svg {...common}>
          <path d="M9 5l7 7-7 7" />
        </svg>
      );
    case "expand":
      return (
        <svg {...common}>
          <path d="M14 4h6v6M10 20H4v-6M20 4l-7 7M4 20l7-7" />
        </svg>
      );
  }
}

export type IconName =
  | "phone"
  | "chat"
  | "share"
  | "note"
  | "close"
  | "chevron"
  | "expand"
  | "pin"
  | "nav"
  | "calendar"
  | "clock"
  | "music"
  | "music-off"
  | "copy"
  | "gift"
  | "dress"
  | "check";
