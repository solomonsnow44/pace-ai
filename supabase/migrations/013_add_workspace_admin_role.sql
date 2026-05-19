-- Separate company-level settings admins from operational admins.
alter type public.user_role add value if not exists 'admin';
