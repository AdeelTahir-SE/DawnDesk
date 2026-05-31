create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text not null,
  avatar_url text,
  updated_at timestamptz not null default now()
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  key text not null,
  description text,
  color_tag text not null default '#facc15',
  project_type text not null default 'Scrum',
  owner_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.project_members (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  invited_email text,
  role text not null check (role in ('Owner', 'Editor', 'Viewer')),
  status text not null default 'pending' check (status in ('active', 'pending')),
  created_at timestamptz not null default now(),
  unique (project_id, user_id),
  unique (project_id, invited_email)
);

create table if not exists public.finance_workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.finance_workspace_members (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.finance_workspaces(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  invited_email text,
  role text not null check (role in ('Owner', 'Accountant', 'Viewer')),
  status text not null default 'pending' check (status in ('active', 'pending')),
  created_at timestamptz not null default now(),
  unique (workspace_id, user_id),
  unique (workspace_id, invited_email)
);

-- Migration safety for projects/workspaces created by an older version of this file.
-- CREATE TABLE IF NOT EXISTS does not add new columns to existing tables.
alter table public.profiles
  add column if not exists email text,
  add column if not exists display_name text,
  add column if not exists avatar_url text,
  add column if not exists updated_at timestamptz not null default now();

alter table public.projects
  add column if not exists key text,
  add column if not exists description text,
  add column if not exists color_tag text not null default '#facc15',
  add column if not exists project_type text not null default 'Scrum',
  add column if not exists owner_id uuid references public.profiles(id) on delete cascade,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

alter table public.project_members
  add column if not exists user_id uuid references public.profiles(id) on delete cascade,
  add column if not exists invited_email text,
  add column if not exists role text not null default 'Viewer',
  add column if not exists status text not null default 'pending',
  add column if not exists created_at timestamptz not null default now();

alter table public.finance_workspaces
  add column if not exists owner_id uuid references public.profiles(id) on delete cascade,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

alter table public.finance_workspace_members
  add column if not exists user_id uuid references public.profiles(id) on delete cascade,
  add column if not exists invited_email text,
  add column if not exists role text not null default 'Viewer',
  add column if not exists status text not null default 'pending',
  add column if not exists created_at timestamptz not null default now();

create table if not exists public.section_comments (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade,
  finance_workspace_id uuid references public.finance_workspaces(id) on delete cascade,
  sub_app text not null check (sub_app in ('project', 'finance')),
  comment_section text not null,
  parent_id uuid references public.section_comments(id) on delete cascade,
  actual_comment text not null,
  author_id uuid not null references public.profiles(id) on delete cascade,
  mentioned_user_ids uuid[] not null default '{}',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (sub_app = 'project' and project_id is not null and finance_workspace_id is null)
    or
    (sub_app = 'finance' and finance_workspace_id is not null and project_id is null)
  )
);

create index if not exists section_comments_project_section_idx
  on public.section_comments (project_id, comment_section, created_at)
  where sub_app = 'project';

create index if not exists section_comments_parent_idx
  on public.section_comments (parent_id);

