-- 1. Create Prompt Interactions Table (for Ratings & Notes on Prompts)
CREATE TABLE IF NOT EXISTS public.prompt_interactions (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    prompt_id uuid REFERENCES public.prompt_library_global(id) ON DELETE CASCADE NOT NULL,
    rating int CHECK (rating >= 1 AND rating <= 5),
    notes text,
    is_favorite boolean DEFAULT false,
    audio_path text, -- For voice notes
    updated_at timestamptz DEFAULT now(),
    UNIQUE(user_id, prompt_id)
);

ALTER TABLE public.prompt_interactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own prompt interactions" ON public.prompt_interactions
    FOR ALL USING (auth.uid() = user_id);


-- 2. Add Audio Path to Meditation Interactions
ALTER TABLE public.meditation_interactions 
ADD COLUMN IF NOT EXISTS audio_path text;


-- 3. Create 'interactions_audio' Storage Bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('interactions_audio', 'interactions_audio', false)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies for 'interactions_audio'
-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload interaction audio" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'interactions_audio' AND
        auth.role() = 'authenticated'
    );

-- Allow users to read their own audio (or all authenticated for simplicity in MVP, strict RLS is better)
-- Stricter: Users can read files in their own folder (e.g., user_id/file.webm)
CREATE POLICY "Users can view their own interaction audio" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'interactions_audio' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

-- Allow users to update/delete their own
CREATE POLICY "Users can update their own interaction audio" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'interactions_audio' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "Users can delete their own interaction audio" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'interactions_audio' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );
