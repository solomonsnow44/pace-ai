alter table public.contacts
  add column if not exists direct_dial text;

with target_org as (
  select organization_id
  from public.clients
  where slug = 'emsol'
  limit 1
),
crm_json as (
  select
    jsonb_build_object(
      'clientAccounts',
      coalesce((
        select jsonb_agg(jsonb_build_object(
          'id', c.id,
          'name', c.name,
          'workspace', coalesce(w.name, 'Client account workspace'),
          'status', initcap(c.status::text),
          'owner', 'Workspace Admin',
          'industry', c.industry,
          'website', c.website,
          'companies', (
            select count(*) from public.companies co where co.client_id = c.id
          ),
          'contacts', (
            select count(*) from public.contacts ct where ct.client_id = c.id
          ),
          'health', 'Active'
        ) order by c.name)
        from public.clients c
        left join public.workspaces w on w.client_id = c.id
        where c.organization_id = (select organization_id from target_org)
      ), '[]'::jsonb),

      'campaigns',
      coalesce((
        select jsonb_agg(jsonb_build_object(
          'id', ca.id,
          'clientId', ca.client_id,
          'name', ca.name,
          'status', initcap(ca.status::text),
          'owner', 'Workspace Admin',
          'channel', coalesce(ca.channel, 'Outbound'),
          'companies', (
            select count(distinct cm.company_id)
            from public.campaign_members cm
            where cm.campaign_id = ca.id
              and cm.company_id is not null
          ),
          'contacts', (
            select count(distinct cm.contact_id)
            from public.campaign_members cm
            where cm.campaign_id = ca.id
              and cm.contact_id is not null
          ),
          'meetings', 0,
          'nextAction', 'Review imported target list'
        ) order by ca.name)
        from public.campaigns ca
        where ca.organization_id = (select organization_id from target_org)
      ), '[]'::jsonb),

      'companies',
      coalesce((
        select jsonb_agg(jsonb_build_object(
          'id', co.id,
          'clientId', co.client_id,
          'name', co.name,
          'domain', co.domain,
          'website', co.website,
          'owner', 'Workspace Admin',
          'stage', 'Imported',
          'status', initcap(co.status::text),
          'industry', co.industry,
          'employees', co.employee_count,
          'value', co.annual_revenue,
          'location', co.custom_fields ->> 'company_hq_location',
          'lastActivity', 'Imported from EMSOL campaign data',
          'nextAction', 'Review company',
          'insight', co.custom_fields ->> 'company_description'
        ) order by co.name)
        from public.companies co
        where co.organization_id = (select organization_id from target_org)
      ), '[]'::jsonb),

      'contacts',
      coalesce((
        select jsonb_agg(jsonb_build_object(
          'id', ct.id,
          'clientId', ct.client_id,
          'companyId', ct.company_id,
          'accountId', ct.company_id,
          'name', coalesce(ct.full_name, trim(coalesce(ct.first_name, '') || ' ' || coalesce(ct.last_name, ''))),
          'firstName', ct.first_name,
          'lastName', ct.last_name,
          'email', ct.email,
          'phone', coalesce(ct.mobile, ct.direct_dial, ct.phone),
          'mobile', ct.mobile,
          'directDial', ct.direct_dial,
          'title', ct.job_title,
          'role', ct.job_title,
          'linkedin', ct.linkedin_url,
          'status', initcap(ct.status::text),
          'owner', 'Workspace Admin',
          'lastTouch', 'Imported from EMSOL campaign data'
        ) order by ct.created_at)
        from public.contacts ct
        where ct.organization_id = (select organization_id from target_org)
      ), '[]'::jsonb),

      'teamMembers', '[]'::jsonb,
      'deals', '[]'::jsonb,
      'activities', '[]'::jsonb,
      'researchItems', '[]'::jsonb,
      'files', '[]'::jsonb,
      'scriptItems', '[]'::jsonb,
      'callInsights', '[]'::jsonb,
      'weeklyReports', '[]'::jsonb,
      'integrations', '[]'::jsonb
    ) as crm_data
)
update public.organizations o
set metadata = coalesce(o.metadata, '{}'::jsonb)
  || jsonb_build_object(
    'crm_data', crm_json.crm_data,
    'crm_data_schema', 'client_accounts_companies_v1',
    'crm_data_updated_at', now()
  ),
  updated_at = now()
from crm_json
where o.id = (select organization_id from target_org);
