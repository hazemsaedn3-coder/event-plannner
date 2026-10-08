-- Mabrouk — Supabase / Postgres schema
-- Run once in the Supabase SQL editor (or `psql -f supabase/schema.sql`).
--
-- Access model: the Next.js server talks to Supabase with the service-role key
-- (server-side only). Row Level Security is enabled with NO public policies,
-- so the anon key can read or write nothing.

create extension if not exists pgcrypto;

-- ------------------------------------------------------------------
-- invitations: one row per order. `content` holds the full bilingual,
-- typed invitation content (src/lib/types.ts → InvitationContent) minus
-- secrets and guests, which live in their own columns / table.
-- ------------------------------------------------------------------
create table if not exists invitations (
  slug              text primary key,
  template_id       text        not null,
  template_version  integer     not null check (template_version > 0),
  theme_id          text        not null,
  market            text        not null check (market in ('EG', 'GCC', 'OTHER')),
  tone              text        not null check (tone in ('romantic', 'formal')),
  default_locale    text        not null default 'ar' check (default_locale in ('ar', 'en')),
  status            text        not null default 'live' check (status in ('draft', 'live')),
  is_demo           boolean     not null default false,
  time_zone         text        not null,
  show_hijri        boolean     not null default false,
  main_event_id     text        not null,
  content           jsonb       not null,
  host_key          text        not null,
  pin               text,                       -- optional GCC PIN gate
  expires_at        timestamptz,                -- default: main event + 6 months
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- ------------------------------------------------------------------
-- sub_events: engagement / katb-el-kitab / henna / wedding.
-- audience + visibility express GCC men-only / women-only receptions.
-- ------------------------------------------------------------------
create table if not exists sub_events (
  invitation_slug  text        not null references invitations (slug) on delete cascade,
  id               text        not null,
  kind             text        not null check (kind in ('engagement', 'katb-el-kitab', 'henna', 'wedding')),
  title            jsonb,                       -- { ar, en }
  starts_at        timestamptz not null,
  ends_at          timestamptz,
  venue            jsonb       not null,        -- { name: {ar,en}, address?, lat?, lng?, mapsUrl? }
  audience         text        not null default 'mixed' check (audience in ('mixed', 'men', 'women')),
  visibility       text        not null default 'public' check (visibility in ('public', 'guests-only')),
  dress_code       jsonb,
  note             jsonb,
  primary key (invitation_slug, id)
);

-- ------------------------------------------------------------------
-- guests: personal links /i/[slug]/[code] with a seat limit.
-- ------------------------------------------------------------------
create table if not exists guests (
  invitation_slug  text        not null references invitations (slug) on delete cascade,
  code             text        not null,
  display_name     jsonb       not null,        -- { ar, en }, e.g. "Ahmed & Family"
  latin_name       text        not null,
  seats            integer     not null check (seats > 0),
  sub_event_ids    text[],                      -- null = all public events
  phone            text,
  locale           text check (locale in ('ar', 'en')),
  host_note        text,
  created_at       timestamptz not null default now(),
  primary key (invitation_slug, code)
);

-- ------------------------------------------------------------------
-- rsvps: one row per reply. dedupe_key makes a guest's latest reply win
-- ("<slug>:<guestCode>"); general-link replies get a random key.
-- ------------------------------------------------------------------
create table if not exists rsvps (
  id               uuid        primary key default gen_random_uuid(),
  invitation_slug  text        not null references invitations (slug) on delete cascade,
  guest_code       text,
  dedupe_key       text        not null unique,
  name             text        not null check (char_length(name) between 1 and 80),
  attending        boolean     not null,
  headcount        integer     not null check (headcount >= 0 and headcount <= 50),
  message          text check (char_length(message) <= 500),
  locale           text        not null default 'ar' check (locale in ('ar', 'en')),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  foreign key (invitation_slug, guest_code) references guests (invitation_slug, code) on delete cascade
);
create index if not exists rsvps_invitation_idx on rsvps (invitation_slug, updated_at desc);

-- ------------------------------------------------------------------
-- view_events: lightweight open tracking for the host dashboard.
-- ------------------------------------------------------------------
create table if not exists view_events (
  id               bigint generated always as identity primary key,
  invitation_slug  text        not null references invitations (slug) on delete cascade,
  guest_code       text,
  kind             text        not null default 'open' check (kind in ('open')),
  locale           text check (locale in ('ar', 'en')),
  created_at       timestamptz not null default now()
);
create index if not exists view_events_invitation_idx on view_events (invitation_slug, created_at desc);

-- Keep updated_at fresh.
create or replace function touch_updated_at() returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists invitations_touch on invitations;
create trigger invitations_touch before update on invitations
  for each row execute function touch_updated_at();

drop trigger if exists rsvps_touch on rsvps;
create trigger rsvps_touch before update on rsvps
  for each row execute function touch_updated_at();

-- Lock everything down: only the service role (server) can access.
alter table invitations enable row level security;
alter table sub_events  enable row level security;
alter table guests      enable row level security;
alter table rsvps       enable row level security;
alter table view_events enable row level security;
