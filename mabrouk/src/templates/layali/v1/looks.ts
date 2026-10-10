import type { CSSProperties } from "react";

/**
 * Layali (ليالي) looks: each one is an embossed paper, a seal, a particle
 * style and the colors of the invitation pages. All colors are applied as
 * inline CSS variables (no dependency on a cached stylesheet).
 */
export type LayaliLookId = "velvet" | "royal" | "midnight" | "garden";
export type Motif = "damask" | "lace" | "star" | "floral";
export type Particles = "dust" | "petals" | "lanterns";

export interface LayaliLook {
  name: { ar: string; en: string };
  motif: Motif;
  /** Envelope paper (front), flap and inner lining. */
  paper: string;
  flap: string;
  lining: string;
  /** Wax / foil seal gradient: highlight, body, shadow. */
  seal: [string, string, string];
  /** Text printed on the envelope ("tap to open"). */
  envelopeInk: string;
  /** Card that rises from the envelope. */
  card: { bg: string; ink: string; accent: string };
  particles: Particles;
  /** Invitation pages after opening. */
  page: { bg: string; bg2: string; surface: string; ink: string; inkSoft: string; accent: string; dark: boolean };
  /** Foil gradient used for rules, frames and highlights. */
  foil: [string, string, string];
  /** Dark cinematic tint laid over hero photos. */
  shade: string;
}

const GOLD: [string, string, string] = ["#F7E7B4", "#C9A24A", "#7A5A1C"];

export const LAYALI_LOOKS: Record<LayaliLookId, LayaliLook> = {
  velvet: {
    name: { ar: "مخمل عنابي", en: "Burgundy velvet" },
    motif: "damask",
    paper: "#45111B",
    flap: "#4E1420",
    lining: "#2B0910",
    seal: GOLD,
    envelopeInk: "#E9CF8F",
    card: { bg: "#FBF5EA", ink: "#3D1018", accent: "#A7853B" },
    particles: "dust",
    page: { bg: "#2A0A11", bg2: "#17050A", surface: "#3A0F18", ink: "#F6EAD3", inkSoft: "rgba(246,234,211,0.78)", accent: "#D9B865", dark: true },
    foil: GOLD,
    shade: "#17050A",
  },
  royal: {
    name: { ar: "دانتيل ذهبي", en: "Royal gold lace" },
    motif: "lace",
    paper: "#C6A15A",
    flap: "#CFAB63",
    lining: "#F4E7C8",
    seal: ["#FFF3CF", "#D7B05A", "#8B6721"],
    envelopeInk: "#5E4313",
    card: { bg: "#FFFBF1", ink: "#3E2E12", accent: "#B08A3E" },
    particles: "dust",
    page: { bg: "#FBF4E4", bg2: "#F1E2C0", surface: "#FFFCF4", ink: "#3E2E12", inkSoft: "#7A6643", accent: "#A9823A", dark: false },
    foil: ["#FFF0BF", "#C99F45", "#83601C"],
    shade: "#2A1C0A",
  },
  midnight: {
    name: { ar: "ليل ونجوم", en: "Midnight stars" },
    motif: "star",
    paper: "#121E38",
    flap: "#16244A",
    lining: "#0A1226",
    seal: GOLD,
    envelopeInk: "#E9CF8F",
    card: { bg: "#FAF6EC", ink: "#132042", accent: "#B08A3E" },
    particles: "lanterns",
    page: { bg: "#0D1630", bg2: "#060B1A", surface: "#16234A", ink: "#F3ECDA", inkSoft: "rgba(243,236,218,0.78)", accent: "#E2C277", dark: true },
    foil: GOLD,
    shade: "#060B1A",
  },
  garden: {
    name: { ar: "حديقة الورد", en: "Rose garden" },
    motif: "floral",
    paper: "#ECD0CB",
    flap: "#F0D8D3",
    lining: "#FFF6F3",
    seal: ["#EBA9B3", "#A8344A", "#5E1424"],
    envelopeInk: "#7A3442",
    card: { bg: "#FFFAF8", ink: "#4E2530", accent: "#B4606E" },
    particles: "petals",
    page: { bg: "#FBF0EE", bg2: "#F3DCD8", surface: "#FFFAF9", ink: "#4E2530", inkSoft: "#86606A", accent: "#B4606E", dark: false },
    foil: ["#F9E3C4", "#C99A6B", "#8A5A3A"],
    shade: "#3A1620",
  },
};

export function layaliLook(id: string | undefined): LayaliLook {
  return LAYALI_LOOKS[(id as LayaliLookId) ?? "velvet"] ?? LAYALI_LOOKS.velvet;
}

/** CSS variables consumed by the shared invitation sections. */
export function pageVars(l: LayaliLook): CSSProperties {
  const p = l.page;
  return {
    "--bg": p.bg,
    "--bg2": p.bg2,
    "--surface": p.surface,
    "--ink": p.ink,
    "--ink-soft": p.inkSoft,
    "--accent": p.accent,
    "--accent-soft": `${p.accent}22`,
    "--line": `${p.accent}55`,
    "--f-names": "var(--font-aref), var(--font-pinyon), serif",
    background: `linear-gradient(180deg, ${p.bg}, ${p.bg2})`,
    color: p.ink,
  } as CSSProperties;
}
