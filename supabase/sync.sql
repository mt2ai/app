-- NaayTracker — sincronización por código
-- Ejecutar una sola vez en Supabase → SQL Editor → Run.
-- El código de sincronización es la llave: no se guarda en texto plano,
-- solo su hash SHA-256. Quien tenga el código puede leer/escribir ese estado.

create extension if not exists pgcrypto;

create table if not exists public.sync_states (
  code_hash text primary key,
  state jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.sync_states enable row level security;

-- La tabla no se expone directamente a la API anónima.
revoke all on table public.sync_states from anon, authenticated;

create or replace function public.sync_get(p_code text)
returns table (state jsonb, updated_at timestamptz)
language sql
security definer
set search_path = public, extensions
as $$
  select s.state, s.updated_at
  from public.sync_states s
  where s.code_hash = encode(
    digest(
      upper(regexp_replace(coalesce(p_code, ''), '[^A-Za-z0-9]', '', 'g')),
      'sha256'
    ),
    'hex'
  )
  limit 1;
$$;

create or replace function public.sync_save(p_code text, p_state jsonb)
returns table (updated_at timestamptz)
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_code text := upper(regexp_replace(coalesce(p_code, ''), '[^A-Za-z0-9]', '', 'g'));
  v_updated timestamptz;
begin
  if length(v_code) < 10 then
    raise exception 'Código de sincronización inválido';
  end if;

  insert into public.sync_states (code_hash, state, updated_at)
  values (encode(digest(v_code, 'sha256'), 'hex'), p_state, now())
  on conflict (code_hash) do update
    set state = excluded.state,
        updated_at = now()
  returning public.sync_states.updated_at into v_updated;

  return query select v_updated;
end;
$$;

revoke all on function public.sync_get(text) from public;
revoke all on function public.sync_save(text, jsonb) from public;

grant execute on function public.sync_get(text) to anon, authenticated;
grant execute on function public.sync_save(text, jsonb) to anon, authenticated;

-- Refresca la caché de funciones de PostgREST.
notify pgrst, 'reload schema';
