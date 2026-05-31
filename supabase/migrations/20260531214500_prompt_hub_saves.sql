create table if not exists public.prompt_hub_saves (
  id uuid primary key default gen_random_uuid(),
  prompt_id uuid not null references public.prompt_hub_prompts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (prompt_id, user_id)
);

create index if not exists prompt_hub_saves_prompt_id_idx
  on public.prompt_hub_saves (prompt_id);

create index if not exists prompt_hub_saves_user_id_idx
  on public.prompt_hub_saves (user_id);

alter table public.prompt_hub_saves enable row level security;

drop policy if exists "Anyone can read prompt hub saves" on public.prompt_hub_saves;
drop policy if exists "Authenticated users can save prompt hub prompts" on public.prompt_hub_saves;
drop policy if exists "Users can delete their prompt hub saves" on public.prompt_hub_saves;

create policy "Anyone can read prompt hub saves"
  on public.prompt_hub_saves
  for select
  using (true);

create policy "Authenticated users can save prompt hub prompts"
  on public.prompt_hub_saves
  for insert
  with check (auth.uid() = user_id);

create policy "Users can delete their prompt hub saves"
  on public.prompt_hub_saves
  for delete
  using (auth.uid() = user_id);
