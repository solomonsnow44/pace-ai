create or replace function public.ensure_default_pipeline() returns uuid
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  current_user_id uuid := auth.uid();
  current_org_id uuid;
  client_id uuid;
  workspace_id uuid;
  v_pipeline_id uuid;
begin
  if current_user_id is null then
    raise exception 'Authentication required';
  end if;

  select organization_id
  into current_org_id
  from public.users
  where id = current_user_id
    and status = 'active';

  if current_org_id is null then
    raise exception 'Active CRM user not found';
  end if;

  select c.id
  into client_id
  from public.clients c
  where c.organization_id = current_org_id
    and c.slug = 'default'
  limit 1;

  if client_id is null then
    insert into public.clients (
      organization_id,
      name,
      slug,
      owner_id,
      status,
      settings
    )
    values (
      current_org_id,
      'Default client',
      'default',
      current_user_id,
      'active',
      '{"shared_pipeline": true}'::jsonb
    )
    returning id into client_id;
  end if;

  insert into public.client_members (
    organization_id,
    client_id,
    user_id,
    role
  )
  values (
    current_org_id,
    client_id,
    current_user_id,
    'owner'
  )
  on conflict (client_id, user_id) do nothing;

  select w.id
  into workspace_id
  from public.workspaces w
  where w.organization_id = current_org_id
    and w.client_id = client_id
    and w.slug = 'default'
  limit 1;

  if workspace_id is null then
    insert into public.workspaces (
      organization_id,
      client_id,
      name,
      slug,
      owner_id,
      status,
      settings
    )
    values (
      current_org_id,
      client_id,
      'Default workspace',
      'default',
      current_user_id,
      'active',
      '{"shared_pipeline": true}'::jsonb
    )
    returning id into workspace_id;
  end if;

  insert into public.workspace_members (
    organization_id,
    client_id,
    workspace_id,
    user_id,
    role
  )
  values (
    current_org_id,
    client_id,
    workspace_id,
    current_user_id,
    'admin'
  )
  on conflict (workspace_id, user_id) do nothing;

  select p.id
  into v_pipeline_id
  from public.pipelines p
  where p.organization_id = current_org_id
    and p.client_id = client_id
    and p.workspace_id = workspace_id
    and p.is_default = true
  limit 1;

  if v_pipeline_id is null then
    insert into public.pipelines (
      organization_id,
      client_id,
      workspace_id,
      name,
      is_default,
      status,
      created_by
    )
    values (
      current_org_id,
      client_id,
      workspace_id,
      'Default pipeline',
      true,
      'active',
      current_user_id
    )
    returning id into v_pipeline_id;
  end if;

  insert into public.pipeline_stages (
    organization_id,
    client_id,
    workspace_id,
    pipeline_id,
    name,
    stage_order,
    probability
  )
  values
    (current_org_id, client_id, workspace_id, v_pipeline_id, 'Research', 1, 10),
    (current_org_id, client_id, workspace_id, v_pipeline_id, 'Preparation', 2, 20),
    (current_org_id, client_id, workspace_id, v_pipeline_id, 'Qualify', 3, 35),
    (current_org_id, client_id, workspace_id, v_pipeline_id, 'Discover', 4, 50),
    (current_org_id, client_id, workspace_id, v_pipeline_id, 'Alignment', 5, 65),
    (current_org_id, client_id, workspace_id, v_pipeline_id, 'Position', 6, 80),
    (current_org_id, client_id, workspace_id, v_pipeline_id, 'Intent to Buy', 7, 90)
  on conflict (pipeline_id, stage_order) do nothing;

  return v_pipeline_id;
end;
$$;

create or replace function public.get_shared_pipeline_stages() returns table(id uuid, stage_key text, name text, stage_order integer, probability integer)
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_pipeline_id uuid;
begin
  v_pipeline_id := public.ensure_default_pipeline();

  return query
  select
    ps.id,
    case ps.stage_order
      when 1 then 'research'
      when 2 then 'preparation'
      when 3 then 'qualify'
      when 4 then 'discover'
      when 5 then 'alignment'
      when 6 then 'position'
      when 7 then 'intent-to-buy'
      else 'stage-' || ps.stage_order::text
    end as stage_key,
    ps.name,
    ps.stage_order,
    ps.probability
  from public.pipeline_stages ps
  where ps.pipeline_id = v_pipeline_id
  order by ps.stage_order;
end;
$$;

create or replace function public.update_shared_pipeline_stages(stages jsonb) returns table(id uuid, stage_key text, name text, stage_order integer, probability integer)
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_pipeline_id uuid;
  stage_count integer;
  pipeline_scope record;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if jsonb_typeof(stages) <> 'array' then
    raise exception 'Stages must be a JSON array';
  end if;

  v_pipeline_id := public.ensure_default_pipeline();

  select p.organization_id, p.client_id, p.workspace_id
  into pipeline_scope
  from public.pipelines p
  where p.id = v_pipeline_id;

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

  delete from tmp_stage_updates
  where name is null;

  select count(*) into stage_count from tmp_stage_updates;

  if stage_count < 1 then
    raise exception 'At least one pipeline stage is required';
  end if;

  if exists (
    select 1
    from tmp_stage_updates
    group by lower(name)
    having count(*) > 1
  ) then
    raise exception 'Stage names must be unique';
  end if;

  update public.pipeline_stages ps
  set name = 'tmp-' || ps.id::text,
      updated_at = now()
  where ps.pipeline_id = v_pipeline_id;

  delete from public.pipeline_stages ps
  where ps.pipeline_id = v_pipeline_id
    and not exists (
      select 1
      from tmp_stage_updates tsu
      where tsu.stage_order = ps.stage_order
    );

  insert into public.pipeline_stages (
    organization_id,
    client_id,
    workspace_id,
    pipeline_id,
    name,
    stage_order,
    probability
  )
  select
    pipeline_scope.organization_id,
    pipeline_scope.client_id,
    pipeline_scope.workspace_id,
    v_pipeline_id,
    tsu.name,
    tsu.stage_order,
    tsu.probability
  from tmp_stage_updates tsu
  on conflict (pipeline_id, stage_order) do update
  set name = excluded.name,
      probability = excluded.probability,
      updated_at = now();

  return query
  select *
  from public.get_shared_pipeline_stages();
end;
$$;

do $$
declare
  target_pipeline_id uuid;
begin
  for target_pipeline_id in
    select pipeline_id
    from public.pipeline_stages
    group by pipeline_id
    having array_agg(name order by stage_order) = array['Lead In','Researching','Contacted','Meeting','Qualified']
  loop
    update public.pipeline_stages
    set name = case stage_order
      when 1 then 'Research'
      when 2 then 'Preparation'
      when 3 then 'Qualify'
      when 4 then 'Discover'
      when 5 then 'Alignment'
      else name
    end,
    updated_at = now()
    where pipeline_id = target_pipeline_id
      and stage_order between 1 and 5;

    insert into public.pipeline_stages (
      organization_id,
      client_id,
      workspace_id,
      pipeline_id,
      name,
      stage_order,
      probability
    )
    select p.organization_id, p.client_id, p.workspace_id, p.id, 'Position', 6, 80
    from public.pipelines p
    where p.id = target_pipeline_id
    on conflict (pipeline_id, stage_order) do nothing;

    insert into public.pipeline_stages (
      organization_id,
      client_id,
      workspace_id,
      pipeline_id,
      name,
      stage_order,
      probability
    )
    select p.organization_id, p.client_id, p.workspace_id, p.id, 'Intent to Buy', 7, 90
    from public.pipelines p
    where p.id = target_pipeline_id
    on conflict (pipeline_id, stage_order) do nothing;
  end loop;
end;
$$;
