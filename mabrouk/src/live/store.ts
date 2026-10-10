import "server-only";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { LiveInvitation, LiveInvitationSummary } from "./types";

export interface Usage {
  views: number;
  rsvps: number;
  attending: number;
}

/** Production invitations. Local JSON in dev, Supabase RPCs in production. */
export interface LiveStore {
  readonly kind: "local" | "supabase";
  list(): Promise<LiveInvitationSummary[]>;
  get(slug: string): Promise<LiveInvitation | null>;
  save(inv: LiveInvitation): Promise<void>;
  delete(slug: string): Promise<void>;
  usage(): Promise<Record<string, Usage>>;
}

const summary = (inv: LiveInvitation): LiveInvitationSummary => {
  const { template, ...rest } = inv;
  return { ...rest, templateName: template.name, templateKind: template.kind };
};

class LocalLiveStore implements LiveStore {
  readonly kind = "local" as const;
  private queue: Promise<unknown> = Promise.resolve();
  private readonly file =
    process.env.MABROUK_LIVE_FILE ?? (process.env.VERCEL ? "/tmp/mabrouk-live.json" : join(process.cwd(), ".data", "mabrouk-live.json"));

  private async read(): Promise<Record<string, LiveInvitation>> {
    try {
      return JSON.parse(await readFile(this.file, "utf8"));
    } catch {
      return {};
    }
  }
  private mutate(fn: (db: Record<string, LiveInvitation>) => void) {
    const run = this.queue.then(async () => {
      const db = await this.read();
      fn(db);
      await mkdir(dirname(this.file), { recursive: true });
      const tmp = `${this.file}.${process.pid}.tmp`;
      await writeFile(tmp, JSON.stringify(db));
      await rename(tmp, this.file);
    });
    this.queue = run.catch(() => undefined);
    return run;
  }
  async list() {
    return Object.values(await this.read())
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .map(summary);
  }
  async get(slug: string) {
    return (await this.read())[slug] ?? null;
  }
  async save(inv: LiveInvitation) {
    await this.mutate((db) => void (db[inv.slug] = inv));
  }
  async delete(slug: string) {
    await this.mutate((db) => void delete db[slug]);
  }
  async usage() {
    // The dev storage tracks views/RSVPs in its own file; totals come from there.
    const { getStorage } = await import("@/storage");
    const storage = getStorage();
    const out: Record<string, Usage> = {};
    for (const slug of Object.keys(await this.read())) {
      const [rsvps, views] = await Promise.all([storage.listRsvps(slug), storage.countViews(slug)]);
      out[slug] = {
        views: views.total,
        rsvps: rsvps.length,
        attending: rsvps.filter((r) => r.attending).reduce((s, r) => s + r.headcount, 0),
      };
    }
    return out;
  }
}

class SupabaseLiveStore implements LiveStore {
  readonly kind = "supabase" as const;
  private readonly db: SupabaseClient;
  constructor(
    url: string,
    key: string,
    private readonly secret: string,
  ) {
    this.db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  }
  private async rpc<T>(fn: string, args: Record<string, unknown> = {}): Promise<T> {
    const { data, error } = await this.db.rpc(fn, { p_secret: this.secret, ...args });
    if (error) throw new Error(`${fn}: ${error.message}`);
    return data as T;
  }
  async list() {
    return (await this.rpc<LiveInvitationSummary[] | null>("live_list")) ?? [];
  }
  async get(slug: string) {
    return this.rpc<LiveInvitation | null>("live_get", { p_slug: slug });
  }
  async save(inv: LiveInvitation) {
    await this.rpc("live_save", { p_inv: inv });
  }
  async delete(slug: string) {
    await this.rpc("live_delete", { p_slug: slug });
  }
  async usage() {
    return (await this.rpc<Record<string, Usage> | null>("live_usage")) ?? {};
  }
}

let instance: LiveStore | undefined;

export function getLiveStore(): LiveStore {
  if (!instance) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
    const secret = process.env.MABROUK_DB_SECRET;
    instance = url && key && secret ? new SupabaseLiveStore(url, key, secret) : new LocalLiveStore();
  }
  return instance;
}