-- Project Manager source-of-truth tables
create table if not exists public.project_sprints (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  name text not null,
  status text not null default 'planned' check (status in ('planned', 'active', 'closed')),
  start_date date,
  end_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.project_workflow_statuses (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  name text not null,
  category text not null,
  position integer not null default 0,
  wip_limit integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.project_issues (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  sprint_id uuid references public.project_sprints(id) on delete set null,
  parent_id uuid references public.project_issues(id) on delete cascade,
  issue_type text not null,
  key text not null,
  title text not null,
  description text,
  status text not null,
  priority text not null,
  story_points integer,
  time_spent_minutes integer not null default 0,
  original_estimate_minutes integer,
  rank numeric not null default 0,
  pinned boolean not null default false,
  archived boolean not null default false,
  due_date date,
  created_by uuid references public.profiles(id) on delete set null,
  assigned_to uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, key)
);

create table if not exists public.project_labels (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  name text not null,
  color text not null,
  created_at timestamptz not null default now(),
  unique (project_id, name)
);

create table if not exists public.project_issue_labels (
  issue_id uuid not null references public.project_issues(id) on delete cascade,
  label_id uuid not null references public.project_labels(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (issue_id, label_id)
);

create table if not exists public.project_issue_comments (
  id uuid primary key default gen_random_uuid(),
  issue_id uuid not null references public.project_issues(id) on delete cascade,
  parent_id uuid references public.project_issue_comments(id) on delete cascade,
  content text not null,
  author_id uuid not null references public.profiles(id) on delete cascade,
  mentioned_user_ids uuid[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.project_issue_links (
  id uuid primary key default gen_random_uuid(),
  link_type text not null,
  source_issue_id uuid not null references public.project_issues(id) on delete cascade,
  target_issue_id uuid not null references public.project_issues(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (link_type, source_issue_id, target_issue_id)
);

create table if not exists public.project_worklogs (
  id uuid primary key default gen_random_uuid(),
  issue_id uuid not null references public.project_issues(id) on delete cascade,
  author_id uuid references public.profiles(id) on delete set null,
  minutes integer not null,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists public.project_versions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  name text not null,
  release_date date,
  released boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.project_issue_history (
  id uuid primary key default gen_random_uuid(),
  issue_id uuid not null references public.project_issues(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  field_name text not null,
  old_value text,
  new_value text,
  created_at timestamptz not null default now()
);

create table if not exists public.project_attachments (
  id uuid primary key default gen_random_uuid(),
  issue_id uuid not null references public.project_issues(id) on delete cascade,
  file_name text not null,
  storage_bucket text not null default 'project-attachments',
  storage_path text not null,
  uploaded_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.project_saved_filters (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  name text not null,
  jql_query text not null,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.project_custom_fields (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  name text not null,
  field_type text not null,
  created_at timestamptz not null default now(),
  unique (project_id, name)
);

create table if not exists public.project_custom_field_values (
  issue_id uuid not null references public.project_issues(id) on delete cascade,
  field_id uuid not null references public.project_custom_fields(id) on delete cascade,
  value text not null,
  updated_at timestamptz not null default now(),
  primary key (issue_id, field_id)
);

create table if not exists public.project_automation_rules (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  name text not null,
  trigger_type text not null,
  conditions_json jsonb not null default '{}'::jsonb,
  actions_json jsonb not null default '[]'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.project_strategies (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  name text not null,
  category text not null,
  markdown text not null,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Finance Manager source-of-truth tables
create table if not exists public.finance_accounts (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.finance_workspaces(id) on delete cascade,
  name text not null,
  type_ text not null,
  balance numeric not null default 0,
  currency text not null default 'USD',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.finance_transactions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.finance_workspaces(id) on delete cascade,
  account_id uuid references public.finance_accounts(id) on delete set null,
  amount numeric not null,
  type_ text not null,
  category text not null,
  description text not null default '',
  date date not null,
  status text not null default 'confirmed',
  notes text not null default '',
  receipt_bucket text,
  receipt_path text,
  is_recurring boolean not null default false,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.finance_budgets (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.finance_workspaces(id) on delete cascade,
  category text not null,
  limit_amount numeric not null,
  period text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.finance_goals (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.finance_workspaces(id) on delete cascade,
  name text not null,
  target_amount numeric not null,
  current_amount numeric not null default 0,
  deadline date not null,
  auto_allocate_percent numeric not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.finance_subscriptions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.finance_workspaces(id) on delete cascade,
  name text not null,
  amount numeric not null,
  billing_cycle text not null,
  next_date date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.finance_debts (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.finance_workspaces(id) on delete cascade,
  name text not null,
  amount numeric not null,
  type_ text not null,
  due_date date not null,
  paid_amount numeric not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.finance_invoices (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.finance_workspaces(id) on delete cascade,
  client_name text not null,
  total_amount numeric not null,
  status text not null,
  due_date date not null,
  items_json jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.finance_chart_of_accounts (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.finance_workspaces(id) on delete cascade,
  code text not null,
  name text not null,
  account_type text not null,
  balance numeric not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, code)
);

create table if not exists public.finance_journal_entries (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.finance_workspaces(id) on delete cascade,
  date date not null,
  reference text not null,
  description text not null,
  total_debit numeric not null,
  total_credit numeric not null,
  status text not null,
  lines_json jsonb not null default '[]'::jsonb,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.finance_vendor_bills (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.finance_workspaces(id) on delete cascade,
  vendor_name text not null,
  bill_number text not null,
  date date not null,
  due_date date not null,
  total_amount numeric not null,
  status text not null,
  items_json jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.finance_fixed_assets (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.finance_workspaces(id) on delete cascade,
  name text not null,
  description text not null default '',
  purchase_date date not null,
  purchase_price numeric not null,
  useful_life_years integer not null,
  salvage_value numeric not null default 0,
  status text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.finance_purchase_orders (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.finance_workspaces(id) on delete cascade,
  vendor_name text not null,
  date date not null,
  total_amount numeric not null,
  status text not null,
  items_json jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.finance_inventory_items (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.finance_workspaces(id) on delete cascade,
  sku text not null,
  name text not null,
  description text not null default '',
  quantity integer not null default 0,
  unit_cost numeric not null default 0,
  unit_price numeric not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, sku)
);

create table if not exists public.finance_tax_codes (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.finance_workspaces(id) on delete cascade,
  code text not null,
  description text not null,
  rate_percent numeric not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, code)
);

create table if not exists public.finance_audit_logs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.finance_workspaces(id) on delete cascade,
  timestamp timestamptz not null default now(),
  user_label text not null,
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  description text not null
);

create table if not exists public.finance_compliance_roles (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.finance_workspaces(id) on delete cascade,
  name text not null,
  description text not null,
  permissions_json jsonb not null default '[]'::jsonb,
  is_system boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.finance_period_closes (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.finance_workspaces(id) on delete cascade,
  period text not null,
  task text not null,
  assigned_to text not null,
  status text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.finance_exchange_rates (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.finance_workspaces(id) on delete cascade,
  pair text not null,
  rate numeric not null,
  date date not null,
  created_at timestamptz not null default now()
);

create table if not exists public.finance_ar_recurring_billing (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.finance_workspaces(id) on delete cascade,
  client_name text not null,
  plan_name text not null,
  amount numeric not null,
  next_billing_date date not null,
  status text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.finance_ar_dunning_campaigns (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.finance_workspaces(id) on delete cascade,
  name text not null,
  trigger_days_overdue integer not null,
  email_subject text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.finance_ar_revrec_schedules (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.finance_workspaces(id) on delete cascade,
  client_name text not null,
  total_amount numeric not null,
  recognized_amount numeric not null,
  deferred_amount numeric not null,
  months integer not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.project_members enable row level security;
alter table public.finance_workspaces enable row level security;
alter table public.finance_workspace_members enable row level security;
alter table public.section_comments enable row level security;
alter table public.project_sprints enable row level security;
alter table public.project_workflow_statuses enable row level security;
alter table public.project_issues enable row level security;
alter table public.project_labels enable row level security;
alter table public.project_issue_labels enable row level security;
alter table public.project_issue_comments enable row level security;
alter table public.project_issue_links enable row level security;
alter table public.project_worklogs enable row level security;
alter table public.project_versions enable row level security;
alter table public.project_issue_history enable row level security;
alter table public.project_attachments enable row level security;
alter table public.project_saved_filters enable row level security;
alter table public.project_custom_fields enable row level security;
alter table public.project_custom_field_values enable row level security;
alter table public.project_automation_rules enable row level security;
alter table public.project_strategies enable row level security;
alter table public.finance_accounts enable row level security;
alter table public.finance_transactions enable row level security;
alter table public.finance_budgets enable row level security;
alter table public.finance_goals enable row level security;
alter table public.finance_subscriptions enable row level security;
alter table public.finance_debts enable row level security;
alter table public.finance_invoices enable row level security;
alter table public.finance_chart_of_accounts enable row level security;
alter table public.finance_journal_entries enable row level security;
alter table public.finance_vendor_bills enable row level security;
alter table public.finance_fixed_assets enable row level security;
alter table public.finance_purchase_orders enable row level security;
alter table public.finance_inventory_items enable row level security;
alter table public.finance_tax_codes enable row level security;
alter table public.finance_audit_logs enable row level security;
alter table public.finance_compliance_roles enable row level security;
alter table public.finance_period_closes enable row level security;
alter table public.finance_exchange_rates enable row level security;
alter table public.finance_ar_recurring_billing enable row level security;
alter table public.finance_ar_dunning_campaigns enable row level security;
alter table public.finance_ar_revrec_schedules enable row level security;

create or replace function public.can_access_project(target_project_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.project_members pm
    where pm.project_id = target_project_id
      and pm.user_id = auth.uid()
      and pm.status = 'active'
  );
$$;

create or replace function public.can_edit_project(target_project_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.project_members pm
    where pm.project_id = target_project_id
      and pm.user_id = auth.uid()
      and pm.status = 'active'
      and pm.role in ('Owner', 'Editor')
  );
$$;

create or replace function public.can_access_finance_workspace(target_workspace_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.finance_workspace_members fwm
    where fwm.workspace_id = target_workspace_id
      and fwm.user_id = auth.uid()
      and fwm.status = 'active'
  );
$$;

create or replace function public.can_edit_finance_workspace(target_workspace_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.finance_workspace_members fwm
    where fwm.workspace_id = target_workspace_id
      and fwm.user_id = auth.uid()
      and fwm.status = 'active'
      and fwm.role in ('Owner', 'Accountant')
  );
$$;

drop policy if exists "Users can read their own profile" on public.profiles;
drop policy if exists "Collaborators can read visible profiles" on public.profiles;
drop policy if exists "Users can upsert their own profile" on public.profiles;
drop policy if exists "Users can update their own profile" on public.profiles;
drop policy if exists "Project members can read projects" on public.projects;
drop policy if exists "Authenticated users can create projects" on public.projects;
drop policy if exists "Owners can update projects" on public.projects;
drop policy if exists "Owners can delete projects" on public.projects;
drop policy if exists "Project members can read membership" on public.project_members;
drop policy if exists "Project owners can manage membership" on public.project_members;
drop policy if exists "Finance members can read workspaces" on public.finance_workspaces;
drop policy if exists "Authenticated users can create finance workspaces" on public.finance_workspaces;
drop policy if exists "Finance owners can update workspaces" on public.finance_workspaces;
drop policy if exists "Finance owners can delete workspaces" on public.finance_workspaces;
drop policy if exists "Finance members can read membership" on public.finance_workspace_members;
drop policy if exists "Finance owners can manage membership" on public.finance_workspace_members;
drop policy if exists "Project members can read section comments" on public.section_comments;
drop policy if exists "Finance members can read section comments" on public.section_comments;
drop policy if exists "Project members can create section comments" on public.section_comments;
drop policy if exists "Finance members can create section comments" on public.section_comments;
drop policy if exists "Comment authors can update section comments" on public.section_comments;
drop policy if exists "Comment authors and project owners can delete section comments" on public.section_comments;

create policy "Users can read their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Collaborators can read visible profiles"
  on public.profiles for select
  using (
    auth.uid() = id
    or exists (
      select 1
      from public.project_members viewer
      join public.project_members visible
        on visible.project_id = viewer.project_id
      where viewer.user_id = auth.uid()
        and viewer.status = 'active'
        and visible.user_id = profiles.id
        and visible.status = 'active'
    )
    or exists (
      select 1
      from public.finance_workspace_members viewer
      join public.finance_workspace_members visible
        on visible.workspace_id = viewer.workspace_id
      where viewer.user_id = auth.uid()
        and viewer.status = 'active'
        and visible.user_id = profiles.id
        and visible.status = 'active'
    )
  );

create policy "Users can upsert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "Project members can read projects"
  on public.projects for select
  using (
    exists (
      select 1 from public.project_members pm
      where pm.project_id = id
        and pm.user_id = auth.uid()
        and pm.status = 'active'
    )
  );

create policy "Authenticated users can create projects"
  on public.projects for insert
  with check (auth.uid() = owner_id);

create policy "Owners can update projects"
  on public.projects for update
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create policy "Owners can delete projects"
  on public.projects for delete
  using (owner_id = auth.uid());

create policy "Project members can read membership"
  on public.project_members for select
  using (
    user_id = auth.uid()
    or exists (select 1 from public.projects p where p.id = project_members.project_id and p.owner_id = auth.uid())
  );

create policy "Project owners can manage membership"
  on public.project_members for all
  using (exists (select 1 from public.projects p where p.id = project_members.project_id and p.owner_id = auth.uid()))
  with check (
    exists (
      select 1 from public.projects p
      where p.id = project_members.project_id
        and p.owner_id = auth.uid()
    )
  );

create policy "Finance members can read workspaces"
  on public.finance_workspaces for select
  using (
    exists (
      select 1 from public.finance_workspace_members fwm
      where fwm.workspace_id = id
        and fwm.user_id = auth.uid()
        and fwm.status = 'active'
    )
  );

create policy "Authenticated users can create finance workspaces"
  on public.finance_workspaces for insert
  with check (auth.uid() = owner_id);

create policy "Finance owners can update workspaces"
  on public.finance_workspaces for update
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create policy "Finance owners can delete workspaces"
  on public.finance_workspaces for delete
  using (owner_id = auth.uid());

create policy "Finance members can read membership"
  on public.finance_workspace_members for select
  using (
    user_id = auth.uid()
    or exists (select 1 from public.finance_workspaces fw where fw.id = finance_workspace_members.workspace_id and fw.owner_id = auth.uid())
  );

create policy "Finance owners can manage membership"
  on public.finance_workspace_members for all
  using (exists (select 1 from public.finance_workspaces fw where fw.id = finance_workspace_members.workspace_id and fw.owner_id = auth.uid()))
  with check (
    exists (
      select 1 from public.finance_workspaces fw
      where fw.id = finance_workspace_members.workspace_id
        and fw.owner_id = auth.uid()
    )
  );

create policy "Project members can read section comments"
  on public.section_comments for select
  using (
    sub_app = 'project'
    and exists (
      select 1 from public.project_members pm
      where pm.project_id = section_comments.project_id
        and pm.user_id = auth.uid()
        and pm.status = 'active'
    )
  );

create policy "Finance members can read section comments"
  on public.section_comments for select
  using (
    sub_app = 'finance'
    and exists (
      select 1 from public.finance_workspace_members fwm
      where fwm.workspace_id = section_comments.finance_workspace_id
        and fwm.user_id = auth.uid()
        and fwm.status = 'active'
    )
  );

create policy "Project members can create section comments"
  on public.section_comments for insert
  with check (
    sub_app = 'project'
    and author_id = auth.uid()
    and exists (
      select 1 from public.project_members pm
      where pm.project_id = section_comments.project_id
        and pm.user_id = auth.uid()
        and pm.status = 'active'
    )
  );

create policy "Finance members can create section comments"
  on public.section_comments for insert
  with check (
    sub_app = 'finance'
    and author_id = auth.uid()
    and exists (
      select 1 from public.finance_workspace_members fwm
      where fwm.workspace_id = section_comments.finance_workspace_id
        and fwm.user_id = auth.uid()
        and fwm.status = 'active'
    )
  );

create policy "Comment authors can update section comments"
  on public.section_comments for update
  using (author_id = auth.uid())
  with check (author_id = auth.uid());

create policy "Comment authors and project owners can delete section comments"
  on public.section_comments for delete
  using (
    author_id = auth.uid()
    or exists (
      select 1 from public.projects p
      where p.id = section_comments.project_id
        and p.owner_id = auth.uid()
    )
  );

do $$
declare
  tbl text;
begin
  foreach tbl in array array[
    'project_sprints',
    'project_workflow_statuses',
    'project_issues',
    'project_labels',
    'project_versions',
    'project_saved_filters',
    'project_custom_fields',
    'project_automation_rules',
    'project_strategies'
  ]
  loop
    if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = tbl and policyname = 'Project members can read') then
      execute format('create policy "Project members can read" on public.%I for select using (public.can_access_project(project_id))', tbl);
    end if;
    if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = tbl and policyname = 'Project editors can insert') then
      execute format('create policy "Project editors can insert" on public.%I for insert with check (public.can_edit_project(project_id))', tbl);
    end if;
    if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = tbl and policyname = 'Project editors can update') then
      execute format('create policy "Project editors can update" on public.%I for update using (public.can_edit_project(project_id)) with check (public.can_edit_project(project_id))', tbl);
    end if;
    if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = tbl and policyname = 'Project editors can delete') then
      execute format('create policy "Project editors can delete" on public.%I for delete using (public.can_edit_project(project_id))', tbl);
    end if;
  end loop;

  foreach tbl in array array[
    'finance_accounts',
    'finance_transactions',
    'finance_budgets',
    'finance_goals',
    'finance_subscriptions',
    'finance_debts',
    'finance_invoices',
    'finance_chart_of_accounts',
    'finance_journal_entries',
    'finance_vendor_bills',
    'finance_fixed_assets',
    'finance_purchase_orders',
    'finance_inventory_items',
    'finance_tax_codes',
    'finance_audit_logs',
    'finance_compliance_roles',
    'finance_period_closes',
    'finance_exchange_rates',
    'finance_ar_recurring_billing',
    'finance_ar_dunning_campaigns',
    'finance_ar_revrec_schedules'
  ]
  loop
    if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = tbl and policyname = 'Finance members can read') then
      execute format('create policy "Finance members can read" on public.%I for select using (public.can_access_finance_workspace(workspace_id))', tbl);
    end if;
    if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = tbl and policyname = 'Finance editors can insert') then
      execute format('create policy "Finance editors can insert" on public.%I for insert with check (public.can_edit_finance_workspace(workspace_id))', tbl);
    end if;
    if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = tbl and policyname = 'Finance editors can update') then
      execute format('create policy "Finance editors can update" on public.%I for update using (public.can_edit_finance_workspace(workspace_id)) with check (public.can_edit_finance_workspace(workspace_id))', tbl);
    end if;
    if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = tbl and policyname = 'Finance editors can delete') then
      execute format('create policy "Finance editors can delete" on public.%I for delete using (public.can_edit_finance_workspace(workspace_id))', tbl);
    end if;
  end loop;
end $$;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'project_issue_labels' and policyname = 'Project members can read issue labels') then
    create policy "Project members can read issue labels"
      on public.project_issue_labels for select
      using (
        exists (
          select 1 from public.project_issues i
          where i.id = project_issue_labels.issue_id
            and public.can_access_project(i.project_id)
        )
      );
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'project_issue_labels' and policyname = 'Project editors can manage issue labels') then
    create policy "Project editors can manage issue labels"
      on public.project_issue_labels for all
      using (
        exists (
          select 1 from public.project_issues i
          where i.id = project_issue_labels.issue_id
            and public.can_edit_project(i.project_id)
        )
      )
      with check (
        exists (
          select 1 from public.project_issues i
          where i.id = project_issue_labels.issue_id
            and public.can_edit_project(i.project_id)
        )
      );
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'project_issue_comments' and policyname = 'Project members can read issue comments') then
    create policy "Project members can read issue comments"
      on public.project_issue_comments for select
      using (
        exists (
          select 1 from public.project_issues i
          where i.id = project_issue_comments.issue_id
            and public.can_access_project(i.project_id)
        )
      );
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'project_issue_comments' and policyname = 'Project members can create issue comments') then
    create policy "Project members can create issue comments"
      on public.project_issue_comments for insert
      with check (
        author_id = auth.uid()
        and exists (
          select 1 from public.project_issues i
          where i.id = project_issue_comments.issue_id
            and public.can_access_project(i.project_id)
        )
      );
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'project_issue_comments' and policyname = 'Comment authors can update issue comments') then
    create policy "Comment authors can update issue comments"
      on public.project_issue_comments for update
      using (author_id = auth.uid())
      with check (author_id = auth.uid());
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'project_issue_comments' and policyname = 'Comment authors can delete issue comments') then
    create policy "Comment authors can delete issue comments"
      on public.project_issue_comments for delete
      using (author_id = auth.uid());
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'project_worklogs' and policyname = 'Project members can read worklogs') then
    create policy "Project members can read worklogs"
      on public.project_worklogs for select
      using (
        exists (
          select 1 from public.project_issues i
          where i.id = project_worklogs.issue_id
            and public.can_access_project(i.project_id)
        )
      );
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'project_worklogs' and policyname = 'Project editors can manage worklogs') then
    create policy "Project editors can manage worklogs"
      on public.project_worklogs for all
      using (
        exists (
          select 1 from public.project_issues i
          where i.id = project_worklogs.issue_id
            and public.can_edit_project(i.project_id)
        )
      )
      with check (
        exists (
          select 1 from public.project_issues i
          where i.id = project_worklogs.issue_id
            and public.can_edit_project(i.project_id)
        )
      );
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'project_custom_field_values' and policyname = 'Project members can read custom field values') then
    create policy "Project members can read custom field values"
      on public.project_custom_field_values for select
      using (
        exists (
          select 1 from public.project_issues i
          where i.id = project_custom_field_values.issue_id
            and public.can_access_project(i.project_id)
        )
      );
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'project_custom_field_values' and policyname = 'Project editors can manage custom field values') then
    create policy "Project editors can manage custom field values"
      on public.project_custom_field_values for all
      using (
        exists (
          select 1 from public.project_issues i
          where i.id = project_custom_field_values.issue_id
            and public.can_edit_project(i.project_id)
        )
      )
      with check (
        exists (
          select 1 from public.project_issues i
          where i.id = project_custom_field_values.issue_id
            and public.can_edit_project(i.project_id)
        )
      );
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'project_issue_links' and policyname = 'Project members can read issue links') then
    create policy "Project members can read issue links"
      on public.project_issue_links for select
      using (
        exists (
          select 1 from public.project_issues i
          where i.id = project_issue_links.source_issue_id
            and public.can_access_project(i.project_id)
        )
      );
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'project_issue_links' and policyname = 'Project editors can manage issue links') then
    create policy "Project editors can manage issue links"
      on public.project_issue_links for all
      using (
        exists (
          select 1 from public.project_issues i
          where i.id = project_issue_links.source_issue_id
            and public.can_edit_project(i.project_id)
        )
      )
      with check (
        exists (
          select 1 from public.project_issues source
          join public.project_issues target on target.id = project_issue_links.target_issue_id
          where source.id = project_issue_links.source_issue_id
            and source.project_id = target.project_id
            and public.can_edit_project(source.project_id)
        )
      );
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'project_issue_history' and policyname = 'Project members can read issue history') then
    create policy "Project members can read issue history"
      on public.project_issue_history for select
      using (
        exists (
          select 1 from public.project_issues i
          where i.id = project_issue_history.issue_id
            and public.can_access_project(i.project_id)
        )
      );
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'project_issue_history' and policyname = 'Project editors can create issue history') then
    create policy "Project editors can create issue history"
      on public.project_issue_history for insert
      with check (
        exists (
          select 1 from public.project_issues i
          where i.id = project_issue_history.issue_id
            and public.can_edit_project(i.project_id)
        )
      );
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'project_attachments' and policyname = 'Project members can read attachments') then
    create policy "Project members can read attachments"
      on public.project_attachments for select
      using (
        exists (
          select 1 from public.project_issues i
          where i.id = project_attachments.issue_id
            and public.can_access_project(i.project_id)
        )
      );
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'project_attachments' and policyname = 'Project editors can manage attachments') then
    create policy "Project editors can manage attachments"
      on public.project_attachments for all
      using (
        exists (
          select 1 from public.project_issues i
          where i.id = project_attachments.issue_id
            and public.can_edit_project(i.project_id)
        )
      )
      with check (
        exists (
          select 1 from public.project_issues i
          where i.id = project_attachments.issue_id
            and public.can_edit_project(i.project_id)
        )
      );
  end if;
end $$;


-- Run this in Supabase SQL Editor if you see:
-- "infinite recursion detected in policy for relation project_members"
--
-- The issue happens when a policy on project_members indirectly queries
-- project_members again through projects/profile access checks.

create or replace function public.owns_project(target_project_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.projects p
    where p.id = target_project_id
      and p.owner_id = auth.uid()
  );
$$;

create or replace function public.owns_finance_workspace(target_workspace_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.finance_workspaces fw
    where fw.id = target_workspace_id
      and fw.owner_id = auth.uid()
  );
$$;

create or replace function public.can_access_project(target_project_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.project_members pm
    where pm.project_id = target_project_id
      and pm.user_id = auth.uid()
      and pm.status = 'active'
  );
$$;

create or replace function public.can_edit_project(target_project_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.project_members pm
    where pm.project_id = target_project_id
      and pm.user_id = auth.uid()
      and pm.status = 'active'
      and pm.role in ('Owner', 'Editor')
  );
$$;

create or replace function public.can_access_finance_workspace(target_workspace_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.finance_workspace_members fwm
    where fwm.workspace_id = target_workspace_id
      and fwm.user_id = auth.uid()
      and fwm.status = 'active'
  );
$$;

create or replace function public.can_edit_finance_workspace(target_workspace_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.finance_workspace_members fwm
    where fwm.workspace_id = target_workspace_id
      and fwm.user_id = auth.uid()
      and fwm.status = 'active'
      and fwm.role in ('Owner', 'Accountant')
  );
