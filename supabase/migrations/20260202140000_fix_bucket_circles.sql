-- Fix Circles Policy: Allow users to insert (create) a circle
-- Note: We only allow it if they are authenticated.
create policy "Authenticated users can create circles" on public.circles
  for insert with check (auth.role() = 'authenticated');

-- Fix Bucket List Policy: The previous 'ALL' policy used `bucket_list_items.circle_id` which doesn't exist on INSERT.
-- We must drop the old restrictive policy and add separate ones or a smarter one.

drop policy "Circle members can manage bucket list" on public.bucket_list_items;

-- Separate INSERT policy
create policy "Circle members can insert bucket list items" on public.bucket_list_items
  for insert with check (
    exists (
      select 1 from public.circle_memberships
      where circle_id = bucket_list_items.circle_id  -- This refers to the NEW row's circle_id
      and user_id = auth.uid()
    )
  );

-- Re-create UPDATE/DELETE policy (Management)
create policy "Circle members can update/delete bucket list items" on public.bucket_list_items
  for update using (
    exists (
      select 1 from public.circle_memberships
      where circle_id = bucket_list_items.circle_id
      and user_id = auth.uid()
    )
  );

create policy "Circle members can delete bucket list items" on public.bucket_list_items
  for delete using (
    exists (
      select 1 from public.circle_memberships
      where circle_id = bucket_list_items.circle_id
      and user_id = auth.uid()
    )
  );
