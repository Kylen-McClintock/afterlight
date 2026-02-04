-- Add location column to story_sessions
ALTER TABLE public.story_sessions
ADD COLUMN IF NOT EXISTS location text;
