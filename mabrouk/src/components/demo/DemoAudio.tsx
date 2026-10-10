"use client";

import { createContext, useContext } from "react";

/**
 * Lets a template drive the demo's music dock, e.g. the two-entrance
 * template switches to the bride's or the groom's song when a side is
 * chosen. Null outside a demo page.
 */
export interface DemoAudio {
  /** Switch to a track and start playing (call from a tap handler). */
  playTrack: (trackId: string) => void;
}

export const DemoAudioContext = createContext<DemoAudio | null>(null);

export function useDemoAudio(): DemoAudio | null {
  return useContext(DemoAudioContext);
}
