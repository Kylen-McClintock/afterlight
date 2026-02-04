-- NUCLEAR OPTION: Reset Permissions for Story Sessions and Assets
-- User reports updates are failing silently or blocked.
-- We will DROP ALL Policies and create one simple "ALL" policy for authenticated users.

-- 1. Story Sessions
DROP POLICY IF EXISTS "Authenticated users can create stories" ON public.story_sessions;
DROP POLICY IF EXISTS "Users can update their own stories" ON public.story_sessions;
DROP POLICY IF EXISTS "Circle members can view story sessions" ON public.story_sessions;
DROP POLICY IF EXISTS "Users can create story sessions" ON public.story_sessions;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.story_sessions;
-- Drop any other stragglers
DROP POLICY IF EXISTS "Allow individual update" ON public.story_sessions;
DROP POLICY IF EXISTS "Allow individual delete" ON public.story_sessions;

CREATE POLICY "Nuclear_Allow_All_Auth_Sessions" ON public.story_sessions
    FOR ALL
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

-- 2. Story Assets
DROP POLICY IF EXISTS "Circle members can view story assets" ON public.story_assets;
DROP POLICY IF EXISTS "Users can create story assets" ON public.story_assets;
DROP POLICY IF EXISTS "Owners can view story assets" ON public.story_assets;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.story_assets;

CREATE POLICY "Nuclear_Allow_All_Auth_Assets" ON public.story_assets
    FOR ALL
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');


-- 3. Storage Objects (Stories Bucket)
DROP POLICY IF EXISTS "Authenticated users can upload stories" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update their own stories" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can read stories" ON storage.objects;
DROP POLICY IF EXISTS "Enable all access for details in stories bucket" ON storage.objects;

-- Explicitly re-enable RLS on the bucket table to ensure policies work, then add policy
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Nuclear_Storage_Allow_All_Auth" ON storage.objects
    FOR ALL
    USING (bucket_id = 'stories' AND auth.role() = 'authenticated')
    WITH CHECK (bucket_id = 'stories' AND auth.role() = 'authenticated');

-- 4. Verify Story Date Column Type (Safety)
ALTER TABLE public.story_sessions ALTER COLUMN story_date TYPE DATE USING story_date::DATE;

-- 5. Force Grant (Just in case)
GRANT ALL ON public.story_sessions TO authenticated;
GRANT ALL ON public.story_assets TO authenticated;