$$;

drop policy if exists "Project members can read projects" on public.projects;
drop policy if exists "Authenticated users can create projects" on public.projects;
drop policy if exists "Owners can update projects" on public.projects;
drop policy if exists "Owners can delete projects" on public.projects;
drop policy if exists "Project members can read membership" on public.project_members;
drop policy if exists "Project owners can manage membership" on public.project_members;
drop policy if exists "Project owners can insert membership" on public.project_members;
drop policy if exists "Project owners can update membership" on public.project_members;
drop policy if exists "Project owners can delete membership" on public.project_members;
drop policy if exists "Finance members can read workspaces" on public.finance_workspaces;
drop policy if exists "Authenticated users can create finance workspaces" on public.finance_workspaces;
drop policy if exists "Finance owners can update workspaces" on public.finance_workspaces;
drop policy if exists "Finance owners can delete workspaces" on public.finance_workspaces;
drop policy if exists "Finance members can read membership" on public.finance_workspace_members;
drop policy if exists "Finance owners can manage membership" on public.finance_workspace_members;
drop policy if exists "Finance owners can insert membership" on public.finance_workspace_members;
drop policy if exists "Finance owners can update membership" on public.finance_workspace_members;
drop policy if exists "Finance owners can delete membership" on public.finance_workspace_members;
drop policy if exists "Project members can read section comments" on public.section_comments;
drop policy if exists "Project members can create section comments" on public.section_comments;
drop policy if exists "Finance members can read section comments" on public.section_comments;
drop policy if exists "Finance members can create section comments" on public.section_comments;

