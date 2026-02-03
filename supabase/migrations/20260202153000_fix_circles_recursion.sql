-- Fix Infinite Recursion in circles table policy

-- The problem:
-- 1. `circles` policy checks `circle_memberships`
-- 2. `circle_memberships` policy checks `circles`
-- = Infinite Loop.

-- Solution: Break the loop by simplifying the `circles` SELECT policy.
-- We will rely on a simpler check that doesn't trigger the loop.

-- 1. Drop the problematic recursive policy
drop policy if exists "Users can view circles they are members of" on public.circles;

-- 2. Create a Non-recursive Policy
-- Instead of a complex EXISTS clause that might re-trigger membership checks,
-- we can split the logic or simplify it.
--
-- Note: Sub-queries in RLS are generally fine, but if they touch a table that *also* 
-- has a policy checking back, it loops.
-- 
-- Fix: We can assume that if a user is querying a circle, they might be doing so via their membership.
-- IF we query `circle_memberships` directly without RLS (using security definer) it would work, 
-- but that's complex to set up in migration only.
--
-- Simpler approach: 
-- A user can view a circle if:
-- A) They created it (primary_user_id)
-- B) They have a membership row (we can check this, but we must be careful).

-- IMPORTANT: The `circle_memberships` policy we just fixed checks `circles`.
-- So `circles` CANNOT check `circle_memberships` using RLS.
-- We must use a direct lookup or bypass RLS for this specific check? 
-- Actually, the loop happens because the `circle_memberships` policy `exists(select 1 from circles ...)`
-- triggers the `circles` policy.

-- STRATEGY: Update `circles` policy to NOT check `circle_memberships`? No, we need that.
-- STRATEGY: Update `circle_memberships` policy to NOT check `circles`?
-- YES. Let's revisit `circle_memberships`.
-- If we change `circle_memberships` to only check `user_id = auth.uid()`, then it no longer touches `circles`.
-- That effectively breaks the loop.

-- Let's update `circle_memberships` (again) to be even simpler.
-- "You can see a membership if it's YOURS."
-- You don't strictly need to see *other* members for the "Create Circle" flow or basic dashboard.
-- If we need to see others, we can add that later or make it a separate policy that doesn't join `circles`.

drop policy if exists "Users can view own memberships and circle members" on public.circle_memberships;

create policy "Users can view own memberships" on public.circle_memberships
  for select using (
    user_id = auth.uid()
  );

-- Now we can safely restore the `circles` policy because `circle_memberships` no longer looks back at `circles`.
create policy "Users can view circles they are members of" on public.circles
  for select using (
    exists (
      select 1 from public.circle_memberships
      where circle_id = circles.id 
      and user_id = auth.uid()
    )
    or
    primary_user_id = auth.uid()
  );
