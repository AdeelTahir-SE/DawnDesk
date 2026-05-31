create table if not exists public.finance_workspace_preferences (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.finance_workspaces(id) on delete cascade,
  preference_key text not null,
  value_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, preference_key)
);

alter table public.finance_workspace_preferences enable row level security;

drop policy if exists "Finance members can read preferences" on public.finance_workspace_preferences;
drop policy if exists "Finance editors can insert preferences" on public.finance_workspace_preferences;
drop policy if exists "Finance editors can update preferences" on public.finance_workspace_preferences;
drop policy if exists "Finance editors can delete preferences" on public.finance_workspace_preferences;

create policy "Finance members can read preferences"
  on public.finance_workspace_preferences for select
  using (public.can_access_finance_workspace(workspace_id));

create policy "Finance editors can insert preferences"
  on public.finance_workspace_preferences for insert
  with check (public.can_edit_finance_workspace(workspace_id));

create policy "Finance editors can update preferences"
  on public.finance_workspace_preferences for update
  using (public.can_edit_finance_workspace(workspace_id))
  with check (public.can_edit_finance_workspace(workspace_id));

create policy "Finance editors can delete preferences"
  on public.finance_workspace_preferences for delete
  using (public.can_edit_finance_workspace(workspace_id));
