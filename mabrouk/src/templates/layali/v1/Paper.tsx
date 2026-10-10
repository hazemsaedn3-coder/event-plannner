import type { CSSProperties } from "react";
import type { Motif } from "./looks";

/**
 * Embossed paper drawn live with SVG lighting filters: a motif pattern is
 * turned into a relief map (feDiffuseLighting) and blended over the paper
 * color, plus a fine paper grain and a soft vignette. Crisp at any size,
 * a few hundred bytes instead of a photo or video.
 *
 * `uid` must be unique on the page (SVG ids are global).
 */

const star16 = (cx: number, cy: number, R: number, r: number) =>
  Array.from({ length: 16 }, (_, i) => {
    const a = (i * Math.PI) / 8 - Math.PI / 2;
    const rr = i % 2 ? r : R;
    return `${(cx + rr * Math.cos(a)).toFixed(1)},${(cy + rr * Math.sin(a)).toFixed(1)}`;
  }).join(" ");

const DAMASK_HALF = `
 <path d="M70 18 C60 28 58 40 70 50"/>
 <path d="M70 50 C52 44 38 54 42 70 C45 82 60 82 61 72 C62 65 54 63 52 68"/>
 <path d="M70 84 C46 76 24 90 24 112 C24 130 42 140 54 131 C62 125 58 114 51 116"/>
 <path d="M24 112 C14 108 6 116 8 128 C10 136 18 136 19 130"/>
 <path d="M42 70 C32 62 22 66 20 78 C19 86 26 88 28 83"/>
 <path d="M70 124 C58 132 56 146 70 162"/>
 <path d="M58 98 C50 92 42 96 40 104 C47 106 54 104 58 98Z" fill="#000"/>
 <path d="M50 150 C40 150 34 158 36 166"/>
 <path d="M44 34 C38 26 40 18 48 16"/>`;

const halfDrop = (one: string, dx: number, dy: number) =>
  `${one}${[[-dx, dy], [dx, dy], [-dx, -dy], [dx, -dy]].map(([x, y]) => `<g transform="translate(${x} ${y})">${one}</g>`).join("")}`;

const ROSE = `<g>
 <path d="M60 52 c-3 -2 -7 0 -6 4 c1 5 9 6 12 1 c3 -6 -3 -13 -10 -12 c-9 1 -13 11 -8 18 c6 8 20 6 23 -3 c3 -10 -5 -20 -15 -20"/>
 <path d="M44 60 C36 72 40 86 52 88 C64 90 76 84 78 70"/>
 <path d="M58 88 C58 100 56 110 50 120"/>
 <path d="M56 100 C44 96 34 100 30 110 C42 112 52 108 56 100Z" fill="#000"/>
 <path d="M54 110 C64 104 76 106 80 114 C70 118 60 116 54 110Z" fill="#000"/>
 <circle cx="20" cy="30" r="2" fill="#000"/><circle cx="100" cy="24" r="2.4" fill="#000"/><circle cx="96" cy="100" r="1.8" fill="#000"/>
 <path d="M86 40 C96 34 104 38 106 46"/><path d="M14 92 C10 82 14 74 22 72"/></g>`;

