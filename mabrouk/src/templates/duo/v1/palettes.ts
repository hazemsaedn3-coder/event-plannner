import type { CSSProperties } from "react";

/**
 * Color worlds for the two-entrance ("duo") template. Applied as inline CSS
 * variables, so they never depend on a stylesheet being up to date.
 * Romance = the bride's friends; Shaabi = the groom's friends (dark, so its
 * text is always white).
 */
export type DuoPaletteId = "classic" | "royal" | "night" | "sunset";
export type DuoStyleId = "diagonal" | "doors" | "tickets" | "split";

interface RomanceColors {
  bg: string;
  bg2: string;
  glow: string;
  surface: string;
  ink: string;
  inkSoft: string;
  accent: string;
  particle: string;
}

interface ShaabiColors {
  bg: string;
  bg2: string;
  glow: string;
  surface: string;
  accent: string; // neon / gold highlight
  hot: string; // second festive color (badges, date tag)
  bulbs: string[];
}

export interface DuoPalette {
  name: { ar: string; en: string };
  romance: RomanceColors;
  shaabi: ShaabiColors;
}

export const DUO_PALETTES: Record<DuoPaletteId, DuoPalette> = {
  classic: {
    name: { ar: "وردي × بنفسجي نيون", en: "Blush × Neon violet" },
    romance: { bg: "#FCE8EE", bg2: "#F4CFDA", glow: "#FFE3EC", surface: "#FFF7F9", ink: "#4A2430", inkSoft: "#8A5A68", accent: "#D4507A", particle: "#E25C86" },
    shaabi: { bg: "#1B0B33", bg2: "#0C0419", glow: "#4B1A7A", surface: "#2A1250", accent: "#FFD400", hot: "#FF3B6B", bulbs: ["#FF3B6B", "#FFD400", "#29E7CD", "#7C5CFF", "#FF8A00"] },
  },
  royal: {
    name: { ar: "عاجي × سرادق أحمر", en: "Ivory × Red tent" },
    romance: { bg: "#FBF3EA", bg2: "#EFDCC4", glow: "#FFF8EE", surface: "#FFFCF7", ink: "#4A3426", inkSoft: "#8C6F5A", accent: "#B5714F", particle: "#D9A07F" },
    shaabi: { bg: "#3B070C", bg2: "#1A0205", glow: "#7A1420", surface: "#55101A", accent: "#F5C542", hot: "#2E7DFF", bulbs: ["#F5C542", "#FFFFFF", "#2E7DFF", "#F5C542", "#FF6B3D"] },
  },
  night: {
    name: { ar: "لافندر × نيون تركواز", en: "Lavender × Teal neon" },
    romance: { bg: "#EFE9FC", bg2: "#DACDF6", glow: "#F7F2FF", surface: "#FBF9FF", ink: "#2F2350", inkSoft: "#6E6293", accent: "#8B5CF6", particle: "#B79CFB" },
    shaabi: { bg: "#06191E", bg2: "#020A0D", glow: "#0F4B55", surface: "#0E2F36", accent: "#2EF2E2", hot: "#FF2D95", bulbs: ["#2EF2E2", "#FF2D95", "#FFE45C", "#2EF2E2", "#B26BFF"] },
  },
  sunset: {
    name: { ar: "خوخي × أخضر ودهبي", en: "Peach × Green & gold" },
    romance: { bg: "#FFEDE2", bg2: "#FBD2BF", glow: "#FFF4EC", surface: "#FFF9F5", ink: "#4D2A20", inkSoft: "#8F5E4E", accent: "#E2674A", particle: "#F49C82" },
    shaabi: { bg: "#0B2E1C", bg2: "#04140C", glow: "#16603A", surface: "#124227", accent: "#FFC93C", hot: "#FF5C39", bulbs: ["#FFC93C", "#FF5C39", "#FFFFFF", "#7CF5A0", "#FFC93C"] },
  },
};

export function palette(id: string | undefined): DuoPalette {
  return DUO_PALETTES[(id as DuoPaletteId) ?? "classic"] ?? DUO_PALETTES.classic;
}

/** CSS variables for the romantic world (also feed the shared Noor sections). */
export function romanceVars(p: DuoPalette): CSSProperties {
  const c = p.romance;
  return {
    "--bg": c.bg,
    "--bg2": c.bg2,
    "--surface": c.surface,
    "--ink": c.ink,
    "--ink-soft": c.inkSoft,
    "--accent": c.accent,
    "--accent-soft": `${c.accent}1F`,
    "--line": `${c.accent}59`,
    "--particle": c.particle,
    background: `radial-gradient(90% 60% at 80% 0%, ${c.glow} 0%, transparent 60%), linear-gradient(180deg, ${c.bg}, ${c.bg2})`,
    color: c.ink,
  } as CSSProperties;
}

/** CSS variables for the shaabi world: dark background, white text. */
export function shaabiVars(p: DuoPalette): CSSProperties {
  const c = p.shaabi;
  return {
    "--bg": c.bg,
    "--bg2": c.bg2,
    "--surface": c.surface,
    "--ink": "#FFFFFF",
    "--ink-soft": "rgba(255,255,255,0.82)",
    "--accent": c.accent,
    "--accent-soft": `${c.accent}24`,
    "--line": `${c.accent}6B`,
    "--hot": c.hot,
    "--f-display": "var(--font-lalezar), var(--font-amiri), sans-serif",
    "--f-names": "var(--font-lalezar), var(--font-amiri), sans-serif",
    background: `radial-gradient(70% 50% at 50% 0%, ${c.glow} 0%, transparent 70%), linear-gradient(180deg, ${c.bg}, ${c.bg2})`,
    color: "#FFFFFF",
  } as CSSProperties;
}

/** White text with a colored neon glow, for titles on the dark side. */
export function neonText(p: DuoPalette): CSSProperties {
  return {
    color: "#FFFFFF",
    textShadow: `0 0 6px ${p.shaabi.accent}, 0 0 18px ${p.shaabi.hot}B3, 0 0 34px ${p.shaabi.hot}80`,
  };
}
