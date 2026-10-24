insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 5242880,
        array['image/jpeg','image/png','image/webp'])
on conflict (id) do update
  set public = true,
      file_size_limit = 5242880,
      allowed_mime_types = array['image/jpeg','image/png','image/webp'];

drop policy if exists "images public read" on storage.objects;
create policy "images public read" on storage.objects for select
  using (bucket_id = 'product-images');

drop policy if exists "images admin insert" on storage.objects;
create policy "images admin insert" on storage.objects for insert
  with check (bucket_id = 'product-images' and public.is_admin());

drop policy if exists "images admin update" on storage.objects;
create policy "images admin update" on storage.objects for update
  using (bucket_id = 'product-images' and public.is_admin())
  with check (bucket_id = 'product-images' and public.is_admin());

drop policy if exists "images admin delete" on storage.objects;
create policy "images admin delete" on storage.objects for delete
  using (bucket_id = 'product-images' and public.is_admin());
