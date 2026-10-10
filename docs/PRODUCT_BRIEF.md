# Mabrouk (مبروك): Product Brief

Status: **MVP built** (October 2026). Discovery is closed. This file records every locked decision plus the defaults chosen during the build. Code lives in [`mabrouk/`](../mabrouk).

---

## 1. Business decisions (locked)

| Topic | Decision |
|---|---|
| Brand | **Mabrouk (مبروك)**. Every invitation shows a "Made with Mabrouk" footer linking to the landing page. This footer is the main growth channel. |
| Product | Premium animated wedding invitation websites, delivered as one shareable link (WhatsApp / SMS / social). |
| Scope | **Weddings only.** Sub-events: engagement, Katb el-Kitab, henna, wedding. |
| Markets | Egypt first, then Middle East / GCC. Arabic (RTL, **default**) and English. |
| Model | Productized service: the founder fills a typed config per order from ready templates. Self-serve editor comes later. |
| Price | **500 EGP** in Egypt, **$20** outside Egypt. Kept low for volume. |
| Add-ons | Personal guest links +250 EGP / +$10 · 24h rush +150 EGP / +$5 · Extra revision round 100 EGP |
| Operations | 72h delivery · 2 revision rounds included · links live 6 months after the wedding |
| Orders | WhatsApp button with a prefilled message naming the chosen design. |
| Payment | Manual at launch (InstaPay / Vodafone Cash). Paymob later. |
| Go-to-market | Instagram / TikTok Reels of the invitation opening on a phone, so templates must look stunning in a phone screen recording. |
| Photos | No real couple photos. Templates must look premium **without photos** (typographic, ornamental, monogram). Photos and gallery are optional. |
| Templates | Built by Claude, in code. |

## 2. Cultural requirements (in the data model from day one)

| Need | How it's modelled (`src/lib/types.ts`) |
|---|---|
| Egypt: modern romantic tone | `market: "EG"`, `tone: "romantic"` |
| Egypt events: engagement / Katb el-Kitab / wedding | `SubEvent.kind` (+ `henna`) |
| GCC: formal "families invite you" wording | `tone: "formal"`, free `hostsLine` / `inviteLine` (bilingual) |
| GCC: often no bride photo | Photos are optional everywhere; the default design uses none |
| GCC: separate men-only / women-only events with different guest lists | `SubEvent.audience: "mixed" \| "men" \| "women"`, `SubEvent.visibility: "public" \| "guests-only"`, `Guest.subEventIds` |
| Hijri + Gregorian dates | `showHijri: true` → `Intl` with `islamic-umalqura`, formatted on the server |
| PIN so forwarded links can't be opened | Optional `pin`; content is only rendered after an httpOnly cookie proves the PIN |

## 3. Tech decisions (locked)

- Next.js (App Router) + TypeScript + Tailwind, `motion` for animation, app in `mabrouk/`.
- **`invitation = templateId + theme + typed content`**. All text fields are bilingual `{ ar, en }`.
- Content in typed files: `src/content/invitations/*.ts`.
- Template registry with **pinned versions**, so improving a template never changes published invitations.
- Storage adapter: local JSON file in dev, Supabase when env vars are set. SQL schema in `supabase/schema.sql` (tables `invitations`, `sub_events`, `guests`, `rsvps`, `view_events`).
- Hosting: Vercel. Static/ISR wherever possible.
- Performance budget: < ~1.5 MB before the first tap. Honour `prefers-reduced-motion`.

---

## 4. Defaults chosen during the build

These were unspecified in discovery. Each is easy to change.

