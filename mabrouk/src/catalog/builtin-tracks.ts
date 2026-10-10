/** Tracks shipped with the site (files under /public/audio, served by the CDN). */
export const BUILTIN_TRACK = "builtin:musicbox";

export const BUILTIN_TRACKS: Record<string, { title: string; src?: string }> = {
  [BUILTIN_TRACK]: { title: "Mabrouk Music Box" },
  "builtin:romantic-one": { title: "Romantic One", src: "/audio/romantic-one.mp3" },
  "builtin:shaabi-one": { title: "Shaabi One", src: "/audio/shaabi-one.mp3" },
};
