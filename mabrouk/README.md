# Mabrouk · مبروك

Premium animated wedding invitation websites, one link per wedding. Product decisions: [`../docs/PRODUCT_BRIEF.md`](../docs/PRODUCT_BRIEF.md).

```bash
npm install
npm run dev        # http://localhost:3000
npm run build && npm start
npm run lint
```

## Routes

| Route | What |
|---|---|
| `/` · `/en` | Landing page (Arabic / English) |
| `/i/[slug]` | General invitation |
| `/i/[slug]/[guestCode]` | Personal invitation ("Dear Ahmed & Family", seat limit) |
| `/host/[slug]?key=…` | Host dashboard: RSVPs, totals, CSV, one-tap WhatsApp per guest (`&lang=en` for English) |
| `POST /api/rsvp` · `POST /api/view` · `POST /api/unlock` | RSVP, open tracking, PIN gate |
| `GET /api/host/[slug]/rsvps?key=…` | CSV export |

Demo: `/i/omar-laila` (+ `-emerald`, `-blush`). Host: `/host/omar-laila?key=demo-host-9nr3ue8s7wd8pgfb`.
GCC sample with PIN `2468`: `/i/faisal-noura-wqhmh7ju/pfnf8smd` (men's list) and `/5surrg5v` (women's list).

## Layout

```
src/
  config/site.ts, pricing.ts      ← all editable business numbers
  content/invitations/*.ts        ← one typed file per order (+ index.ts)
  lib/types.ts                    ← the data model
  lib/invitations.ts, view.ts     ← content → public, pre-formatted view (no secrets)
  templates/registry.ts           ← { templateId → versions }; invitations pin a version
  templates/noor/v1/              ← the Noor template + its 3 themes
  storage/                        ← adapter: local JSON (.data/) or Supabase
supabase/schema.sql
scripts/new-codes.mjs             ← slug / host key / guest codes
assets/fonts/                     ← TTFs for OpenGraph images
```

## New order

```bash
node scripts/new-codes.mjs ahmed-sara 30
```
Copy `src/content/invitations/omar-laila.ts`, fill it in (remove `isDemo`), add it to `index.ts`, deploy.

## Changing a template safely

Never restyle a released version. Copy `templates/noor/v1` → `v2`, register it in `templates/registry.ts`, bump `latest`, and use `templateVersion: 2` for new orders.

## Env

See `.env.example`. Without Supabase variables, data goes to `.data/mabrouk-dev.json`.
