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

/**
 * Supabase storage through the secret-gated RPC functions in
 * supabase/schema.sql. The tables themselves are closed to the public API,
 * so the publishable key alone can do nothing; every call carries
 * MABROUK_DB_SECRET, which only this server knows.
 */
export class SupabaseStorage implements StorageAdapter {
  readonly kind = "supabase" as const;
  private readonly db: SupabaseClient;
  /** Slugs mirrored in this server instance, so RSVP foreign keys resolve. */
  private readonly synced = new Set<string>();

  constructor(
    url: string,
    key: string,
    private readonly secret: string,
  ) {
    this.db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  }

  private async rpc<T>(fn: string, args: Record<string, unknown>): Promise<T> {
    const { data, error } = await this.db.rpc(fn, { p_secret: this.secret, ...args });
    if (error) throw new Error(`${fn}: ${error.message}`);
    return data as T;
  }

  private async ensureSynced(slug: string) {
    if (this.synced.has(slug)) return;
    // Production invitations made in the admin are mirrored on save; this re-mirrors them if needed.
    const inv = getInvitation(slug) ?? (await (await import("@/live/read")).liveContent(slug, new Date(), { ignoreWindow: true }));
    if (inv) await this.syncInvitation(inv);
  }

  async saveRsvp(input: RsvpInput): Promise<RsvpRecord> {
    await this.ensureSynced(input.invitationSlug);
    const row = await this.rpc<RsvpRow>("mabrouk_save_rsvp", {
      p_rsvp: {
        invitation_slug: input.invitationSlug,
        guest_code: input.guestCode ?? null,
        dedupe_key: input.guestCode
          ? `${input.invitationSlug}:${input.guestCode}`
          : `${input.invitationSlug}:anon:${randomUUID()}`,
        name: input.name,
        attending: input.attending,
        headcount: input.headcount,
        message: input.message ?? null,
        locale: input.locale,
      },
    });
    return fromRow(row);
  }

  async listRsvps(invitationSlug: string): Promise<RsvpRecord[]> {
    const rows = await this.rpc<RsvpRow[]>("mabrouk_list_rsvps", { p_slug: invitationSlug });
    return rows.map(fromRow);
  }

  async recordView(event: ViewEventInput): Promise<void> {
    await this.ensureSynced(event.invitationSlug);
    await this.rpc("mabrouk_record_view", {
      p_slug: event.invitationSlug,
      p_guest_code: event.guestCode ?? null,
      p_locale: event.locale,
    });
  }

  async countViews(invitationSlug: string) {
    return this.rpc<{ total: number; byGuest: Record<string, number> }>("mabrouk_count_views", {
      p_slug: invitationSlug,
    });
  }

  async syncInvitation(inv: InvitationContent): Promise<void> {
    // Secrets and guests live in their own columns/table, not in `content`.
    const { pin, hostKey, guests, ...content } = inv;
    await this.rpc("mabrouk_sync_invitation", {
      p_invitation: {
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
      },
      p_sub_events: inv.subEvents.map((e) => ({
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
      })),
      p_guests: guests.map((g) => ({
        invitation_slug: inv.slug,
        code: g.code,
        display_name: g.displayName,
        latin_name: g.latinName,
        seats: g.seats,
        sub_event_ids: g.subEventIds ?? null,
        phone: g.phone ?? null,
        locale: g.locale ?? null,
        host_note: g.hostNote ?? null,
      })),
    });
    this.synced.add(inv.slug);
  }
}
