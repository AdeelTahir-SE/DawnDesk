-- Create a public storage bucket for prompt hub images
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'prompt-hub-images',
  'prompt-hub-images',
  true,                          -- publicly readable
  5242880,                       -- 5 MB max per file
  array['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/svg+xml']
)
on conflict (id) do nothing;

-- Anyone can read/download images (public bucket)
drop policy if exists "Public read prompt hub images" on storage.objects;
create policy "Public read prompt hub images"
  on storage.objects
  for select
  using (bucket_id = 'prompt-hub-images');

-- Authenticated users can upload images to their own user folder
drop policy if exists "Authenticated users upload prompt hub images" on storage.objects;
create policy "Authenticated users upload prompt hub images"
  on storage.objects
  for insert
  with check (
    bucket_id = 'prompt-hub-images'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users can update/overwrite their own images
drop policy if exists "Users update own prompt hub images" on storage.objects;
create policy "Users update own prompt hub images"
  on storage.objects
  for update
  using (
    bucket_id = 'prompt-hub-images'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users can delete their own images
drop policy if exists "Users delete own prompt hub images" on storage.objects;
create policy "Users delete own prompt hub images"
  on storage.objects
  for delete
  using (
    bucket_id = 'prompt-hub-images'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
