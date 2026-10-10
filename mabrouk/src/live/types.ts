import { z } from "zod";
import type { L10n } from "@/lib/types";
import type { ShowcaseTemplate } from "@/catalog/types";

/**
 * A production invitation: a snapshot of a catalog design, customised for
 * one couple, served at /i/<slug>. Snapshotting means later edits to the
 * catalog design never change an invitation that's already been sent.
 */
export interface LiveInvitation {
  slug: string;
  status: "active" | "inactive";
  /** Catalog design it started from. */
  templateId: string;
  /** The customised design (texts, photos, sections, music…). */
  template: ShowcaseTemplate;
  clientName: string;
  /** Digits, international format. */
  clientPhone: string;
  orderId?: string;
  validity: Validity;
  /** Computed from `validity` + the event date when saved (ISO). */
  validFrom: string | null;
  validUntil: string | null;
  /** Secret for the couple's RSVP dashboard: /host/<slug>?key=… */
  hostKey: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * - "event": live from now until the end of the day after the event
 *   (late-night weddings keep working past midnight), plus `graceDays`.
 * - "range": live from `from` to `until` (inclusive days, event time zone).
 */
export const validitySchema = z.discriminatedUnion("mode", [
  z.object({ mode: z.literal("event"), graceDays: z.number().int().min(0).max(365) }),
  z.object({
    mode: z.literal("range"),
    from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    until: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  }),
]);
export type Validity = z.infer<typeof validitySchema>;

/** Row shape of the admin list (design snapshot left out). */
export type LiveInvitationSummary = Omit<LiveInvitation, "template"> & {
  templateName: L10n;
  templateKind: ShowcaseTemplate["kind"];
};

export type LiveState = "live" | "scheduled" | "expired" | "inactive";

export function liveState(inv: Pick<LiveInvitation, "status" | "validFrom" | "validUntil">, now: Date): LiveState {
  if (inv.status !== "active") return "inactive";
  if (inv.validFrom && now < new Date(inv.validFrom)) return "scheduled";
  if (inv.validUntil && now > new Date(inv.validUntil)) return "expired";
  return "live";
}

export const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
