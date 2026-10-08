#!/usr/bin/env node
/**
 * Generates unguessable codes for a new order.
 *
 *   node scripts/new-codes.mjs omar-laila 25
 *
 * prints a slug, a host key and 25 guest codes to paste into
 * src/content/invitations/<file>.ts
 */
import { randomBytes } from "node:crypto";

// Crockford-style alphabet without look-alikes (0/o, 1/l/i).
const ALPHABET = "23456789abcdefghjkmnpqrstuvwxyz";

function code(length) {
  const bytes = randomBytes(length);
  let out = "";
  for (const b of bytes) out += ALPHABET[b % ALPHABET.length];
  return out;
}

const base = (process.argv[2] ?? "couple").toLowerCase().replace(/[^a-z0-9-]/g, "");
const guests = Number(process.argv[3] ?? 10);

console.log(`slug:     ${base}-${code(8)}`);
console.log(`hostKey:  ${code(24)}`);
console.log(`guest codes:`);
for (let i = 0; i < guests; i++) console.log(`  ${code(8)}`);
