import "server-only";
import { randomBytes } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { DEFAULT_TEMPLATES } from "./defaults";
import type { MediaMeta, PreviewLink, ShowcaseTemplate } from "./types";

/**
 * Persistence for the catalog: templates, uploaded media and client
 * preview links. Same pattern as src/storage: a local JSON file in dev,
 * Supabase (secret-gated RPC functions) when configured.
 */
export interface CatalogStore {
  readonly kind: "local" | "supabase";
  listTemplates(): Promise<ShowcaseTemplate[]>;
  getTemplate(id: string): Promise<ShowcaseTemplate | null>;
  saveTemplate(t: ShowcaseTemplate): Promise<void>;
  deleteTemplate(id: string): Promise<void>;

  listMedia(): Promise<MediaMeta[]>;
  getMedia(id: string): Promise<{ meta: MediaMeta; data: Buffer } | null>;
  putMedia(meta: MediaMeta, data: Buffer): Promise<void>;
  deleteMedia(id: string): Promise<void>;

  listLinks(templateId?: string): Promise<PreviewLink[]>;
  getLink(token: string): Promise<PreviewLink | null>;
  saveLink(link: PreviewLink): Promise<void>;
  deleteLink(token: string): Promise<void>;
}

export function newId(bytes = 9): string {
  return randomBytes(bytes).toString("base64url").replace(/[-_]/g, "x").toLowerCase();
}

const byOrder = (a: ShowcaseTemplate, b: ShowcaseTemplate) => a.sortOrder - b.sortOrder || a.id.localeCompare(b.id);

/* ------------------------------------------------------------------ */
/* Local JSON (dev)                                                    */
/* ------------------------------------------------------------------ */

interface LocalShape {
  templates: Record<string, ShowcaseTemplate>;
  media: Record<string, MediaMeta & { data: string }>;
  links: Record<string, PreviewLink>;
}

class LocalCatalogStore implements CatalogStore {
  readonly kind = "local" as const;
  private queue: Promise<unknown> = Promise.resolve();
  private readonly file =
    process.env.MABROUK_CATALOG_FILE ??
    (process.env.VERCEL ? "/tmp/mabrouk-catalog.json" : join(process.cwd(), ".data", "mabrouk-catalog.json"));

  private async read(): Promise<LocalShape> {
    try {
      return JSON.parse(await readFile(this.file, "utf8")) as LocalShape;
    } catch {
      return {
        templates: Object.fromEntries(DEFAULT_TEMPLATES.map((t) => [t.id, t])),
        media: {},
        links: {},
      };
    }
  }

  private mutate<T>(fn: (db: LocalShape) => T): Promise<T> {
    const run = this.queue.then(async () => {
      const db = await this.read();
      const out = fn(db);
      await mkdir(dirname(this.file), { recursive: true });
      const tmp = `${this.file}.${process.pid}.tmp`;
      await writeFile(tmp, JSON.stringify(db));
      await rename(tmp, this.file);
      return out;
    });
    this.queue = run.catch(() => undefined);
    return run;
  }

  async listTemplates() {
    return Object.values((await this.read()).templates).sort(byOrder);
  }
  async getTemplate(id: string) {
    return (await this.read()).templates[id] ?? null;
  }
  async saveTemplate(t: ShowcaseTemplate) {
    await this.mutate((db) => void (db.templates[t.id] = t));
  }
  async deleteTemplate(id: string) {
    await this.mutate((db) => {
      delete db.templates[id];
      for (const [k, l] of Object.entries(db.links)) if (l.templateId === id) delete db.links[k];
    });
  }

