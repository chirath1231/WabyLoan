-- Waby Loan schema (Postgres / Supabase)
create extension if not exists pgcrypto;

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  password_hash text not null,
  name text not null,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now()
);

create table if not exists banks (
  id text primary key,
  name text not null,
  short text not null,
  type text not null default 'bank' check (type in ('bank', 'finance')),
  active boolean not null default true,
  sponsored boolean not null default false,
  base_rate numeric(6,3) not null,
  max_term_years jsonb not null default '{}'::jsonb,
  doc_charge_pct numeric(6,3),
  doc_charge_min numeric(14,2),
  doc_charge_cap numeric(14,2),
  color text,
  allowed_sectors text[] not null default '{}',
  target_occupation text not null default 'all',
  remarks jsonb not null default '[]'::jsonb,
  special_scheme_remarks jsonb not null default '[]'::jsonb,
  special_rate numeric(6,3),
  special_doc_charge_pct numeric(6,3),
  special_max_term_years integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists company_lists (
  id text primary key,
  bank_id text not null references banks(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists company_list_entries (
  id uuid primary key default gen_random_uuid(),
  list_id text not null references company_lists(id) on delete cascade,
  name text not null,
  tier text,
  sector text
);

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  bank_id text not null references banks(id) on delete cascade,
  slug text not null,
  name text not null,
  category text not null check (category in ('personal', 'professional', 'housing', 'vehicle', 'business', 'pension')),
  status text not null default 'active' check (status in ('active', 'suspended', 'promotional')),
  rate numeric(6,3) not null,
  interest_rate_type text not null check (interest_rate_type in ('variable', 'fixed', 'flat')),
  doc_charge_basis text not null check (doc_charge_basis in ('percent', 'fixed')),
  doc_charge_value numeric(14,4) not null default 0,
  doc_charge_min numeric(14,2) not null default 0,
  doc_charge_max numeric(14,2) not null default 0,
  max_term_years integer not null,
  dti_override numeric(5,2),
  ot_included boolean not null default false,
  other_income_pct numeric(5,2) not null default 0,
  loan_amount_min numeric(14,2) not null default 0,
  loan_amount_max numeric(14,2) not null default 0,
  min_net_monthly_income numeric(14,2) not null default 0,
  target_occupation jsonb not null default '"all"'::jsonb,
  target_gender text not null default 'all' check (target_gender in ('all', 'male', 'female')),
  common_loan boolean not null default false,
  companies_list_required boolean not null default false,
  companies_list_id text references company_lists(id),
  age_min integer not null default 18,
  age_max_at_maturity integer not null default 70,
  min_employment_months integer not null default 0,
  guarantor_required text not null default 'no' check (guarantor_required in ('no', '1', '2')),
  collateral_required text not null default 'none',
  insurance_required text not null default 'none',
  balloon_allowed text not null default 'na' check (balloon_allowed in ('na', 'yes', 'no')),
  balloon_pct numeric(5,2) not null default 0,
  early_settlement_allowed boolean not null default true,
  early_settlement_charge_pct numeric(5,2) not null default 0,
  late_payment_penalty_pct numeric(5,2) not null default 0,
  grace_period_days integer not null default 0,
  processing_days integer not null default 0,
  crib_check_required boolean not null default true,
  salary_credit_required boolean not null default false,
  co_applicant_allowed boolean not null default false,
  top_up_after_months integer,
  currency text not null default 'LKR',
  remarks jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists products_bank_id_idx on products(bank_id);
create index if not exists products_category_idx on products(category);

create table if not exists occupations (
  id text primary key,
  label text not null,
  special boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists admin_settings (
  id boolean primary key default true check (id),
  dti_government numeric(5,2) not null default 70,
  dti_semi_government numeric(5,2) not null default 65,
  dti_private numeric(5,2) not null default 60,
  dti_self_employed numeric(5,2) not null default 55,
  business_loan_enabled boolean not null default false,
  loan_rounding_step numeric(14,2) not null default 0,
  pension_max_age integer not null default 80,
  updated_at timestamptz not null default now()
);

create table if not exists soft_leads (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null,
  category text,
  bank_id text references banks(id),
  created_at timestamptz not null default now()
);

create table if not exists applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete set null,
  bank_id text references banks(id),
  product_id uuid references products(id),
  category text not null,
  requested_amount numeric(14,2),
  applicant_snapshot jsonb not null default '{}'::jsonb,
  computed_result jsonb not null default '{}'::jsonb,
  status text not null default 'new' check (status in ('new', 'contacted', 'approved', 'rejected', 'closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists applications_user_id_idx on applications(user_id);

create table if not exists audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_email text,
  action text not null,
  details jsonb,
  created_at timestamptz not null default now()
);
create index if not exists audit_log_created_at_idx on audit_log(created_at desc);