### Product / UX
- **Template "Noor" (نور)**: mihrab-arch frame, eight-point-star (khatam) motif, geometric lattice background, wax-sealed envelope intro. Fully vector, so it looks complete with zero photos.
- **Themes**: Ivory Gold (burgundy wax seal), Emerald Night (gold seal, dark), Blush Rose (rose wax).
- **Fonts**: Aref Ruqaa (Arabic display and names), Amiri (Arabic body), Cormorant Garamond (English), **Pinyon Script** (English names, the script font). Arabic fonts are preloaded; Latin fonts load on demand.
- **Music**: if an order has no audio file, a **built-in Web Audio "music box"** plays a soft I–vi–IV–V arpeggio. It's synthesized in the browser: zero download, royalty-free by construction. Orders can set `music.src` to a licensed royalty-free file in `/public`. Music starts on the envelope tap, toggles from an always-visible button, and pauses when the tab is hidden.
- **Language**: the toggle switches instantly client-side; `<html lang/dir>` follows. A guest's personal link opens in their `locale` if set.
- **Monogram**: initials kept as separate glyphs (Arabic letters would otherwise join).
- **Dates in Arabic** never use "·" as a separator: next to Arabic-Indic digits it reads as zero (٠). Diamonds are used instead.
- **Times**: 12-hour format in both languages.
- **General link** shows only `public` sub-events. **Personal links** show exactly the guest's `subEventIds` (this is how men's and women's lists are split).
- **RSVP**: one reply per invitation (covers all the guest's events). Personal links upsert (the latest reply wins). The general link inserts a row each time and caps headcount at `rsvp.maxHeadcountGeneral`. A honeypot field filters bots.
- **Demo invitations** (`isDemo: true`) accept RSVPs in the UI but store nothing and don't count views.
- **Expiry**: `expiresAt` defaults to main event + 6 months. After that, a "This invitation has ended / thank you" page is shown. Invitation views are cached for 1 hour, so expiry and RSVP deadlines apply without a redeploy.
- **Unknown slug or guest code** renders the 404 UI with `noindex`. With streaming, this is HTTP 200, not 404.
- **Gallery**: hidden unless photos are provided.
- **Footer link**: `/?ref=invite` (or `/en?ref=invite`). The ref param is for future analytics; it isn't tracked yet.

### Pricing / copy
- **Extra revision round in USD: $4.** The brief only fixed 100 EGP; $4 keeps the same ratio as the other add-ons.
- Outside Egypt: "we'll share payment options on WhatsApp" (no method locked yet).
- All prices are in **`mabrouk/src/config/pricing.ts`**. Operations numbers (72h, 2 revisions, 6 months) are in **`mabrouk/src/config/site.ts`**. The landing page and FAQ read from both.

### Security / privacy
- Slugs and guest codes are random, from an alphabet without look-alike characters: `node scripts/new-codes.mjs <names> <count>`. Demo slugs (`omar-laila*`) are deliberately readable for marketing.
- `noindex, nofollow` on `/i/*`, `/host/*` and `/api/*` via both a meta tag and an `X-Robots-Tag` header. `robots.txt` disallows them. The sitemap lists only the landing pages.
- The host page authenticates with `?key=<hostKey>` (constant-time compare) and sets `referrer: no-referrer` so the key doesn't leak.
- `hostKey`, `pin` and the guest list are **never** sent to the browser. Templates receive a public `InvitationView` projection.
- PIN cookie: HMAC(`MABROUK_SECRET`, slug:pin), httpOnly, ~8 months. Changing the PIN invalidates old cookies. A wrong PIN costs a 600 ms delay.
- POST APIs reject cross-origin requests (Origin check). CSV export is protected against formula injection and includes a UTF-8 BOM so Arabic opens correctly in Excel.
- Supabase: Row Level Security is on with no policies and table grants are revoked, so the public API can't touch the tables. The server calls five `SECURITY DEFINER` functions (`mabrouk_*`) with the publishable key plus a server-only secret (`MABROUK_DB_SECRET`, stored in `private.settings`). Without the secret, every call is rejected. Seat limits are re-checked inside the database. RSVP rows dedupe via `dedupe_key`.
- No rate limiting yet (acceptable at launch volume; add Vercel WAF or Upstash if abused).

### Performance (measured on the demo, 375px)
- ~500 KB transferred (~1.0 MB uncompressed) before the first tap, including Arabic fonts. Within the 1.5 MB budget.
- Invitation pages are prerendered static HTML. PIN-protected invitations render per request (they must check the cookie).
- `LazyMotion` + `domAnimation` keeps motion small. The landing page's design gallery uses static CSS posters instead of iframes; only the hero phone embeds a live demo (lazy iframe).

### Link previews (OpenGraph)
- One 1200×630 image per invitation and per guest (`opengraph-image.tsx`), in theme colours with Latin names. Satori can't shape Arabic, so the Arabic goes in `<title>` and description, e.g. `أحمد وعائلته، دعوة زفاف عمر وليلى`.
- PIN-protected invitations use a generic description.

---

## 5. How an order is fulfilled (founder workflow)

1. Customer taps "Order this design" on the landing page → WhatsApp opens with the design name prefilled.
2. Collect names, families line, sub-events (time, venue, map pin), optional story, dress code, gifts, guest list. Take payment (InstaPay / Vodafone Cash).
3. `node scripts/new-codes.mjs <names> <guestCount>` → slug, host key, guest codes.
4. Copy `src/content/invitations/omar-laila.ts` to a new file, fill it in, add it to `src/content/invitations/index.ts`. TypeScript catches missing translations and fields.
5. Push → Vercel deploys. Send the couple:
   - the invitation link `https://<domain>/i/<slug>`
   - their dashboard `https://<domain>/host/<slug>?key=<hostKey>`. From there they send each guest a one-tap `wa.me` message with that guest's personal link (and PIN, if set).
6. Revisions: edit the file, push. Two rounds included.

## 6. Later phases (do NOT build yet)

Paymob payments · step-by-step order form with uploads · admin order pipeline · self-serve editor · thank-you / guest photo page · QR check-in · WhatsApp Business API bulk sending · AI text writing and translation · B2B planner portal · template marketplace.

## 7. Founder to-do before launch

- [ ] Check that the **Mabrouk domain** and **Instagram / TikTok handles** are available; update `src/config/site.ts` (handles are placeholders).
- [ ] Put the **real WhatsApp number** in `siteConfig.whatsappNumber` (currently `201000000000`).
- [ ] Background music must be **royalty-free**. The built-in synth is safe; any uploaded track needs a licence you keep on file.
- [x] Supabase project `mabrouk` (Frankfurt, `jfxodiefxspynlprzofb`) created and schema applied (Oct 2026).
- [ ] Vercel project: import the repo with root directory `mabrouk` and set `SUPABASE_URL`, `SUPABASE_KEY`, `MABROUK_DB_SECRET`, `MABROUK_SECRET` (and `NEXT_PUBLIC_SITE_URL` once a domain exists). Without the Supabase variables, production RSVPs go to `/tmp` on Vercel, which is ephemeral; the host dashboard shows a warning.
- [ ] Decide the payment method for customers outside Egypt.
- [ ] Record the Reels: open `/i/omar-laila` on a phone, screen-record the tap → seal → letter → names sequence in each theme.

---

## 8. Template catalog + admin panel (added October 2026)

**Customer side**
- Landing gallery (`/#designs`, `/en#designs`) lists every *published* catalog template. It's a swipeable carousel on phones and a grid on desktop. Each card has a vector or uploaded thumbnail, a **Live demo** button, an **order on WhatsApp** button that names the design, and a **Share** button.
- Live demo at **`/demo/<template-id>`**: a shareable, indexable link. A floating dock gives **play / pause, mute, a track selector**, a share sheet (copy link, WhatsApp, native share) and the WhatsApp order button. Music starts on the first tap (browsers block autoplay).
- Personal client links at **`/p/<token>`** can override names/date (Noor) or texts (HTML), show a "Private preview for …" banner, and are never indexed.
- Orders go to WhatsApp **+20 150 055 4524** (`siteConfig.whatsappNumber`).

**Admin panel** (`/admin`)
- Login with the static credentials from the brief (`tahahazem` / `hazemtaha`). Override them with the `ADMIN_USERNAME` / `ADMIN_PASSWORD` env vars. The session is a signed, httpOnly cookie (7 days). `src/proxy.ts` blocks `/admin/*` and `/api/admin/*` without it, and every page/action/route checks again.
- Templates: create (Noor engine or HTML), edit, duplicate, publish/unpublish, delete, export JSON.
  - **Noor templates**: bilingual texts, names, date/time zone, venue, map, dress code, hero photo, gallery, preset theme or five custom colors.
  - **HTML templates**: HTML/CSS/JS editors, `{{key}}` text variables, colors exposed as CSS variables (`--mbk-background`, `--mbk-surface`, `--mbk-text`, `--mbk-accent`, `--mbk-seal`).
- Import: upload `.json` (Mabrouk export) or `.html` (+ `.css`/`.js`), or a URL (server-side fetch: 2 MB cap, 10 s timeout, private/loopback addresses blocked). Imports arrive as drafts.
- Music & images: upload MP3/M4A/OGG/WAV or JPG/PNG/WebP/SVG (≤ 4 MB, Vercel's request limit). Per template: pick tracks + default. The built-in synthesized "Mabrouk Music Box" is always available.
- Client links: created from the template editor, each with a copy button and a one-tap WhatsApp send.

**Defaults / decisions**
- Catalog data lives in Supabase (`supabase/catalog.sql`: `showcase_templates`, `media`, `preview_links`) behind the same secret-gated functions as the rest. Files are stored in Postgres (`bytea`), uploaded in 1 MB chunks, and served from `/media/<id>` with year-long immutable caching and byte-range support (required for iPhone audio). Move to Supabase Storage/Vercel Blob if the library grows past a few hundred MB.
- Imported HTML runs in an iframe sandbox **without** `allow-same-origin`, so it can't read cookies, the admin session or the parent page. Uploaded SVGs are served with a sandboxing CSP.
- Public catalog reads are cached and tagged `catalog`; every admin change refreshes them immediately.
- The default catalog (3 Noor themes + "Lumière" HTML save-the-date) is seeded once on first read.
- The admin UI is in English; customer-facing pages stay Arabic-first and bilingual.

## 9. "Farah" two-entrance template (added October 2026)

- New template kind **`duo`**: one invitation, two doors. The entrance asks "إنت من طرف مين؟" ("Whose side are you on?"):
  - **صحاب العروسة يجوا هنا** → a romantic world: blush background, floating hearts and petals, calligraphy names, its own song ("Romantic One").
  - **صحاب العريس يجوا هنا** → a shaabi street-wedding world: festoon lights, bunting, spinning light rays, confetti, a neon Lalezar title and a scrolling banner, with its own song ("Shaabi One").
  - Both sides show all the details (countdown, venue + maps + calendar, dress code, RSVP). Guests can switch sides or go back to the entrance; the song switches with them, and the demo's music player follows.
- Default demo: `/demo/farah-bride-groom`, first in the landing gallery. Duplicate it, or use **+ New bride/groom design** in `/admin`. Each side's entrance label, title, message and song are editable in the "Two entrances" section.
- The two songs ship with the site as built-in tracks (`public/audio/romantic-one.mp3`, `public/audio/shaabi-one.mp3`, served by the CDN), next to the synthesized music box. They were supplied by the founder, who is responsible for their usage rights.
- **Entrance styles** (picked per template in the editor, "Entrance style"), each with a visible divider between the two choices:
  - `diagonal`: a slanted split with a glowing dashed seam and heart/star charms.
  - `doors`: two arched palace doors that swing open, separated by a pillar with an "أو" diamond.
  - `tickets`: two tear-off entry tickets with perforations and a dashed "أو" divider.
  - `split`: two halves joined by a glowing zigzag seam.
- **Color sets** ("Colors (both worlds)"): `classic` (blush × neon violet), `royal` (ivory × red khayamiya tent), `night` (lavender × teal neon), `sunset` (peach × green & gold). Text on the dark (groom) side is always white, with a neon glow on titles.
- Four ready demos: `farah-bride-groom` (diagonal/classic), `farah-palace-doors` (doors/royal), `farah-party-tickets` (tickets/night), `farah-half-half` (split/sunset).
- Colors are applied as inline CSS variables and the animations live in `src/templates/duo/v1/duo.css`, imported by the components themselves, so a stale cached global stylesheet can no longer leave the design unstyled.
