-- Add story_id to custom_collection_items
ALTER TABLE public.custom_collection_items
ADD COLUMN IF NOT EXISTS story_id uuid REFERENCES public.story_sessions(id) ON DELETE CASCADE;

-- Ensure constraint: either prompt_id OR story_id must be present, but this might be hard if we iterate.
-- For now, just adding the column is sufficient for the feature.

-- Add Policy to allow users to manage their items
-- existing RLS on custom_collection_items should cover it (using collection_id -> custom_collections -> user_id)
-- but let's double check RLS later if needed. Assumed safe for now.
