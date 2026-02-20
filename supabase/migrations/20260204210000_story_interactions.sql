-- Add deleted_at to story_sessions
ALTER TABLE public.story_sessions ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL;

-- Create story_interactions table
CREATE TABLE IF NOT EXISTS public.story_interactions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    story_id uuid REFERENCES public.story_sessions(id) ON DELETE CASCADE,
    notes text,
    rating integer,
    audio_path text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(user_id, story_id)
);

ALTER TABLE public.story_interactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own story interactions" ON public.story_interactions;

CREATE POLICY "Users can manage their own story interactions" ON public.story_interactions
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
