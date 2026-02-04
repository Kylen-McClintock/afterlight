-- CRITICAL FIX: Allow users to UPDATE their own stories
-- Without this, edits (including dates) were silently rejected by RLS.
DROP POLICY IF EXISTS "Users can update their own stories" ON public.story_sessions;
CREATE POLICY "Users can update their own stories" ON public.story_sessions
  FOR UPDATE USING (
    storyteller_user_id = auth.uid()
  );

-- Ensure Story Assets are viewable (Fix for "Fucked up images"?)
-- If images were failing to load, it might be the select policy was too strict or missing for the assets table
DROP POLICY IF EXISTS "Everyone can view story assets" ON public.story_assets;
CREATE POLICY "Circle members can view story assets" ON public.story_assets
  FOR SELECT USING (
    EXISTS (
       SELECT 1 FROM public.story_sessions
       JOIN public.circle_memberships ON story_sessions.circle_id = circle_memberships.circle_id
       WHERE story_sessions.id = story_assets.story_session_id
       AND circle_memberships.user_id = auth.uid()
    )
  );
-- ALSO allow the owner to view them even if circle logic is weird
CREATE POLICY "Owners can view story assets" ON public.story_assets
  FOR SELECT USING (
     exists (
       select 1 from public.story_sessions
       where id = story_assets.story_session_id
       and storyteller_user_id = auth.uid()
    )
  );

-- Fix for "Exact Date" bug
-- Ensure date_granularity defaults to 'exact' if null
UPDATE public.story_sessions SET date_granularity = 'exact' WHERE date_granularity IS NULL;
