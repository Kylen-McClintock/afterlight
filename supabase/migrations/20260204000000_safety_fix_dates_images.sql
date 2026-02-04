-- Ensure Date Columns Exist
ALTER TABLE public.story_sessions 
ADD COLUMN IF NOT EXISTS story_date DATE,
ADD COLUMN IF NOT EXISTS date_granularity TEXT DEFAULT 'exact';

-- Ensure Storage Policies are Permissive for Circles (Fixing "Broken Images")
-- Allow any authenticated user to view files in 'stories' bucket
-- (This helps if the signed URL logic is hitting edge cases with strict RLS)
DROP POLICY IF EXISTS "Authenticated users can read stories" ON storage.objects;
CREATE POLICY "Authenticated users can read stories" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'stories' AND 
    auth.role() = 'authenticated'
  );

-- Ensure Insert Policy
DROP POLICY IF EXISTS "Authenticated users can upload stories" ON storage.objects;
CREATE POLICY "Authenticated users can upload stories" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'stories' AND 
    auth.role() = 'authenticated'
  );
