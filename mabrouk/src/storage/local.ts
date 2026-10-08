import "server-only";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import type { InvitationContent, RsvpInput, RsvpRecord, ViewEventInput } from "@/lib/types";
import type { StorageAdapter } from "./types";

interface ViewRecord extends ViewEventInput {
  id: string;
  createdAt: string;
}

interface DbShape {
  invitations: Record<string, { slug: string; syncedAt: string }>;
  rsvps: RsvpRecord[];
  views: ViewRecord[];
}

const EMPTY: DbShape = { invitations: {}, rsvps: [], views: [] };

/**
 * JSON-file storage for development. On serverless hosts without Supabase it
 * falls back to /tmp, which is ephemeral: fine for a preview, not for real orders.
 */
export class LocalJsonStorage implements StorageAdapter {
  readonly kind = "local" as const;
  private readonly file: string;
  /** Serializes writes so concurrent requests don't clobber each other. */
  private queue: Promise<unknown> = Promise.resolve();

  constructor(file?: string) {
    this.file =
      file ??
      process.env.MABROUK_DATA_FILE ??
      (process.env.VERCEL ? "/tmp/mabrouk-data.json" : join(process.cwd(), ".data", "mabrouk-dev.json"));
  }

  private async read(): Promise<DbShape> {
    try {
      return { ...EMPTY, ...(JSON.parse(await readFile(this.file, "utf8")) as DbShape) };
    } catch {
      return structuredClone(EMPTY);
    }
  }

  private mutate<T>(fn: (db: DbShape) => T): Promise<T> {
    const run = this.queue.then(async () => {
      const db = await this.read();
      const result = fn(db);
      await mkdir(dirname(this.file), { recursive: true });
      const tmp = `${this.file}.${process.pid}.tmp`;
      await writeFile(tmp, JSON.stringify(db, null, 2));
      await rename(tmp, this.file);
      return result;
    });
    this.queue = run.catch(() => undefined);
    return run;
  }

  saveRsvp(input: RsvpInput): Promise<RsvpRecord> {
    return this.mutate((db) => {
      const now = new Date().toISOString();
      const existing = input.guestCode
        ? db.rsvps.find((r) => r.invitationSlug === input.invitationSlug && r.guestCode === input.guestCode)
        : undefined;
      if (existing) {
        Object.assign(existing, input, { updatedAt: now });
        return { ...existing };
      }
      const record: RsvpRecord = { ...input, id: randomUUID(), createdAt: now, updatedAt: now };
      db.rsvps.push(record);
      return record;
    });
  }

  async listRsvps(invitationSlug: string): Promise<RsvpRecord[]> {
    const db = await this.read();
    return db.rsvps
      .filter((r) => r.invitationSlug === invitationSlug)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  async recordView(event: ViewEventInput): Promise<void> {
    await this.mutate((db) => {
      db.views.push({ ...event, id: randomUUID(), createdAt: new Date().toISOString() });
    });
  }

  async countViews(invitationSlug: string) {
    const db = await this.read();
    const views = db.views.filter((v) => v.invitationSlug === invitationSlug);
    const byGuest: Record<string, number> = {};
    for (const v of views) if (v.guestCode) byGuest[v.guestCode] = (byGuest[v.guestCode] ?? 0) + 1;
    return { total: views.length, byGuest };
  }

  async syncInvitation(inv: InvitationContent): Promise<void> {
    await this.mutate((db) => {
      db.invitations[inv.slug] = { slug: inv.slug, syncedAt: new Date().toISOString() };
    });
  }
}
