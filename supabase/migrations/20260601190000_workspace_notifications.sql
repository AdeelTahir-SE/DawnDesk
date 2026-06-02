create table if not exists public.workspace_notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  alert_type text not null check (alert_type in ('mention', 'invite_declined')),
  resource_type text not null check (resource_type in ('project', 'finance')),
  resource_id uuid not null,
  resource_name text not null,
  section text,
  title text not null,
  body text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists workspace_notifications_recipient_idx
  on public.workspace_notifications (recipient_id, is_read, created_at desc);

alter table public.workspace_notifications enable row level security;

drop policy if exists "Users can read own workspace notifications" on public.workspace_notifications;
drop policy if exists "Users can update own workspace notifications" on public.workspace_notifications;

create policy "Users can read own workspace notifications"
  on public.workspace_notifications for select
  using (recipient_id = auth.uid());

create policy "Users can update own workspace notifications"
  on public.workspace_notifications for update
  using (recipient_id = auth.uid())
  with check (recipient_id = auth.uid());

create or replace function public.create_section_mention_notifications()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  mentioned_id uuid;
  resource_label text;
  actor_label text;
begin
  if new.mentioned_user_ids is null or array_length(new.mentioned_user_ids, 1) is null then
    return new;
  end if;

  if new.sub_app = 'project' then
    select name into resource_label
    from public.projects
    where id = new.project_id;
  else
    select name into resource_label
    from public.finance_workspaces
    where id = new.finance_workspace_id;
  end if;

  select coalesce(display_name, email, 'Someone') into actor_label
  from public.profiles
  where id = new.author_id;

  foreach mentioned_id in array new.mentioned_user_ids loop
    if mentioned_id is not null and mentioned_id <> new.author_id then
      insert into public.workspace_notifications (
        recipient_id,
        actor_id,
        alert_type,
        resource_type,
        resource_id,
        resource_name,
        section,
        title,
        body
      )
      values (
        mentioned_id,
        new.author_id,
        'mention',
        new.sub_app,
        coalesce(new.project_id, new.finance_workspace_id),
        coalesce(resource_label, 'Workspace'),
        new.comment_section,
        actor_label || ' mentioned you',
        left(new.actual_comment, 240)
      );
    end if;
  end loop;

  return new;
end;
$$;

drop trigger if exists section_comment_mentions_to_notifications on public.section_comments;
create trigger section_comment_mentions_to_notifications
after insert on public.section_comments
for each row
execute function public.create_section_mention_notifications();

create or replace function public.list_workspace_notifications()
returns table (
  id uuid,
  alert_type text,
  resource_type text,
  resource_id uuid,
  resource_name text,
  section text,
  title text,
  body text,
  is_read boolean,
  created_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select
    wn.id,
    wn.alert_type,
    wn.resource_type,
    wn.resource_id,
    wn.resource_name,
    wn.section,
    wn.title,
    wn.body,
    wn.is_read,
    wn.created_at
  from public.workspace_notifications wn
  where wn.recipient_id = auth.uid()
    and wn.is_read = false
  order by wn.created_at desc
  limit 50;
$$;

create or replace function public.mark_workspace_notification_read(notification_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.workspace_notifications
  set is_read = true
  where id = notification_id
    and recipient_id = auth.uid();
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
  target_owner_id uuid;
  target_resource_id uuid;
  target_resource_name text;
  target_role text;
begin
  if auth.uid() is null or current_email = '' then
    raise exception 'You must be signed in with an email address to decline invites.';
  end if;

  if invite_kind = 'project' then
    select p.owner_id, p.id, p.name, pm.role::text
    into target_owner_id, target_resource_id, target_resource_name, target_role
    from public.project_members pm
    join public.projects p on p.id = pm.project_id
    where pm.id = target_invite_id
      and pm.status = 'pending'
      and pm.invited_email is not null
      and lower(pm.invited_email) = current_email;

    delete from public.project_members
    where id = target_invite_id
      and status = 'pending'
      and invited_email is not null
      and lower(invited_email) = current_email;
  elsif invite_kind = 'finance' then
    select fw.owner_id, fw.id, fw.name, fwm.role::text
    into target_owner_id, target_resource_id, target_resource_name, target_role
    from public.finance_workspace_members fwm
    join public.finance_workspaces fw on fw.id = fwm.workspace_id
    where fwm.id = target_invite_id
      and fwm.status = 'pending'
      and fwm.invited_email is not null
      and lower(fwm.invited_email) = current_email;

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

  if target_owner_id is not null then
    insert into public.workspace_notifications (
      recipient_id,
      actor_id,
      alert_type,
      resource_type,
      resource_id,
      resource_name,
      title,
      body
    )
    values (
      target_owner_id,
      auth.uid(),
      'invite_declined',
      invite_kind,
      target_resource_id,
      coalesce(target_resource_name, 'Workspace'),
      current_email || ' declined your invitation',
      'The invitation for ' || coalesce(target_role, 'member') || ' access was declined.'
    );
  end if;
end;
$$;
