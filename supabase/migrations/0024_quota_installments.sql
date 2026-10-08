-- Number of direct-debit installments a member splits the quota into (1 or 2),
-- and how many of them have been collected per year.

alter table profiles
  add column if not exists quota_installments smallint not null default 1
  check (quota_installments in (1, 2));

grant select (quota_installments) on public.profiles to authenticated;

alter table quota_payments
  add column if not exists installments_paid smallint not null default 0;