const MOTIFS: Record<Motif, { w: number; h: number; sw: number; svg: string }> = {
  damask: {
    w: 140,
    h: 180,
    sw: 1.7,
    svg: halfDrop(`<g>${DAMASK_HALF}<g transform="translate(140 0) scale(-1 1)">${DAMASK_HALF}</g><path d="M70 50 V124"/><circle cx="70" cy="104" r="4" fill="#000"/></g>`, 70, 90),
  },
  lace: {
    w: 90,
    h: 90,
    sw: 1.5,
    svg: `<circle cx="45" cy="45" r="10"/><circle cx="45" cy="45" r="4" fill="#000"/>
   ${Array.from({ length: 10 }, (_, i) => `<ellipse cx="45" cy="27" rx="5" ry="9" transform="rotate(${i * 36} 45 45)"/>`).join("")}
   ${Array.from({ length: 20 }, (_, i) => {
     const a = (i * 18 * Math.PI) / 180;
     return `<circle cx="${(45 + 31 * Math.cos(a)).toFixed(1)}" cy="${(45 + 31 * Math.sin(a)).toFixed(1)}" r="1.6" fill="#000"/>`;
   }).join("")}
   <path d="M0 0 Q22 8 45 0 Q68 8 90 0 M0 90 Q22 82 45 90 Q68 82 90 90"/><path d="M0 45 Q6 40 12 45 M78 45 Q84 40 90 45"/>`,
  },
  star: {
    w: 84,
    h: 84,
    sw: 1.5,
    svg: `<polygon points="${star16(42, 42, 26, 17)}"/><polygon points="${star16(42, 42, 14, 9)}"/>
   <path d="M42 0 V16 M42 68 V84 M0 42 H16 M68 42 H84"/>
   ${[[0, 0], [84, 0], [0, 84], [84, 84]].map(([x, y]) => `<polygon points="${star16(x, y, 12, 7)}"/>`).join("")}
   <circle cx="42" cy="42" r="3" fill="#000"/>`,
  },
  floral: { w: 120, h: 130, sw: 1.6, svg: halfDrop(ROSE, 60, 65) },
};

export function EmbossedPaper({
  uid,
  motif,
  color,
  relief = 3.5,
  strength = 0.85,
  scale = 1,
  vignette = true,
  className = "",
  style,
}: {
  uid: string;
  motif: Motif;
  color: string;
  relief?: number;
  strength?: number;
  scale?: number;
  vignette?: boolean;
  className?: string;
  style?: CSSProperties;
}) {
  const M = MOTIFS[motif];
  const id = uid.replace(/[^a-zA-Z0-9_-]/g, "");
  return (
    <svg aria-hidden className={`pointer-events-none absolute inset-0 h-full w-full ${className}`} style={style} preserveAspectRatio="none">
      <defs>
        <pattern id={`p${id}`} width={M.w} height={M.h} patternUnits="userSpaceOnUse" patternTransform={`scale(${scale})`}>
          <g fill="none" stroke="#000" strokeWidth={M.sw} strokeLinecap="round" strokeLinejoin="round" dangerouslySetInnerHTML={{ __html: M.svg }} />
        </pattern>
        <filter id={`f${id}`} x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
          <feGaussianBlur in="SourceAlpha" stdDeviation="1.3" result="b" />
          <feDiffuseLighting in="b" surfaceScale={relief} diffuseConstant="1" lightingColor="#fff">
            <feDistantLight azimuth="225" elevation="58" />
          </feDiffuseLighting>
        </filter>
        <filter id={`g${id}`} x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="4" />
          <feColorMatrix values="0 0 0 0 .5  0 0 0 0 .5  0 0 0 0 .5  0 0 0 .55 0" />
        </filter>
        <radialGradient id={`v${id}`} cx="50%" cy="35%" r="80%">
          <stop offset="0" stopColor="#fff" stopOpacity=".22" />
          <stop offset=".6" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity=".5" />
        </radialGradient>
      </defs>
      <rect width="100%" height="100%" fill={color} />
      <rect width="100%" height="100%" fill={`url(#p${id})`} filter={`url(#f${id})`} style={{ mixBlendMode: "overlay", opacity: strength }} />
      <rect width="100%" height="100%" filter={`url(#g${id})`} style={{ mixBlendMode: "overlay", opacity: 0.35 }} />
      {vignette && <rect width="100%" height="100%" fill={`url(#v${id})`} style={{ mixBlendMode: "soft-light" }} />}
    </svg>
  );
}

