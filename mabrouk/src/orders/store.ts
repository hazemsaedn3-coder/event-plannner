import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Order, OrderFile, OrderList, OrderStatus } from "./types";

/** Orders and the photos customers attach. Local JSON in dev, Supabase RPCs in production. */
export interface OrderStore {
  readonly kind: "local" | "supabase";
  create(order: Order, ipHash: string | null, fileIds: string[]): Promise<void>;
  save(order: Order): Promise<void>;
  get(id: string): Promise<Order | null>;
  list(opts: { status?: OrderStatus; query?: string; limit?: number; offset?: number }): Promise<OrderList>;
  putFile(meta: OrderFile, data: Buffer, ipHash: string | null): Promise<void>;
  getFile(id: string): Promise<{ meta: OrderFile; data: Buffer } | null>;
  listFiles(orderId: string): Promise<OrderFile[]>;
}

export class RateLimitError extends Error {}

/** Unguessable id (confirmation URL) and a short human reference. */
export function newOrderId() {
  return randomBytes(12).toString("base64url").replace(/[-_]/g, "x").toLowerCase();
}
export function newOrderRef() {
  const abc = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"; // no 0/O, 1/I
  const bytes = randomBytes(6);
  return `MBK-${Array.from(bytes, (b) => abc[b % abc.length]).join("")}`;
}
export function newFileId() {
  return randomBytes(9).toString("base64url").replace(/[-_]/g, "x").toLowerCase();
}

/** Salted hash of the client IP, used only for rate limiting. */
export function hashIp(req: Request): string | null {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "";
  if (!ip) return null;
  return createHash("sha256").update(`${process.env.MABROUK_SECRET ?? "mabrouk"}:${ip}`).digest("base64url").slice(0, 22);
}

const searchText = (o: Order) => [o.ref, o.groomName, o.brideName, o.whatsapp].join(" ").toLowerCase();

/* ------------------------------------------------------------------ */

interface LocalShape {
  orders: Record<string, Order & { ipHash?: string | null }>;
  files: Record<string, OrderFile & { data: string; ipHash?: string | null }>;
}

class LocalOrderStore implements OrderStore {
  readonly kind = "local" as const;
  private queue: Promise<unknown> = Promise.resolve();
  private readonly file =
    process.env.MABROUK_ORDERS_FILE ?? (process.env.VERCEL ? "/tmp/mabrouk-orders.json" : join(process.cwd(), ".data", "mabrouk-orders.json"));

  private async read(): Promise<LocalShape> {
    try {
      return JSON.parse(await readFile(this.file, "utf8"));
    } catch {
      return { orders: {}, files: {} };
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
  private recent<T extends { createdAt: string; ipHash?: string | null }>(rows: T[], ipHash: string | null) {
    const hourAgo = Date.now() - 3600_000;
    return ipHash ? rows.filter((r) => r.ipHash === ipHash && Date.parse(r.createdAt) > hourAgo).length : 0;
  }
  async create(order: Order, ipHash: string | null, fileIds: string[]) {
    await this.mutate((db) => {
      if (this.recent(Object.values(db.orders), ipHash) >= 5) throw new RateLimitError();
      db.orders[order.id] = { ...order, ipHash };
      for (const id of fileIds) if (db.files[id] && !db.files[id].orderId) db.files[id].orderId = order.id;
    });
  }
  async save(order: Order) {
    await this.mutate((db) => {
      if (db.orders[order.id]) db.orders[order.id] = { ...order, ipHash: db.orders[order.id].ipHash };
    });
  }
  async get(id: string) {
    const o = (await this.read()).orders[id];
    if (!o) return null;
    const { ipHash: _ignored, ...order } = o;
    void _ignored;
    return order;
  }
  async list({ status, query, limit = 50, offset = 0 }: { status?: OrderStatus; query?: string; limit?: number; offset?: number }) {
    const q = query?.trim().toLowerCase();
    const all = Object.values((await this.read()).orders)
      .filter((o) => !q || searchText(o).includes(q))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const counts: OrderList["counts"] = {};
    for (const o of all) counts[o.status] = (counts[o.status] ?? 0) + 1;
    const filtered = status ? all.filter((o) => o.status === status) : all;
    return {
      items: filtered.slice(offset, offset + limit).map(({ ipHash: _i, ...o }) => (void _i, o)),
      total: filtered.length,
      counts,
    };
  }
  async putFile(meta: OrderFile, data: Buffer, ipHash: string | null) {
    await this.mutate((db) => {
      if (this.recent(Object.values(db.files), ipHash) >= 30) throw new RateLimitError();
      db.files[meta.id] = { ...meta, orderId: null, data: data.toString("base64"), ipHash };
    });
  }
  async getFile(id: string) {
    const f = (await this.read()).files[id];
    if (!f) return null;
    const { data, ipHash: _i, ...meta } = f;
    void _i;
    return { meta, data: Buffer.from(data, "base64") };
  }
  async listFiles(orderId: string) {
    return Object.values((await this.read()).files)
      .filter((f) => f.orderId === orderId)
      .map(({ data: _d, ipHash: _i, ...m }) => (void _d, void _i, m));
  }
}

/* ------------------------------------------------------------------ */

class SupabaseOrderStore implements OrderStore {
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
    if (error) {
      if (error.message.includes("rate_limited")) throw new RateLimitError();
      throw new Error(`${fn}: ${error.message}`);
    }
    return data as T;
  }
  async create(order: Order, ipHash: string | null, fileIds: string[]) {
    await this.rpc("orders_create", { p_order: order, p_ip_hash: ipHash, p_file_ids: fileIds });
  }
  async save(order: Order) {
    await this.rpc("orders_save", { p_order: order });
  }
  async get(id: string) {
    return this.rpc<Order | null>("orders_get", { p_id: id });
  }
  async list({ status, query, limit = 50, offset = 0 }: { status?: OrderStatus; query?: string; limit?: number; offset?: number }) {
    return this.rpc<OrderList>("orders_list", { p_status: status ?? null, p_query: query ?? null, p_limit: limit, p_offset: offset });
  }
  async putFile(meta: OrderFile, data: Buffer, ipHash: string | null) {
    await this.rpc("orders_put_file", { p_meta: meta, p_data: data.toString("base64"), p_ip_hash: ipHash });
  }
  async getFile(id: string) {
    const row = await this.rpc<(OrderFile & { data: string }) | null>("orders_get_file", { p_id: id });
    if (!row) return null;
    const { data, ...meta } = row;
    return { meta, data: Buffer.from(data, "base64") };
  }
  async listFiles(orderId: string) {
    return (await this.rpc<OrderFile[] | null>("orders_list_files", { p_order_id: orderId })) ?? [];
  }
}

let instance: OrderStore | undefined;

export function getOrderStore(): OrderStore {
  if (!instance) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
    const secret = process.env.MABROUK_DB_SECRET;
    instance = url && key && secret ? new SupabaseOrderStore(url, key, secret) : new LocalOrderStore();
  }
  return instance;
}
