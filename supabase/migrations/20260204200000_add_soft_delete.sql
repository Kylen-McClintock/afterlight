-- Add soft delete columns to content tables
ALTER TABLE public.library_meditations ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL;
ALTER TABLE public.prompt_library_global ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL;
ALTER TABLE public.prompt_requests ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL;

-- Update RLS or View logic? 
-- It is easier to filter in the application query for now, but RLS is safer.
-- Let's add RLS policies to exclude deleted items by default? 
-- No, existing policies are usually for SELECT ALL. Changing them is risky without dropping.
-- We will handle filtering in the Frontend Query for the "Active" lists.

-- For the "Trash" folder feature (future), we would query where deleted_at IS NOT NULL.
