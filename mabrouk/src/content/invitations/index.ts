import type { InvitationContent } from "@/lib/types";
import { omarLaila } from "./omar-laila";
import { faisalNoura } from "./faisal-noura";

/**
 * Every invitation served by the site. To publish a new order:
 *   1. `node scripts/new-codes.mjs <names> <guestCount>` for the slug, host key and guest codes
 *   2. copy omar-laila.ts to a new file and fill it in
 *   3. add it to this list and deploy
 */
export const invitations: InvitationContent[] = [
  omarLaila,
  // Same demo content in the other two themes, for the landing page gallery.
  { ...omarLaila, slug: "omar-laila-emerald", themeId: "emerald-night" },
  { ...omarLaila, slug: "omar-laila-blush", themeId: "blush-rose" },
  faisalNoura,
];
