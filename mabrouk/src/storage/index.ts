import "server-only";
import { LocalJsonStorage } from "./local";
import { SupabaseStorage } from "./supabase";
import type { StorageAdapter } from "./types";

let instance: StorageAdapter | undefined;

/**
 * Supabase when SUPABASE_URL + SUPABASE_KEY (publishable or service-role)
 * + MABROUK_DB_SECRET are set; otherwise a local JSON file.
 */
export function getStorage(): StorageAdapter {
  if (!instance) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
    const secret = process.env.MABROUK_DB_SECRET;
    instance = url && key && secret ? new SupabaseStorage(url, key, secret) : new LocalJsonStorage();
  }
  return instance;
}

export type { StorageAdapter } from "./types";
