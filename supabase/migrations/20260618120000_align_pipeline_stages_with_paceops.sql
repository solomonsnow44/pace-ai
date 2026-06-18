create or replace function public.default_shared_pipeline_stages() returns jsonb
language sql
stable
as $$
  select jsonb_build_array(
    jsonb_build_object('id', 'research', 'name', 'Research', 'stage_order', 1, 'probability', 10),
    jsonb_build_object('id', 'preparation', 'name', 'Preparation', 'stage_order', 2, 'probability', 20),
    jsonb_build_object('id', 'qualify', 'name', 'Qualify', 'stage_order', 3, 'probability', 35),
    jsonb_build_object('id', 'discover', 'name', 'Discover', 'stage_order', 4, 'probability', 50),
    jsonb_build_object('id', 'alignment', 'name', 'Alignment', 'stage_order', 5, 'probability', 65),
    jsonb_build_object('id', 'position', 'name', 'Position', 'stage_order', 6, 'probability', 80),
    jsonb_build_object('id', 'intent-to-buy', 'name', 'Intent to Buy', 'stage_order', 7, 'probability', 90)
  );
$$;

create or replace function public.get_shared_pipeline_stages()
returns table(id uuid, stage_key text, name text, stage_order integer, probability integer)
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  current_org_id uuid;
  stored_stages jsonb;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  select u.organization_id
  into current_org_id
  from public.users u
  where u.id = auth.uid()
    and u.status = 'active';

  if current_org_id is null then
    raise exception 'Active CRM user not found';
  end if;

  select coalesce(o.metadata->'pipeline_stages', public.default_shared_pipeline_stages())
  into stored_stages
  from public.organizations o
  where o.id = current_org_id;

  return query
  select
    ('00000000-0000-4000-8000-' || lpad(item.ordinality::text, 12, '0'))::uuid as id,
    coalesce(nullif(trim(item.value->>'id'), ''), 'stage-' || item.ordinality::text) as stage_key,
    coalesce(nullif(trim(item.value->>'name'), ''), 'Stage ' || item.ordinality::text) as name,
    item.ordinality::integer as stage_order,
    least(100, greatest(0, coalesce((item.value->>'probability')::integer, item.ordinality::integer * 10))) as probability
  from jsonb_array_elements(stored_stages) with ordinality as item(value, ordinality)
  order by item.ordinality;
end;
$$;

create or replace function public.update_shared_pipeline_stages(stages jsonb)
returns table(id uuid, stage_key text, name text, stage_order integer, probability integer)
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  current_org_id uuid;
  stage_count integer;
  normalized_stages jsonb;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if jsonb_typeof(stages) <> 'array' then
    raise exception 'Stages must be a JSON array';
  end if;

  select u.organization_id
  into current_org_id
  from public.users u
  where u.id = auth.uid()
    and u.status = 'active';

  if current_org_id is null then
    raise exception 'Active CRM user not found';
  end if;

  create temporary table tmp_stage_updates (
    stage_order integer primary key,
    stage_key text not null,
    name text not null,
    probability integer not null
  ) on commit drop;

  insert into tmp_stage_updates (stage_order, stage_key, name, probability)
  select
    item.ordinality::integer,
    coalesce(nullif(trim(item.value->>'id'), ''), 'stage-' || item.ordinality::text),
    nullif(trim(item.value->>'name'), ''),
    least(100, greatest(0, coalesce((item.value->>'probability')::integer, item.ordinality::integer * 10)))
  from jsonb_array_elements(stages) with ordinality as item(value, ordinality);

  delete from tmp_stage_updates tsu
  where tsu.name is null;

  select count(*) into stage_count from tmp_stage_updates;

  if stage_count < 1 then
    raise exception 'At least one pipeline stage is required';
  end if;

  if exists (
    select 1
    from tmp_stage_updates tsu
    group by lower(tsu.name)
    having count(*) > 1
  ) then
    raise exception 'Stage names must be unique';
  end if;

  select jsonb_agg(
    jsonb_build_object(
      'id', tsu.stage_key,
      'name', tsu.name,
      'stage_order', tsu.stage_order,
      'probability', tsu.probability
    )
    order by tsu.stage_order
  )
  into normalized_stages
  from tmp_stage_updates tsu;

  update public.organizations
  set metadata = coalesce(organizations.metadata, '{}'::jsonb) || jsonb_build_object('pipeline_stages', normalized_stages),
      updated_at = now()
  where organizations.id = current_org_id;

  return query
  select *
  from public.get_shared_pipeline_stages();
end;
$$;

update public.organizations
set metadata = coalesce(metadata, '{}'::jsonb)
  || jsonb_build_object('pipeline_stages', public.default_shared_pipeline_stages()),
  updated_at = now()
where not (coalesce(metadata, '{}'::jsonb) ? 'pipeline_stages');

grant all on function public.default_shared_pipeline_stages() to anon;
grant all on function public.default_shared_pipeline_stages() to authenticated;
grant all on function public.default_shared_pipeline_stages() to service_role;
grant all on function public.get_shared_pipeline_stages() to anon;
grant all on function public.get_shared_pipeline_stages() to authenticated;
grant all on function public.get_shared_pipeline_stages() to service_role;
grant all on function public.update_shared_pipeline_stages(jsonb) to anon;
grant all on function public.update_shared_pipeline_stages(jsonb) to authenticated;
grant all on function public.update_shared_pipeline_stages(jsonb) to service_role;
