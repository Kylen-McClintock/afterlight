-- Extend Collection Type Enum
ALTER TYPE collection_type_enum ADD VALUE IF NOT EXISTS 'prompt_playlist';

-- Add prompt_id to collection items to link them
ALTER TABLE public.custom_collection_items
ADD COLUMN IF NOT EXISTS prompt_id uuid REFERENCES public.prompt_library_global(id);

-- Also allow linking to circle prompts (optional, but good for completeness)
-- But foreign key to two tables is hard. Let's just store prompt_id and maybe a 'prompt_source' or check both?
-- For MVP, let's just use prompt_id references global. 
-- If we need custom circle prompts in playlists, we might need a polymorphic relationship or just loose coupling.
-- For now, let's assume Global Prompts are the main thing to group.

-- Add validation or just leave it nullable.
