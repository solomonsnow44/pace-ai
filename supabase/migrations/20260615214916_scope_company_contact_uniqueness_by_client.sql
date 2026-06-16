drop index if exists public.companies_org_name_key;

create unique index if not exists companies_org_client_name_key
  on public.companies (organization_id, client_id, lower(name))
  where client_id is not null;

create unique index if not exists companies_org_name_unscoped_key
  on public.companies (organization_id, lower(name))
  where client_id is null;

drop index if exists public.contacts_identity_key;

create unique index if not exists contacts_client_identity_key
  on public.contacts (organization_id, client_id, normalized_identity_key)
  where normalized_identity_key is not null
    and trim(normalized_identity_key) <> ''
    and client_id is not null;

create unique index if not exists contacts_org_identity_unscoped_key
  on public.contacts (organization_id, normalized_identity_key)
  where normalized_identity_key is not null
    and trim(normalized_identity_key) <> ''
    and client_id is null;