/** Wax (or foil) seal with an engraved monogram, lit like a real object. */
export function WaxSeal({ uid, colors, monogram, size = 120, half }: { uid: string; colors: [string, string, string]; monogram: string; size?: number; half?: "left" | "right" }) {
  const id = uid.replace(/[^a-zA-Z0-9_-]/g, "");
  const N = 72;
  const R = 54;
  let d = "";
  for (let i = 0; i <= N; i++) {
    const a = (i / N) * Math.PI * 2;
    const r = R * (1 + 0.045 * Math.sin(a * 7 + 1) + 0.025 * Math.sin(a * 17) + 0.015 * Math.sin(a * 29));
    d += `${i ? "L" : "M"}${(60 + r * Math.cos(a)).toFixed(2)} ${(60 + r * Math.sin(a)).toFixed(2)}`;
  }
  // A jagged crack down the middle, for the two halves after the seal breaks.
  const crack = "M60 0 L56 18 L63 34 L55 50 L64 66 L57 84 L62 100 L59 120";
  const clip = half === "left" ? `M0 0 ${crack.replace(/^M/, "L")} L0 120Z` : half === "right" ? `M120 0 ${crack.replace(/^M/, "L")} L120 120Z` : undefined;
  return (
    <svg viewBox="0 0 120 120" width={size} height={size} aria-hidden>
      <defs>
        <radialGradient id={`sg${id}`} cx="38%" cy="32%" r="75%">
          <stop offset="0" stopColor={colors[0]} />
          <stop offset=".55" stopColor={colors[1]} />
          <stop offset="1" stopColor={colors[2]} />
        </radialGradient>
        <filter id={`se${id}`} x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="1.6" result="b" />
          <feSpecularLighting in="b" surfaceScale="3" specularConstant=".9" specularExponent="18" lightingColor="#fff" result="s">
            <fePointLight x="30" y="10" z="70" />
          </feSpecularLighting>
          <feComposite in="s" in2="SourceAlpha" operator="in" result="sp" />
          <feComposite in="SourceGraphic" in2="sp" operator="arithmetic" k2="1" k3=".75" />
        </filter>
        <filter id={`en${id}`}>
          <feGaussianBlur in="SourceAlpha" stdDeviation=".8" result="b" />
          <feOffset dx="-.8" dy="-.8" in="b" result="o1" />
          <feOffset dx=".9" dy=".9" in="b" result="o2" />
          <feFlood floodColor="#fff" floodOpacity=".55" />
          <feComposite in2="o2" operator="in" result="hi" />
          <feFlood floodColor="#000" floodOpacity=".55" />
          <feComposite in2="o1" operator="in" result="lo" />
          <feMerge>
            <feMergeNode in="lo" />
            <feMergeNode in="hi" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        {clip && (
          <clipPath id={`c${id}`}>
            <path d={clip} />
          </clipPath>
        )}
      </defs>
      <g clipPath={clip ? `url(#c${id})` : undefined}>
        <path d={`${d}Z`} fill={`url(#sg${id})`} filter={`url(#se${id})`} />
        <g filter={`url(#en${id})`}>
          <circle cx="60" cy="60" r="38" fill="none" stroke={colors[2]} strokeWidth="2" opacity=".7" />
          <circle cx="60" cy="60" r="34" fill="none" stroke={colors[2]} strokeWidth=".8" strokeDasharray="1.5 2.5" opacity=".7" />
          <text
            x="60"
            y={monogram.length > 3 ? 67 : 70}
            textAnchor="middle"
            fontFamily="var(--font-aref), var(--font-cormorant), serif"
            fontStyle={/[a-z]/i.test(monogram) ? "italic" : "normal"}
            fontSize={monogram.length > 3 ? 22 : 30}
            fill={colors[1]}
          >
            {monogram}
          </text>
        </g>
        {clip && <path d={crack} fill="none" stroke={colors[2]} strokeWidth="1.2" />}
      </g>
    </svg>
  );
}
