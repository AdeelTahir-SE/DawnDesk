create table if not exists public.prompt_hub_prompts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  category text not null,
  content text not null,
  output_json jsonb,
  model text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists prompt_hub_prompts_created_at_idx
  on public.prompt_hub_prompts (created_at desc);

create index if not exists prompt_hub_prompts_category_idx
  on public.prompt_hub_prompts (category);

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

alter table public.prompt_hub_prompts enable row level security;
alter table public.prompt_hub_saves enable row level security;

drop policy if exists "Anyone can read prompt hub prompts" on public.prompt_hub_prompts;
drop policy if exists "Authenticated users can publish prompt hub prompts" on public.prompt_hub_prompts;
drop policy if exists "Authors can update prompt hub prompts" on public.prompt_hub_prompts;
drop policy if exists "Authors can delete prompt hub prompts" on public.prompt_hub_prompts;
drop policy if exists "Anyone can read prompt hub saves" on public.prompt_hub_saves;
drop policy if exists "Authenticated users can save prompt hub prompts" on public.prompt_hub_saves;
drop policy if exists "Users can delete their prompt hub saves" on public.prompt_hub_saves;

create policy "Anyone can read prompt hub prompts"
  on public.prompt_hub_prompts
  for select
  using (true);

create policy "Authenticated users can publish prompt hub prompts"
  on public.prompt_hub_prompts
  for insert
  with check (auth.uid() = author_id);

create policy "Authors can update prompt hub prompts"
  on public.prompt_hub_prompts
  for update
  using (auth.uid() = author_id)
  with check (auth.uid() = author_id);

create policy "Authors can delete prompt hub prompts"
  on public.prompt_hub_prompts
  for delete
  using (auth.uid() = author_id);

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
