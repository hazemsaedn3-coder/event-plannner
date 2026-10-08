import type { L10n, ThemeId } from "@/lib/types";

export interface NoorTheme {
  id: ThemeId;
  name: L10n;
  /** Light or dark: drives the browser chrome color and seal contrast. */
  scheme: "light" | "dark";
  colors: {
    bg: string; // page background
    bg2: string; // gradient end
    surface: string; // cards
    ink: string; // main text
    inkSoft: string; // secondary text
    accent: string; // gold / rose-gold lines and highlights
    accentSoft: string; // translucent accent for fills
    line: string; // hairlines
    envelope: string; // envelope back
    envelopeFront: string; // envelope pocket
    card: string; // letter card inside the envelope
    cardInk: string; // text on the letter card
    seal: string; // wax
    sealDark: string; // wax shadow
    sealInk: string; // monogram pressed into the wax
  };
}

export const noorThemes: Record<ThemeId, NoorTheme> = {
  "ivory-gold": {
    id: "ivory-gold",
    name: { ar: "عاجي وذهبي", en: "Ivory Gold" },
    scheme: "light",
    colors: {
      bg: "#F8F2E7",
      bg2: "#EFE4D0",
      surface: "#FFFBF4",
      ink: "#3A2E22",
      inkSoft: "#7A6A55",
      accent: "#B08A45",
      accentSoft: "rgba(176,138,69,0.12)",
      line: "rgba(176,138,69,0.35)",
      envelope: "#E9DCC3",
      envelopeFront: "#F3E9D6",
      card: "#FFFDF8",
      cardInk: "#3A2E22",
      seal: "#8C2232",
      sealDark: "#5E1220",
      sealInk: "#E8C987",
    },
  },
  "emerald-night": {
    id: "emerald-night",
    name: { ar: "ليل زمردي", en: "Emerald Night" },
    scheme: "dark",
    colors: {
      bg: "#0E2E26",
      bg2: "#071C17",
      surface: "#133A30",
      ink: "#F4EBD6",
      inkSoft: "#BFB49A",
      accent: "#D6B46C",
      accentSoft: "rgba(214,180,108,0.12)",
      line: "rgba(214,180,108,0.35)",
      envelope: "#0A251E",
      envelopeFront: "#123A30",
      card: "#F7F0DF",
      cardInk: "#0E2E26",
      seal: "#C9A253",
      sealDark: "#8F6F2C",
      sealInk: "#0E2E26",
    },
  },
  "blush-rose": {
    id: "blush-rose",
    name: { ar: "وردي ناعم", en: "Blush Rose" },
    scheme: "light",
    colors: {
      bg: "#F7E6E2",
      bg2: "#EED3CE",
      surface: "#FDF4F1",
      ink: "#55343A",
      inkSoft: "#8E6A6F",
      accent: "#B5737C",
      accentSoft: "rgba(181,115,124,0.12)",
      line: "rgba(181,115,124,0.35)",
      envelope: "#E9C9C3",
      envelopeFront: "#F2DAD5",
      card: "#FFF9F7",
      cardInk: "#55343A",
      seal: "#9E4A58",
      sealDark: "#6D2C38",
      sealInk: "#F6D9C9",
    },
  },
};

/** CSS custom properties for a theme, applied on the template root. */
export function themeStyle(theme: NoorTheme): Record<string, string> {
  const c = theme.colors;
  return {
    "--bg": c.bg,
    "--bg2": c.bg2,
    "--surface": c.surface,
    "--ink": c.ink,
    "--ink-soft": c.inkSoft,
    "--accent": c.accent,
    "--accent-soft": c.accentSoft,
    "--line": c.line,
    "--env": c.envelope,
    "--env-front": c.envelopeFront,
    "--card": c.card,
    "--card-ink": c.cardInk,
    "--seal": c.seal,
    "--seal-dark": c.sealDark,
    "--seal-ink": c.sealInk,
  };
}
