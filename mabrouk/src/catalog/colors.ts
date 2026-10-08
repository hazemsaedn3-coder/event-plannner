import type { TemplateColors } from "./types";

type RGB = [number, number, number];

function hexToRgb(hex: string): RGB {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function rgbToHex([r, g, b]: RGB): string {
  return "#" + [r, g, b].map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, "0")).join("");
}

/** Linear mix: t=0 → a, t=1 → b. */
export function mix(a: string, b: string, t: number): string {
  const x = hexToRgb(a);
  const y = hexToRgb(b);
  return rgbToHex([x[0] + (y[0] - x[0]) * t, x[1] + (y[1] - x[1]) * t, x[2] + (y[2] - x[2]) * t]);
}

export function alpha(hex: string, a: number): string {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r},${g},${b},${a})`;
}

export function luminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Full Noor palette derived from the five colors an admin picks. */
export function deriveNoorColors(c: TemplateColors) {
  const dark = luminance(c.background) < 0.2;
  return {
    bg: c.background,
    bg2: mix(c.background, dark ? "#000000" : c.text, dark ? 0.35 : 0.06),
    surface: c.surface,
    ink: c.text,
    inkSoft: mix(c.text, c.background, 0.35),
    accent: c.accent,
    accentSoft: alpha(c.accent, 0.12),
    line: alpha(c.accent, 0.35),
    envelope: dark ? mix(c.background, "#000000", 0.25) : mix(c.background, c.accent, 0.14),
    envelopeFront: dark ? mix(c.background, c.surface, 0.6) : mix(c.background, "#ffffff", 0.35),
    card: dark ? mix(c.text, "#ffffff", 0.4) : mix(c.surface, "#ffffff", 0.5),
    cardInk: dark ? c.background : c.text,
    seal: c.seal,
    sealDark: mix(c.seal, "#000000", 0.35),
    sealInk: luminance(c.seal) > 0.35 ? mix(c.seal, "#000000", 0.7) : mix(c.accent, "#ffffff", 0.45),
  };
}