create policy "Project members can read projects"
  on public.projects for select
  using (public.can_access_project(id));

create policy "Authenticated users can create projects"
  on public.projects for insert
  with check (auth.uid() is not null and owner_id = auth.uid());

create policy "Owners can update projects"
  on public.projects for update
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create policy "Owners can delete projects"
  on public.projects for delete
  using (owner_id = auth.uid());

create policy "Project members can read membership"
  on public.project_members for select
  using (user_id = auth.uid() or public.owns_project(project_id));

create policy "Project owners can insert membership"
  on public.project_members for insert
  with check (public.owns_project(project_id));

create policy "Project owners can update membership"
  on public.project_members for update
  using (public.owns_project(project_id))
  with check (public.owns_project(project_id));

create policy "Project owners can delete membership"
  on public.project_members for delete
  using (public.owns_project(project_id));

create policy "Finance members can read workspaces"
  on public.finance_workspaces for select
  using (public.can_access_finance_workspace(id));

create policy "Authenticated users can create finance workspaces"
  on public.finance_workspaces for insert
  with check (auth.uid() is not null and owner_id = auth.uid());

create policy "Finance owners can update workspaces"
  on public.finance_workspaces for update
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create policy "Finance owners can delete workspaces"
  on public.finance_workspaces for delete
  using (owner_id = auth.uid());

