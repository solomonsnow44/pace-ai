drop index if exists public.companies_domain_idx;

alter table public.companies
  drop column if exists domain;