  async listMedia() {
    return Object.values((await this.read()).media)
      .map((m) => ({ id: m.id, kind: m.kind, name: m.name, mime: m.mime, size: m.size, createdAt: m.createdAt }))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
  async getMedia(id: string) {
    const m = (await this.read()).media[id];
    if (!m) return null;
    const { data, ...meta } = m;
    return { meta, data: Buffer.from(data, "base64") };
  }
  async putMedia(meta: MediaMeta, data: Buffer) {
    await this.mutate((db) => void (db.media[meta.id] = { ...meta, data: data.toString("base64") }));
  }
  async deleteMedia(id: string) {
    await this.mutate((db) => void delete db.media[id]);
  }

  async listLinks(templateId?: string) {
    return Object.values((await this.read()).links)
      .filter((l) => !templateId || l.templateId === templateId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
  async getLink(token: string) {
    return (await this.read()).links[token] ?? null;
  }
  async saveLink(link: PreviewLink) {
    await this.mutate((db) => void (db.links[link.token] = link));
  }
  async deleteLink(token: string) {
    await this.mutate((db) => void delete db.links[token]);
  }
}

/* ------------------------------------------------------------------ */
/* Supabase                                                            */
/* ------------------------------------------------------------------ */

class SupabaseCatalogStore implements CatalogStore {
  readonly kind = "supabase" as const;
  private readonly db: SupabaseClient;
  private seeded = false;

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

  /** Writes the default templates once per database (guarded server-side). */
  private async seed() {
    if (this.seeded) return;
    await this.rpc("catalog_seed_once", { p_templates: DEFAULT_TEMPLATES });
    this.seeded = true;
  }

  async listTemplates() {
    await this.seed();
    const rows = await this.rpc<ShowcaseTemplate[] | null>("catalog_list_templates");
    return (rows ?? []).sort(byOrder);
  }
  async getTemplate(id: string) {
    await this.seed();
    return this.rpc<ShowcaseTemplate | null>("catalog_get_template", { p_id: id });
  }
  async saveTemplate(t: ShowcaseTemplate) {
    await this.rpc("catalog_save_template", { p_id: t.id, p_data: t, p_status: t.status, p_sort: t.sortOrder });
  }
  async deleteTemplate(id: string) {
    await this.rpc("catalog_delete_template", { p_id: id });
  }

  async listMedia() {
    return (await this.rpc<MediaMeta[] | null>("catalog_list_media")) ?? [];
  }
  async getMedia(id: string) {
    const row = await this.rpc<(MediaMeta & { data: string }) | null>("catalog_get_media", { p_id: id });
    if (!row) return null;
    const { data, ...meta } = row;
    return { meta, data: Buffer.from(data, "base64") };
  }
  async putMedia(meta: MediaMeta, data: Buffer) {
    // Send in ~1 MB pieces to stay well under API request-size limits.
    const CHUNK = 1024 * 1024;
    await this.rpc("catalog_put_media", { p_meta: meta, p_data: data.subarray(0, CHUNK).toString("base64") });
    for (let i = CHUNK; i < data.length; i += CHUNK) {
      await this.rpc("catalog_append_media", { p_id: meta.id, p_data: data.subarray(i, i + CHUNK).toString("base64") });
    }
  }
  async deleteMedia(id: string) {
    await this.rpc("catalog_delete_media", { p_id: id });
  }

  async listLinks(templateId?: string) {
    return (await this.rpc<PreviewLink[] | null>("catalog_list_links", { p_template_id: templateId ?? null })) ?? [];
  }
  async getLink(token: string) {
    return this.rpc<PreviewLink | null>("catalog_get_link", { p_token: token });
  }
  async saveLink(link: PreviewLink) {
    await this.rpc("catalog_save_link", { p_token: link.token, p_template_id: link.templateId, p_data: link });
  }
  async deleteLink(token: string) {
    await this.rpc("catalog_delete_link", { p_token: token });
  }
}

let instance: CatalogStore | undefined;

export function getCatalogStore(): CatalogStore {
  if (!instance) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
    const secret = process.env.MABROUK_DB_SECRET;
    instance = url && key && secret ? new SupabaseCatalogStore(url, key, secret) : new LocalCatalogStore();
  }
  return instance;
}