create policy "Finance members can read membership"
  on public.finance_workspace_members for select
  using (user_id = auth.uid() or public.owns_finance_workspace(workspace_id));

create policy "Finance owners can insert membership"
  on public.finance_workspace_members for insert
  with check (
    public.owns_finance_workspace(workspace_id)
    or user_id = auth.uid()
  );

create policy "Finance owners can update membership"
  on public.finance_workspace_members for update
  using (public.owns_finance_workspace(workspace_id))
  with check (public.owns_finance_workspace(workspace_id));

create policy "Finance owners can delete membership"
  on public.finance_workspace_members for delete
  using (public.owns_finance_workspace(workspace_id));

create policy "Project members can read section comments"
  on public.section_comments for select
  using (
    sub_app = 'project'
    and public.can_access_project(project_id)
  );

create policy "Project members can create section comments"
  on public.section_comments for insert
  with check (
    sub_app = 'project'
    and author_id = auth.uid()
    and public.can_access_project(project_id)
  );

create policy "Finance members can read section comments"
  on public.section_comments for select
  using (
    sub_app = 'finance'
    and public.can_access_finance_workspace(finance_workspace_id)
  );

create policy "Finance members can create section comments"
  on public.section_comments for insert
  with check (
    sub_app = 'finance'
    and author_id = auth.uid()
    and public.can_access_finance_workspace(finance_workspace_id)
  );

