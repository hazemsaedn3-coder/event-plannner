import type { Features, NoorDemoConfig } from "./types";

/**
 * Defaults for the optional parts of a design's content, so designs saved
 * before a feature existed keep working and every reader sees one shape.
 * Shared by the server (rendering) and the admin editor (client).
 */

export const ALL_ON: Features = {
  countdown: true,
  couplePhotos: true,
  music: true,
  venue: true,
  timeline: true,
  venueImages: true,
  mapsButton: true,
  gallery: true,
  rsvp: true,
  dressCode: true,
  gifts: true,
  contact: true,
  notes: true,
  share: true,
  animations: true,
};

const EMPTY = { ar: "", en: "" };

export type ResolvedNoor = Required<NoorDemoConfig> & { features: Features };

export function resolveNoor(c: NoorDemoConfig): ResolvedNoor {
  return {
    ...c,
    features: { ...ALL_ON, ...(c.features ?? {}) },
    galleryLayout: c.galleryLayout ?? "carousel",
    // Designs from before couple photos existed used a single hero photo.
    couple: c.couple ?? { images: c.heroImage ? [c.heroImage] : [], layout: "arch" },
    venueShowcase: c.venueShowcase ?? { images: [], layout: "carousel", title: EMPTY, story: EMPTY },
    timeline: c.timeline ?? [],
    gifts: c.gifts ?? { message: EMPTY, accounts: [] },
    contacts: c.contacts ?? [],
    notes: c.notes ?? { title: EMPTY, body: EMPTY },
    rsvpSettings: c.rsvpSettings ?? { deadline: "", maxHeadcount: 4 },
    countdown: c.countdown ?? { title: EMPTY, showSeconds: true },
  };
}

export const hasText = (v?: { ar: string; en: string }) => Boolean(v && (v.ar.trim() || v.en.trim()));
