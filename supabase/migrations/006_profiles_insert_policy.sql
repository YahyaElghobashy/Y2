-- Allow authenticated users to insert their own profile row.
-- Safety net for when the handle_new_user trigger doesn't fire
-- (e.g. users seeded before migrations were applied).
create policy "profiles: own insert"
  on public.profiles
  for insert
  with check (auth.uid() = id);
