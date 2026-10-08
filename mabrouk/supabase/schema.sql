-- Mabrouk — Supabase / Postgres schema
-- Run once in the Supabase SQL editor (or `psql -f supabase/schema.sql`).
--
-- Access model: Row Level Security is enabled with NO policies and table
-- grants are revoked from anon/authenticated, so the public API can't touch
-- the tables. The Next.js server goes through the secret-gated RPC
-- functions at the bottom of this file.

-- gen_random_uuid() is built into Postgres 13+, no extension needed.

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
create or replace function touch_updated_at() returns trigger language plpgsql set search_path = '' as $fn$
begin
  new.updated_at = now();
  return new;
end
$fn$;

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
revoke all on invitations, sub_events, guests, rsvps, view_events from anon, authenticated;

-- ==================================================================
-- Server API (RPC). The Next.js server calls these with the project's
-- publishable key + a shared secret (MABROUK_DB_SECRET). Tables stay
-- unreachable through the public API (RLS on, no policies); these
-- SECURITY DEFINER functions are the only door, and they check the
-- secret stored in private.settings first.
--
-- Set the secret once (never commit it):
--   insert into private.settings (key, value) values ('db_secret', '<random>')
--   on conflict (key) do update set value = excluded.value;
-- ==================================================================

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table if not exists private.settings (
  key   text primary key,
  value text not null
);

create or replace function private.assert_secret(p_secret text) returns void
language plpgsql security definer set search_path = '' as $fn$
declare v text;
begin
  select value into v from private.settings where key = 'db_secret';
  if v is null or p_secret is null or p_secret <> v then
    raise exception 'forbidden' using errcode = '42501';
  end if;
end
$fn$;

-- Mirror an invitation's content (upsert only, never delete: keeps RSVPs safe).
create or replace function public.mabrouk_sync_invitation(
  p_secret text, p_invitation jsonb, p_sub_events jsonb, p_guests jsonb
) returns void
language plpgsql security definer set search_path = '' as $fn$
begin
  perform private.assert_secret(p_secret);

  insert into public.invitations as i (
    slug, template_id, template_version, theme_id, market, tone, default_locale, status,
    is_demo, time_zone, show_hijri, main_event_id, content, host_key, pin, expires_at
  )
  select r.slug, r.template_id, r.template_version, r.theme_id, r.market, r.tone, r.default_locale, r.status,
         r.is_demo, r.time_zone, r.show_hijri, r.main_event_id, r.content, r.host_key, r.pin, r.expires_at
  from jsonb_populate_record(null::public.invitations, p_invitation) r
  on conflict (slug) do update set
    template_id = excluded.template_id, template_version = excluded.template_version,
    theme_id = excluded.theme_id, market = excluded.market, tone = excluded.tone,
    default_locale = excluded.default_locale, status = excluded.status, is_demo = excluded.is_demo,
    time_zone = excluded.time_zone, show_hijri = excluded.show_hijri,
    main_event_id = excluded.main_event_id, content = excluded.content,
    host_key = excluded.host_key, pin = excluded.pin, expires_at = excluded.expires_at;

  insert into public.sub_events as s
  select * from jsonb_populate_recordset(null::public.sub_events, p_sub_events)
  on conflict (invitation_slug, id) do update set
    kind = excluded.kind, title = excluded.title, starts_at = excluded.starts_at, ends_at = excluded.ends_at,
    venue = excluded.venue, audience = excluded.audience, visibility = excluded.visibility,
    dress_code = excluded.dress_code, note = excluded.note;

  insert into public.guests as g (
    invitation_slug, code, display_name, latin_name, seats, sub_event_ids, phone, locale, host_note
  )
  select r.invitation_slug, r.code, r.display_name, r.latin_name, r.seats, r.sub_event_ids, r.phone, r.locale, r.host_note
  from jsonb_populate_recordset(null::public.guests, p_guests) r
  on conflict (invitation_slug, code) do update set
    display_name = excluded.display_name, latin_name = excluded.latin_name, seats = excluded.seats,
    sub_event_ids = excluded.sub_event_ids, phone = excluded.phone, locale = excluded.locale,
    host_note = excluded.host_note;
