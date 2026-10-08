import "server-only";
import { randomUUID } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getInvitation } from "@/lib/invitations";
import type { InvitationContent, Locale, RsvpInput, RsvpRecord, ViewEventInput } from "@/lib/types";
import type { StorageAdapter } from "./types";

interface RsvpRow {
  id: string;
  invitation_slug: string;
  guest_code: string | null;
  name: string;
  attending: boolean;
  headcount: number;
  message: string | null;
  locale: Locale;
  created_at: string;
  updated_at: string;
}

function fromRow(r: RsvpRow): RsvpRecord {
  return {
    id: r.id,
    invitationSlug: r.invitation_slug,
    guestCode: r.guest_code ?? undefined,
    name: r.name,
    attending: r.attending,
    headcount: r.headcount,
    message: r.message ?? undefined,
    locale: r.locale,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export class SupabaseStorage implements StorageAdapter {
  readonly kind = "supabase" as const;
  private readonly db: SupabaseClient;
  /** Slugs mirrored in this server instance, so RSVP foreign keys resolve. */
  private readonly synced = new Set<string>();

  constructor(url: string, serviceRoleKey: string) {
    this.db = createClient(url, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }

  private async ensureSynced(slug: string) {
    if (this.synced.has(slug)) return;
    const inv = getInvitation(slug);
    if (inv) await this.syncInvitation(inv);
  }

  async saveRsvp(input: RsvpInput): Promise<RsvpRecord> {
    await this.ensureSynced(input.invitationSlug);
    const dedupeKey = input.guestCode
      ? `${input.invitationSlug}:${input.guestCode}`
      : `${input.invitationSlug}:anon:${randomUUID()}`;
    const { data, error } = await this.db
      .from("rsvps")
      .upsert(
        {
          invitation_slug: input.invitationSlug,
          guest_code: input.guestCode ?? null,
          dedupe_key: dedupeKey,
          name: input.name,
          attending: input.attending,
          headcount: input.headcount,
          message: input.message ?? null,
          locale: input.locale,
        },
        { onConflict: "dedupe_key" },
      )
      .select()
      .single();
    if (error) throw new Error(`saveRsvp: ${error.message}`);
    return fromRow(data as RsvpRow);
  }

  async listRsvps(invitationSlug: string): Promise<RsvpRecord[]> {
    const { data, error } = await this.db
      .from("rsvps")
      .select("*")
      .eq("invitation_slug", invitationSlug)
      .order("updated_at", { ascending: false });
    if (error) throw new Error(`listRsvps: ${error.message}`);
    return (data as RsvpRow[]).map(fromRow);
  }

  async recordView(event: ViewEventInput): Promise<void> {
    await this.ensureSynced(event.invitationSlug);
    const { error } = await this.db.from("view_events").insert({
      invitation_slug: event.invitationSlug,
      guest_code: event.guestCode ?? null,
      kind: event.kind,
      locale: event.locale,
    });
    if (error) throw new Error(`recordView: ${error.message}`);
  }

  async countViews(invitationSlug: string) {
    const { data, error } = await this.db
      .from("view_events")
      .select("guest_code")
      .eq("invitation_slug", invitationSlug)
      .limit(10_000);
    if (error) throw new Error(`countViews: ${error.message}`);
    const byGuest: Record<string, number> = {};
    for (const row of data as { guest_code: string | null }[]) {
      if (row.guest_code) byGuest[row.guest_code] = (byGuest[row.guest_code] ?? 0) + 1;
    }
    return { total: data.length, byGuest };
  }

  async syncInvitation(inv: InvitationContent): Promise<void> {
    // Secrets and guests are stored in their own columns/table, not in `content`.
    const { pin, hostKey, guests, ...content } = inv;
    const { error } = await this.db.from("invitations").upsert({
      slug: inv.slug,
      template_id: inv.templateId,
      template_version: inv.templateVersion,
      theme_id: inv.themeId,
      market: inv.market,
      tone: inv.tone,
      default_locale: inv.defaultLocale,
      status: inv.status,
      is_demo: Boolean(inv.isDemo),
      time_zone: inv.timeZone,
      show_hijri: inv.showHijri,
      main_event_id: inv.mainEventId,
      content,
      host_key: hostKey,
      pin: pin ?? null,
      expires_at: inv.expiresAt ?? null,
    });
    if (error) throw new Error(`syncInvitation: ${error.message}`);

    // Upsert (never delete) so existing RSVPs keep their guest rows.
    const subEvents = inv.subEvents.map((e) => ({
      invitation_slug: inv.slug,
      id: e.id,
      kind: e.kind,
      title: e.title ?? null,
      starts_at: e.startsAt,
      ends_at: e.endsAt ?? null,
      venue: e.venue,
      audience: e.audience,
      visibility: e.visibility,
      dress_code: e.dressCode ?? null,
      note: e.note ?? null,
    }));
    const guestRows = guests.map((g) => ({
      invitation_slug: inv.slug,
      code: g.code,
      display_name: g.displayName,
      latin_name: g.latinName,
      seats: g.seats,
      sub_event_ids: g.subEventIds ?? null,
      phone: g.phone ?? null,
      locale: g.locale ?? null,
      host_note: g.hostNote ?? null,
    }));
    const r1 = await this.db.from("sub_events").upsert(subEvents);
    if (r1.error) throw new Error(`syncInvitation(sub_events): ${r1.error.message}`);
    if (guestRows.length) {
      const r2 = await this.db.from("guests").upsert(guestRows);
      if (r2.error) throw new Error(`syncInvitation(guests): ${r2.error.message}`);
    }
    this.synced.add(inv.slug);
  }
}
