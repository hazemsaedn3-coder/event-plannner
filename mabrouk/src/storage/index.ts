import "server-only";
import { LocalJsonStorage } from "./local";
import { SupabaseStorage } from "./supabase";
import type { StorageAdapter } from "./types";

let instance: StorageAdapter | undefined;

/** Supabase when SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY are set, else a local JSON file. */
export function getStorage(): StorageAdapter {
  if (!instance) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    instance = url && key ? new SupabaseStorage(url, key) : new LocalJsonStorage();
  }
  return instance;
}

export type { StorageAdapter } from "./types";
