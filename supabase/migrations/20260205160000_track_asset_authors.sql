-- Add created_by_user_id to track who added specific assets to a story
ALTER TABLE public.story_assets 
ADD COLUMN created_by_user_id uuid REFERENCES public.profiles(id);

-- Optional: Set a default for existing rows if we want to assume the story owner added them
UPDATE public.story_assets sa
SET created_by_user_id = ss.storyteller_user_id
FROM public.story_sessions ss
WHERE sa.story_session_id = ss.id
  AND sa.created_by_user_id IS NULL;

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
