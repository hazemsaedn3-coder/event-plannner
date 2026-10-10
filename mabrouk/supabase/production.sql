-- Mabrouk — orders and production invitations.
-- Run after schema.sql and catalog.sql. Same access model: RLS on, no
-- policies, grants revoked; the server calls the secret-gated functions.

-- ------------------------------------------------------------------
-- orders: one row per customer request from the online order form.
-- Searchable/filterable fields are real columns; the full request
-- (src/orders/types.ts → Order) lives in `data`.
-- ------------------------------------------------------------------
create table if not exists public.orders (
  id           text primary key,                 -- unguessable, used in the confirmation URL
  ref          text        not null unique,      -- human reference, e.g. MBK-7K2Q9D
  status       text        not null check (status in
                 ('new', 'pending_review', 'waiting_customer', 'approved', 'in_production', 'completed', 'cancelled')),
  whatsapp     text        not null,
  template_id  text,
  search       text        not null default '',  -- lower-cased names, phone, ref
  ip_hash      text,                             -- rate limiting only (salted hash, never the IP)
  data         jsonb       not null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists orders_status_created_idx on public.orders (status, created_at desc);
create index if not exists orders_created_idx on public.orders (created_at desc);
create index if not exists orders_whatsapp_idx on public.orders (whatsapp);
create index if not exists orders_ip_idx on public.orders (ip_hash, created_at desc);

-- Photos customers attach to an order. Private: only the admin panel serves them.
create table if not exists public.order_files (
  id          text primary key,
  order_id    text references public.orders (id) on delete cascade,
  kind        text        not null check (kind in ('couple', 'venue', 'other')),
  name        text        not null,
  mime        text        not null check (mime like 'image/%'),
  size        integer     not null check (size > 0 and size <= 4194304),
  data        bytea       not null,
  ip_hash     text,
  created_at  timestamptz not null default now()
);
create index if not exists order_files_order_idx on public.order_files (order_id);
create index if not exists order_files_ip_idx on public.order_files (ip_hash, created_at desc);

-- ------------------------------------------------------------------
-- live_invitations: production invitations served at /i/<slug>.
-- `data` holds src/live/types.ts → LiveInvitation (including a snapshot
-- of the customised design, so later catalog edits never change it).
-- ------------------------------------------------------------------
create table if not exists public.live_invitations (
  slug         text primary key,
  status       text        not null check (status in ('active', 'inactive')),
  template_id  text        not null,
  order_id     text references public.orders (id) on delete set null,
  client_name  text        not null default '',
  valid_from   timestamptz,
  valid_until  timestamptz,
  data         jsonb       not null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists live_invitations_updated_idx on public.live_invitations (updated_at desc);
create index if not exists live_invitations_order_idx on public.live_invitations (order_id);

alter table public.orders           enable row level security;
alter table public.order_files      enable row level security;
alter table public.live_invitations enable row level security;
revoke all on public.orders, public.order_files, public.live_invitations from anon, authenticated;

-- ---------------------------- orders -------------------------------

-- Create an order (public form). At most 5 orders per client per hour.
create or replace function public.orders_create(p_secret text, p_order jsonb, p_ip_hash text, p_file_ids text[]) returns void
language plpgsql security definer set search_path = '' as $fn$
begin
  perform private.assert_secret(p_secret);
  if p_ip_hash is not null and (
    select count(*) from public.orders where ip_hash = p_ip_hash and created_at > now() - interval '1 hour'
  ) >= 5 then
    raise exception 'rate_limited';
  end if;
  insert into public.orders (id, ref, status, whatsapp, template_id, search, ip_hash, data)
  values (p_order->>'id', p_order->>'ref', p_order->>'status', p_order->>'whatsapp', p_order->>'templateId',
          lower(concat_ws(' ', p_order->>'ref', p_order->>'groomName', p_order->>'brideName', p_order->>'whatsapp')),
          p_ip_hash, p_order);
  -- Attach the photos uploaded for this order (only unclaimed ones).
  update public.order_files set order_id = p_order->>'id'
  where id = any(coalesce(p_file_ids, '{}')) and order_id is null;
end
$fn$;

create or replace function public.orders_save(p_secret text, p_order jsonb) returns void
language plpgsql security definer set search_path = '' as $fn$
begin
  perform private.assert_secret(p_secret);
  update public.orders set
    status = p_order->>'status',
    whatsapp = p_order->>'whatsapp',
    template_id = p_order->>'templateId',
    search = lower(concat_ws(' ', p_order->>'ref', p_order->>'groomName', p_order->>'brideName', p_order->>'whatsapp')),
    data = p_order,
    updated_at = now()
  where id = p_order->>'id';
end
$fn$;

create or replace function public.orders_get(p_secret text, p_id text) returns jsonb
language plpgsql security definer set search_path = '' as $fn$
begin
  perform private.assert_secret(p_secret);
  return (select data from public.orders where id = p_id);
end
$fn$;

-- Paged list with optional status filter and text search, plus per-status counts.
create or replace function public.orders_list(p_secret text, p_status text, p_query text, p_limit integer, p_offset integer) returns jsonb
language plpgsql security definer set search_path = '' as $fn$
declare
  q text := nullif(lower(trim(coalesce(p_query, ''))), '');
begin
  perform private.assert_secret(p_secret);
  return jsonb_build_object(
    'items', coalesce((
      select jsonb_agg(data order by created_at desc) from (
        select data, created_at from public.orders
        where (p_status is null or status = p_status)
          and (q is null or search like '%' || q || '%')
        order by created_at desc
        limit least(greatest(coalesce(p_limit, 50), 1), 200) offset greatest(coalesce(p_offset, 0), 0)
      ) t), '[]'::jsonb),
    'total', (select count(*) from public.orders
              where (p_status is null or status = p_status) and (q is null or search like '%' || q || '%')),
    'counts', coalesce((select jsonb_object_agg(status, n) from (
              select status, count(*) as n from public.orders
              where q is null or search like '%' || q || '%' group by status) c), '{}'::jsonb)
  );
end
$fn$;

-- Customer photo upload (before the order exists). 30 files per client per hour.
create or replace function public.orders_put_file(p_secret text, p_meta jsonb, p_data text, p_ip_hash text) returns void
language plpgsql security definer set search_path = '' as $fn$
begin
  perform private.assert_secret(p_secret);
  if p_ip_hash is not null and (
    select count(*) from public.order_files where ip_hash = p_ip_hash and created_at > now() - interval '1 hour'
  ) >= 30 then
    raise exception 'rate_limited';
  end if;
  insert into public.order_files (id, kind, name, mime, size, data, ip_hash)
  values (p_meta->>'id', p_meta->>'kind', p_meta->>'name', p_meta->>'mime', (p_meta->>'size')::int, decode(p_data, 'base64'), p_ip_hash);
end
$fn$;

create or replace function public.orders_get_file(p_secret text, p_id text) returns jsonb
language plpgsql security definer set search_path = '' as $fn$
begin
  perform private.assert_secret(p_secret);
  return (
    select jsonb_build_object('id', id, 'orderId', order_id, 'kind', kind, 'name', name, 'mime', mime, 'size', size,
                              'createdAt', created_at, 'data', encode(data, 'base64'))
    from public.order_files where id = p_id
  );
end
$fn$;

create or replace function public.orders_list_files(p_secret text, p_order_id text) returns jsonb
language plpgsql security definer set search_path = '' as $fn$
begin
  perform private.assert_secret(p_secret);
  return coalesce((
    select jsonb_agg(jsonb_build_object('id', id, 'orderId', order_id, 'kind', kind, 'name', name, 'mime', mime, 'size', size, 'createdAt', created_at) order by created_at)
    from public.order_files where order_id = p_order_id
  ), '[]'::jsonb);
end
$fn$;

-- ---------------------- production invitations ----------------------

create or replace function public.live_save(p_secret text, p_inv jsonb) returns void
language plpgsql security definer set search_path = '' as $fn$
begin
  perform private.assert_secret(p_secret);
  insert into public.live_invitations (slug, status, template_id, order_id, client_name, valid_from, valid_until, data, updated_at)
  values (p_inv->>'slug', p_inv->>'status', p_inv->>'templateId', nullif(p_inv->>'orderId', ''), coalesce(p_inv->>'clientName', ''),
          (p_inv->>'validFrom')::timestamptz, (p_inv->>'validUntil')::timestamptz, p_inv, now())
  on conflict (slug) do update set
    status = excluded.status, template_id = excluded.template_id, order_id = excluded.order_id,
    client_name = excluded.client_name, valid_from = excluded.valid_from, valid_until = excluded.valid_until,
    data = excluded.data, updated_at = now();
end
$fn$;

create or replace function public.live_get(p_secret text, p_slug text) returns jsonb
language plpgsql security definer set search_path = '' as $fn$
begin
  perform private.assert_secret(p_secret);
  return (select data from public.live_invitations where slug = p_slug);
end
$fn$;

-- Admin list: the design snapshot is left out to keep the payload small.
create or replace function public.live_list(p_secret text) returns jsonb
language plpgsql security definer set search_path = '' as $fn$
begin
  perform private.assert_secret(p_secret);
  return coalesce((
    select jsonb_agg((data - 'template') || jsonb_build_object('templateName', data->'template'->'name', 'templateKind', data->'template'->>'kind')
                     order by updated_at desc)
    from public.live_invitations
  ), '[]'::jsonb);
end
$fn$;

create or replace function public.live_delete(p_secret text, p_slug text) returns void
language plpgsql security definer set search_path = '' as $fn$
begin
  perform private.assert_secret(p_secret);
  delete from public.live_invitations where slug = p_slug;
end
$fn$;

-- RSVP + view totals per invitation (usage tracking in the admin list).
create or replace function public.live_usage(p_secret text) returns jsonb
language plpgsql security definer set search_path = '' as $fn$
begin
  perform private.assert_secret(p_secret);
  return coalesce((
    select jsonb_object_agg(l.slug, jsonb_build_object(
      'views', (select count(*) from public.view_events v where v.invitation_slug = l.slug),
      'rsvps', (select count(*) from public.rsvps r where r.invitation_slug = l.slug),
      'attending', (select coalesce(sum(headcount), 0) from public.rsvps r where r.invitation_slug = l.slug and r.attending)
    ))
    from public.live_invitations l
  ), '{}'::jsonb);
end
$fn$;

do $do$
declare f text;
begin
  foreach f in array array[
    'orders_create(text,jsonb,text,text[])', 'orders_save(text,jsonb)', 'orders_get(text,text)',
    'orders_list(text,text,text,integer,integer)', 'orders_put_file(text,jsonb,text,text)',
    'orders_get_file(text,text)', 'orders_list_files(text,text)',
    'live_save(text,jsonb)', 'live_get(text,text)', 'live_list(text)', 'live_delete(text,text)', 'live_usage(text)'
  ] loop
    execute format('revoke all on function public.%s from public', f);
    execute format('grant execute on function public.%s to anon, authenticated, service_role', f);
  end loop;
end
$do$;
