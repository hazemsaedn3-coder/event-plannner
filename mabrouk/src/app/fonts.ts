import { Amiri, Aref_Ruqaa, Cormorant_Garamond, Lalezar, Pinyon_Script } from "next/font/google";

// Arabic is the default language, so its fonts are preloaded; Latin fonts
// load on demand (display: swap) to stay inside the performance budget.

export const arefRuqaa = Aref_Ruqaa({
  subsets: ["arabic"],
  weight: ["400", "700"],
  variable: "--font-aref",
  display: "swap",
});

export const amiri = Amiri({
  subsets: ["arabic"],
  weight: ["400"],
  variable: "--font-amiri",
  display: "swap",
});

export const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
  preload: false,
});

export const pinyon = Pinyon_Script({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-pinyon",
  display: "swap",
  preload: false,
});

/** Bold poster face for the shaabi (Egyptian street-wedding) side. Loaded on demand. */
export const lalezar = Lalezar({
  subsets: ["arabic", "latin"],
  weight: "400",
  variable: "--font-lalezar",
  display: "swap",
  preload: false,
});

export const fontVariables = [arefRuqaa.variable, amiri.variable, cormorant.variable, pinyon.variable, lalezar.variable].join(" ");
