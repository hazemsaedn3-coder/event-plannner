import "server-only";
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { DEFAULT_TEMPLATES } from "./defaults";
import { newId } from "./store";
import { BUILTIN_TRACK, templateSchema, type ShowcaseTemplate } from "./types";

export function slugify(s: string): string {
  return (
    s
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "template"
  );
}

export function blankTemplate(kind: "noor" | "html" | "duo", id: string): ShowcaseTemplate {
  const base = DEFAULT_TEMPLATES.find((t) => t.kind === kind)!;
  return {
    ...structuredClone(base),
    id,
    status: "draft",
    sortOrder: 100,
    name: { ar: "تصميم جديد", en: "New design" },
    thumbnail: "",
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Accepts the export format `{ format: "mabrouk-template", template }` or a
 * bare template object; missing fields are filled from a blank template.
 */
export function templateFromJson(raw: unknown, fallbackName: string): ShowcaseTemplate {
  const obj = (raw && typeof raw === "object" && "template" in raw ? (raw as { template: unknown }).template : raw) as
    | Partial<ShowcaseTemplate>
    | undefined;
  if (!obj || typeof obj !== "object") throw new Error("JSON must be a template object");
  const kind = obj.kind === "noor" || obj.kind === "duo" ? obj.kind : "html";
  const blank = blankTemplate(kind, `${slugify(obj.id ?? obj.name?.en ?? fallbackName)}-${newId(3)}`);
  const merged = {
    ...blank,
    ...obj,
    id: blank.id, // always a fresh id: importing never overwrites an existing template
    status: "draft" as const,
    noor: kind !== "html" ? { ...blank.noor!, ...(obj.noor ?? {}) } : undefined,
    duo: kind === "duo" ? { ...blank.duo!, ...(obj.duo ?? {}) } : undefined,
    html: kind === "html" ? { ...blank.html!, ...(obj.html ?? {}) } : undefined,
    variables: obj.variables ?? (kind === "html" ? {} : blank.variables),
    music: obj.music ?? { trackIds: [BUILTIN_TRACK], defaultTrackId: BUILTIN_TRACK },
    updatedAt: new Date().toISOString(),
  };
  const parsed = templateSchema.safeParse(merged);
  if (!parsed.success) throw new Error(`Invalid template JSON: ${parsed.error.issues[0]?.path.join(".")} ${parsed.error.issues[0]?.message}`);
  return parsed.data;
}

/** HTML (+ optional CSS/JS) → a draft html template. */
export function templateFromCode(name: string, code: { html: string; css?: string; js?: string; baseUrl?: string }): ShowcaseTemplate {
  const id = `${slugify(name)}-${newId(3)}`;
  const t = blankTemplate("html", id);
  const title = code.html.match(/<title[^>]*>([^<]{1,120})<\/title>/i)?.[1]?.trim() || name;
  // Variables that appear in the code start out as their own names, so the admin sees what to fill.
  const keys = new Set([...code.html.matchAll(/\{\{\s*([a-zA-Z0-9_]{1,40})\s*\}\}/g)].map((m) => m[1]));
  return templateSchema.parse({
    ...t,
    name: { ar: title, en: title },
    description: { ar: "", en: "" },
    html: { html: code.html, css: code.css ?? "", js: code.js ?? "", baseUrl: code.baseUrl ?? "" },
    variables: Object.fromEntries([...keys].map((k) => [k, k])),
  });
}

/* ------------------------------------------------------------------ */
/* URL import (server-side fetch, guarded against SSRF)                */
/* ------------------------------------------------------------------ */

function isPrivateAddress(ip: string): boolean {
  if (isIP(ip) === 6) {
    const v = ip.toLowerCase();
    return v === "::1" || v.startsWith("fc") || v.startsWith("fd") || v.startsWith("fe80") || v === "::" || v.startsWith("::ffff:");
  }
  const [a, b] = ip.split(".").map(Number);
  return (
    a === 10 ||
    a === 127 ||
    a === 0 ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 100 && b >= 64 && b <= 127) ||
    a >= 224
  );
}

const MAX_IMPORT_BYTES = 2 * 1024 * 1024;

export async function fetchForImport(rawUrl: string): Promise<{ body: string; contentType: string; finalUrl: string }> {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new Error("That is not a valid URL");
  }
  for (let hop = 0; hop < 4; hop++) {
    if (url.protocol !== "https:" && url.protocol !== "http:") throw new Error("Only http(s) URLs can be imported");
    const host = url.hostname.replace(/^\[|\]$/g, "");
    const addrs = isIP(host) ? [host] : (await lookup(host, { all: true })).map((a) => a.address);
    if (!addrs.length || addrs.some(isPrivateAddress)) throw new Error("That address is not allowed");

    const res = await fetch(url, {
      redirect: "manual",
      signal: AbortSignal.timeout(10_000),
      headers: { "User-Agent": "MabroukTemplateImporter/1.0", Accept: "text/html,application/json;q=0.9,*/*;q=0.5" },
    });
    if (res.status >= 300 && res.status < 400 && res.headers.get("location")) {
      url = new URL(res.headers.get("location")!, url);
      continue;
    }
    if (!res.ok) throw new Error(`The URL answered ${res.status}`);
    const len = Number(res.headers.get("content-length") ?? 0);
    if (len > MAX_IMPORT_BYTES) throw new Error("File is larger than 2 MB");
    const buf = await res.arrayBuffer();
    if (buf.byteLength > MAX_IMPORT_BYTES) throw new Error("File is larger than 2 MB");
    return { body: new TextDecoder().decode(buf), contentType: res.headers.get("content-type") ?? "", finalUrl: url.toString() };
  }
  throw new Error("Too many redirects");
}