end
$fn$;

-- Save an RSVP. Personal links upsert on dedupe_key; seats are re-checked here too.
create or replace function public.mabrouk_save_rsvp(p_secret text, p_rsvp jsonb)
returns public.rsvps
language plpgsql security definer set search_path = '' as $fn$
declare
  r public.rsvps;
  v_seats integer;
begin
  perform private.assert_secret(p_secret);
  r := jsonb_populate_record(null::public.rsvps, p_rsvp);

  if r.guest_code is not null then
    select seats into v_seats from public.guests
      where invitation_slug = r.invitation_slug and code = r.guest_code;
    if v_seats is null then raise exception 'unknown_guest'; end if;
    if r.headcount > v_seats then raise exception 'headcount_out_of_range'; end if;
  end if;

  insert into public.rsvps as x (invitation_slug, guest_code, dedupe_key, name, attending, headcount, message, locale)
  values (r.invitation_slug, r.guest_code, r.dedupe_key, r.name, r.attending, r.headcount, r.message, coalesce(r.locale, 'ar'))
  on conflict (dedupe_key) do update set
    name = excluded.name, attending = excluded.attending, headcount = excluded.headcount,
    message = excluded.message, locale = excluded.locale
  returning * into r;
  return r;
end
$fn$;

create or replace function public.mabrouk_list_rsvps(p_secret text, p_slug text)
returns setof public.rsvps
language plpgsql security definer set search_path = '' as $fn$
begin
  perform private.assert_secret(p_secret);
  return query select * from public.rsvps where invitation_slug = p_slug order by updated_at desc;
end
$fn$;

create or replace function public.mabrouk_record_view(
  p_secret text, p_slug text, p_guest_code text, p_locale text
) returns void
language plpgsql security definer set search_path = '' as $fn$
begin
  perform private.assert_secret(p_secret);
  insert into public.view_events (invitation_slug, guest_code, kind, locale)
  values (p_slug, p_guest_code, 'open', p_locale);
end
$fn$;

create or replace function public.mabrouk_count_views(p_secret text, p_slug text)
returns jsonb
language plpgsql security definer set search_path = '' as $fn$
declare v jsonb;
begin
  perform private.assert_secret(p_secret);
  select jsonb_build_object(
    'total', coalesce(sum(n), 0),
    'byGuest', coalesce(jsonb_object_agg(guest_code, n) filter (where guest_code is not null), '{}'::jsonb)
  ) into v
  from (
    select guest_code, count(*) as n from public.view_events
    where invitation_slug = p_slug group by guest_code
  ) t;
  return v;
end
$fn$;

revoke all on function public.mabrouk_sync_invitation(text, jsonb, jsonb, jsonb) from public;
revoke all on function public.mabrouk_save_rsvp(text, jsonb) from public;
revoke all on function public.mabrouk_list_rsvps(text, text) from public;
revoke all on function public.mabrouk_record_view(text, text, text, text) from public;
revoke all on function public.mabrouk_count_views(text, text) from public;
revoke all on function private.assert_secret(text) from public, anon, authenticated;
revoke all on function touch_updated_at() from public, anon, authenticated;
grant execute on function public.mabrouk_sync_invitation(text, jsonb, jsonb, jsonb) to anon, authenticated, service_role;
grant execute on function public.mabrouk_save_rsvp(text, jsonb) to anon, authenticated, service_role;
grant execute on function public.mabrouk_list_rsvps(text, text) to anon, authenticated, service_role;
grant execute on function public.mabrouk_record_view(text, text, text, text) to anon, authenticated, service_role;
grant execute on function public.mabrouk_count_views(text, text) to anon, authenticated, service_role;
