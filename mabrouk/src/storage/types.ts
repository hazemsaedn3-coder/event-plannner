import type { InvitationContent, RsvpInput, RsvpRecord, ViewEventInput } from "@/lib/types";

/**
 * Storage for the mutable data (RSVPs and view events) plus a mirror of the
 * invitation content. Invitation content itself is authored in typed files
 * under src/content/invitations for now.
 *
 * - LocalJsonStorage: a JSON file under .data/ (dev). Zero setup.
 * - SupabaseStorage: used automatically when SUPABASE_URL and
 *   SUPABASE_SERVICE_ROLE_KEY are set. Schema: supabase/schema.sql.
 */
export interface StorageAdapter {
  readonly kind: "local" | "supabase";

  /**
   * Personal links (guestCode set) upsert: a guest's latest reply wins.
   * General-link replies are always inserted.
   */
  saveRsvp(input: RsvpInput): Promise<RsvpRecord>;
  listRsvps(invitationSlug: string): Promise<RsvpRecord[]>;

  recordView(event: ViewEventInput): Promise<void>;
  countViews(invitationSlug: string): Promise<{ total: number; byGuest: Record<string, number> }>;

  /** Mirror an invitation's content (invitation, sub-events, guests) into storage. */
  syncInvitation(inv: InvitationContent): Promise<void>;
}