create or replace function public.create_project_workspace(
  project_name text,
  project_key text,
  project_description text,
  project_color_tag text,
  project_type text
)
returns public.projects
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  current_email text := auth.jwt() ->> 'email';
  created_project public.projects;
begin
  if current_user_id is null then
    raise exception 'No authenticated Supabase user is signed in.';
  end if;

  insert into public.profiles (id, email, display_name, updated_at)
  values (
    current_user_id,
    current_email,
    coalesce(split_part(current_email, '@', 1), 'DawnDesk User'),
    now()
  )
  on conflict (id) do update
    set email = excluded.email,
        updated_at = now();

  insert into public.projects (
    name,
    key,
    description,
    color_tag,
    project_type,
    owner_id,
    created_at,
    updated_at
  )
  values (
    project_name,
    project_key,
    project_description,
    coalesce(project_color_tag, '#facc15'),
    coalesce(project_type, 'Scrum'),
    current_user_id,
    now(),
    now()
  )
  returning * into created_project;

  insert into public.project_members (
    project_id,
    user_id,
    invited_email,
    role,
    status
  )
  values (
    created_project.id,
    current_user_id,
    current_email,
    'Owner',
    'active'
  )
  on conflict do nothing;

  return created_project;
end;
$$;

create or replace function public.create_finance_workspace(workspace_name text)
returns public.finance_workspaces
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  current_email text := auth.jwt() ->> 'email';
  created_workspace public.finance_workspaces;
begin
  if current_user_id is null then
    raise exception 'No authenticated Supabase user is signed in.';
  end if;

  insert into public.profiles (id, email, display_name, updated_at)
  values (
    current_user_id,
    current_email,
    coalesce(split_part(current_email, '@', 1), 'DawnDesk User'),
    now()
  )
  on conflict (id) do update
    set email = excluded.email,
        updated_at = now();

  insert into public.finance_workspaces (name, owner_id, created_at, updated_at)
  values (coalesce(nullif(workspace_name, ''), 'Finance Workspace'), current_user_id, now(), now())
  returning * into created_workspace;

  insert into public.finance_workspace_members (
    workspace_id,
    user_id,
    invited_email,
    role,
    status
  )
  values (
    created_workspace.id,
    current_user_id,
    current_email,
    'Owner',
    'active'
  )
  on conflict do nothing;

  return created_workspace;
end;
$$;
