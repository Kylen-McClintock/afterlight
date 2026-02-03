-- Fix Infinite Recursion in circle_memberships

-- 1. Drop the problematic recursive `SELECT` policy
-- The old policy tried to query `circle_memberships` to check permissions on `circle_memberships`, causing a loop.
drop policy if exists "Members can view other members in the circle" on public.circle_memberships;

-- 2. Create a cleaner `SELECT` policy (Non-recursive)
-- Users can view a membership row if:
-- a) It is their own membership.
-- b) It belongs to a circle where they are the 'primary' (owner).
-- c) (Optional optimization) We avoid querying circle_memberships about circle_memberships.
create policy "Users can view own memberships and circle members" on public.circle_memberships
  for select using (
    user_id = auth.uid() 
    or 
    exists (
      -- Check if user is the PRIMARY owner of the circle (avoids querying circle_memberships)
      select 1 from public.circles 
      where circles.id = circle_memberships.circle_id 
      and circles.primary_user_id = auth.uid()
    )
  );

-- 3. Add explicit `INSERT` policy (Critical for 'Create Circle' flow)
-- Users can insert a membership for THEMSELVES (joining a circle or creating one).
create policy "Users can insert own membership" on public.circle_memberships
  for insert with check (
    auth.uid() = user_id
  );

-- 4. Add `DELETE` policy
create policy "Users can leave circles" on public.circle_memberships
  for delete using (
    auth.uid() = user_id
  );
