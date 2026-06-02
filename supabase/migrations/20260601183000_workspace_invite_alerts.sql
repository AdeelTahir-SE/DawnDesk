create or replace function public.list_pending_workspace_invites()
returns table (
  invite_id uuid,
  invite_type text,
  resource_id uuid,
  resource_name text,
  role text,
  invited_email text,
  created_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select
    pm.id as invite_id,
    'project'::text as invite_type,
    p.id as resource_id,
    p.name as resource_name,
    pm.role::text as role,
    pm.invited_email,
    pm.created_at
  from public.project_members pm
  join public.projects p on p.id = pm.project_id
  where pm.status = 'pending'
    and pm.invited_email is not null
    and lower(pm.invited_email) = lower(coalesce(auth.jwt() ->> 'email', ''))

  union all

  select
    fwm.id as invite_id,
    'finance'::text as invite_type,
    fw.id as resource_id,
    fw.name as resource_name,
    fwm.role::text as role,
    fwm.invited_email,
    fwm.created_at
  from public.finance_workspace_members fwm
  join public.finance_workspaces fw on fw.id = fwm.workspace_id
  where fwm.status = 'pending'
    and fwm.invited_email is not null
    and lower(fwm.invited_email) = lower(coalesce(auth.jwt() ->> 'email', ''))

  order by created_at desc;
$$;

create or replace function public.accept_workspace_invite(invite_kind text, target_invite_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  current_email text := lower(coalesce(auth.jwt() ->> 'email', ''));
begin
  if auth.uid() is null or current_email = '' then
    raise exception 'You must be signed in with an email address to accept invites.';
  end if;

  if invite_kind = 'project' then
    update public.project_members
    set user_id = auth.uid(),
        status = 'active'
    where id = target_invite_id
      and status = 'pending'
      and invited_email is not null
      and lower(invited_email) = current_email;
  elsif invite_kind = 'finance' then
    update public.finance_workspace_members
    set user_id = auth.uid(),
        status = 'active'
    where id = target_invite_id
      and status = 'pending'
      and invited_email is not null
      and lower(invited_email) = current_email;
  else
    raise exception 'Unsupported invite type: %', invite_kind;
  end if;

  if not found then
    raise exception 'Invite was not found or is no longer pending.';
  end if;
end;
$$;

create or replace function public.decline_workspace_invite(invite_kind text, target_invite_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  current_email text := lower(coalesce(auth.jwt() ->> 'email', ''));
begin
  if auth.uid() is null or current_email = '' then
    raise exception 'You must be signed in with an email address to decline invites.';
  end if;

  if invite_kind = 'project' then
    delete from public.project_members
    where id = target_invite_id
      and status = 'pending'
      and invited_email is not null
      and lower(invited_email) = current_email;
  elsif invite_kind = 'finance' then
    delete from public.finance_workspace_members
    where id = target_invite_id
      and status = 'pending'
      and invited_email is not null
      and lower(invited_email) = current_email;
  else
    raise exception 'Unsupported invite type: %', invite_kind;
  end if;

  if not found then
    raise exception 'Invite was not found or is no longer pending.';
  end if;
end;
$$;
