-- Mabrouk — template catalog (landing gallery + admin panel)
-- Run after schema.sql. Same access model: tables are closed to the public
-- API; the server calls the secret-gated catalog_* functions below.

create table if not exists public.showcase_templates (
  id          text primary key,
  data        jsonb       not null,            -- src/catalog/types.ts → ShowcaseTemplate
  status      text        not null check (status in ('published', 'draft')),
  sort_order  integer     not null default 100,
  updated_at  timestamptz not null default now()
);

create table if not exists public.media (
  id          text primary key,
  kind        text        not null check (kind in ('audio', 'image')),
  name        text        not null,
  mime        text        not null,
  size        integer     not null check (size > 0 and size <= 4194304),
  data        bytea       not null,
  created_at  timestamptz not null default now()
);

create table if not exists public.preview_links (
  token        text primary key,
  template_id  text        not null references public.showcase_templates (id) on delete cascade,
  data         jsonb       not null,           -- src/catalog/types.ts → PreviewLink
  created_at   timestamptz not null default now()
);
create index if not exists preview_links_template_idx on public.preview_links (template_id);

alter table public.showcase_templates enable row level security;
alter table public.media              enable row level security;
alter table public.preview_links      enable row level security;
revoke all on public.showcase_templates, public.media, public.preview_links from anon, authenticated;

-- Seeds the default templates exactly once per database.
create or replace function public.catalog_seed_once(p_secret text, p_templates jsonb) returns void
language plpgsql security definer set search_path = '' as $fn$
begin
  perform private.assert_secret(p_secret);
  if exists (select 1 from private.settings where key = 'catalog_seeded') then return; end if;
  insert into public.showcase_templates (id, data, status, sort_order)
  select t->>'id', t, t->>'status', (t->>'sortOrder')::int from jsonb_array_elements(p_templates) t
  on conflict (id) do nothing;
  insert into private.settings (key, value) values ('catalog_seeded', now()::text) on conflict (key) do nothing;
end
$fn$;

create or replace function public.catalog_list_templates(p_secret text) returns jsonb
language plpgsql security definer set search_path = '' as $fn$
begin
  perform private.assert_secret(p_secret);
  return coalesce((select jsonb_agg(data order by sort_order, id) from public.showcase_templates), '[]'::jsonb);
end
$fn$;

create or replace function public.catalog_get_template(p_secret text, p_id text) returns jsonb
language plpgsql security definer set search_path = '' as $fn$
begin
  perform private.assert_secret(p_secret);
  return (select data from public.showcase_templates where id = p_id);
end
$fn$;

create or replace function public.catalog_save_template(p_secret text, p_id text, p_data jsonb, p_status text, p_sort integer) returns void
language plpgsql security definer set search_path = '' as $fn$
begin
  perform private.assert_secret(p_secret);
  insert into public.showcase_templates (id, data, status, sort_order, updated_at)
  values (p_id, p_data, p_status, p_sort, now())
  on conflict (id) do update set data = excluded.data, status = excluded.status, sort_order = excluded.sort_order, updated_at = now();
end
$fn$;

create or replace function public.catalog_delete_template(p_secret text, p_id text) returns void
language plpgsql security definer set search_path = '' as $fn$
begin
  perform private.assert_secret(p_secret);
  delete from public.showcase_templates where id = p_id;
end
$fn$;

create or replace function public.catalog_list_media(p_secret text) returns jsonb
language plpgsql security definer set search_path = '' as $fn$
begin
  perform private.assert_secret(p_secret);
  return coalesce((
    select jsonb_agg(jsonb_build_object('id', id, 'kind', kind, 'name', name, 'mime', mime, 'size', size, 'createdAt', created_at) order by created_at desc)
    from public.media
  ), '[]'::jsonb);
end
$fn$;

create or replace function public.catalog_get_media(p_secret text, p_id text) returns jsonb
language plpgsql security definer set search_path = '' as $fn$
begin
  perform private.assert_secret(p_secret);
  return (
    select jsonb_build_object('id', id, 'kind', kind, 'name', name, 'mime', mime, 'size', size, 'createdAt', created_at,
                              'data', encode(data, 'base64'))
    from public.media where id = p_id
  );
end
$fn$;

-- First chunk (creates the row); further chunks go through catalog_append_media.
create or replace function public.catalog_put_media(p_secret text, p_meta jsonb, p_data text) returns void
language plpgsql security definer set search_path = '' as $fn$
begin
  perform private.assert_secret(p_secret);
  insert into public.media (id, kind, name, mime, size, data)
  values (p_meta->>'id', p_meta->>'kind', p_meta->>'name', p_meta->>'mime', (p_meta->>'size')::int, decode(p_data, 'base64'));
end
$fn$;

create or replace function public.catalog_append_media(p_secret text, p_id text, p_data text) returns void
language plpgsql security definer set search_path = '' as $fn$
begin
  perform private.assert_secret(p_secret);
  update public.media set data = data || decode(p_data, 'base64') where id = p_id and octet_length(data) < size;
end
$fn$;

create or replace function public.catalog_delete_media(p_secret text, p_id text) returns void
language plpgsql security definer set search_path = '' as $fn$
begin
  perform private.assert_secret(p_secret);
  delete from public.media where id = p_id;
end
$fn$;

create or replace function public.catalog_list_links(p_secret text, p_template_id text) returns jsonb
language plpgsql security definer set search_path = '' as $fn$
begin
  perform private.assert_secret(p_secret);
  return coalesce((
    select jsonb_agg(data order by created_at desc) from public.preview_links
    where p_template_id is null or template_id = p_template_id
  ), '[]'::jsonb);
end
$fn$;

create or replace function public.catalog_get_link(p_secret text, p_token text) returns jsonb
language plpgsql security definer set search_path = '' as $fn$
begin
  perform private.assert_secret(p_secret);
  return (select data from public.preview_links where token = p_token);
end
$fn$;

create or replace function public.catalog_save_link(p_secret text, p_token text, p_template_id text, p_data jsonb) returns void
language plpgsql security definer set search_path = '' as $fn$
begin
  perform private.assert_secret(p_secret);
  insert into public.preview_links (token, template_id, data) values (p_token, p_template_id, p_data)
  on conflict (token) do update set template_id = excluded.template_id, data = excluded.data;
end
$fn$;

create or replace function public.catalog_delete_link(p_secret text, p_token text) returns void
language plpgsql security definer set search_path = '' as $fn$
begin
  perform private.assert_secret(p_secret);
  delete from public.preview_links where token = p_token;
end
$fn$;

-- Only the API roles may call these; each one still demands the secret.
do $do$
declare f text;
begin
  foreach f in array array[
    'catalog_seed_once(text,jsonb)', 'catalog_list_templates(text)', 'catalog_get_template(text,text)',
    'catalog_save_template(text,text,jsonb,text,integer)', 'catalog_delete_template(text,text)',
    'catalog_list_media(text)', 'catalog_get_media(text,text)', 'catalog_put_media(text,jsonb,text)',
    'catalog_append_media(text,text,text)', 'catalog_delete_media(text,text)',
    'catalog_list_links(text,text)', 'catalog_get_link(text,text)', 'catalog_save_link(text,text,text,jsonb)',
    'catalog_delete_link(text,text)'
  ] loop
    execute format('revoke all on function public.%s from public', f);
    execute format('grant execute on function public.%s to anon, authenticated, service_role', f);
  end loop;
end
$do$;
