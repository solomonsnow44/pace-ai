alter table public.users
  add column if not exists currency_code text not null default 'GBP';

alter table public.users
  drop constraint if exists users_currency_code_check;

alter table public.users
  add constraint users_currency_code_check
  check (currency_code in ('EUR', 'GBP', 'USD'));

update public.users
set
  currency_code = coalesce(nullif(upper(trim(metadata ->> 'currency_code')), ''), currency_code),
  metadata = coalesce(metadata, '{}'::jsonb) - 'currency_code',
  updated_at = now()
where metadata ? 'currency_code'
  and upper(trim(metadata ->> 'currency_code')) in ('EUR', 'GBP', 'USD');
