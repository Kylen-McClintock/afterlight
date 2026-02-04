-- 1. Update library_meditations for Custom Items
ALTER TABLE public.library_meditations 
ADD COLUMN IF NOT EXISTS circle_id uuid REFERENCES public.circles(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES public.profiles(id),
ADD COLUMN IF NOT EXISTS media_url text, -- For YouTube links
ADD COLUMN IF NOT EXISTS is_custom boolean DEFAULT false;

-- RLS Updates for Custom Meditations
DROP POLICY IF EXISTS "Circle members can view custom meditations" ON public.library_meditations;
CREATE POLICY "Circle members can view custom meditations" ON public.library_meditations
    FOR SELECT USING (
        circle_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM public.circle_memberships 
            WHERE circle_id = library_meditations.circle_id AND user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Circle members can create custom meditations" ON public.library_meditations;
CREATE POLICY "Circle members can create custom meditations" ON public.library_meditations
    FOR INSERT WITH CHECK (
        circle_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM public.circle_memberships 
            WHERE circle_id = library_meditations.circle_id AND user_id = auth.uid()
        )
    );

-- 2. Create Meditation Interactions (Notes & Ratings)
CREATE TABLE IF NOT EXISTS public.meditation_interactions (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    meditation_id uuid REFERENCES public.library_meditations(id) ON DELETE CASCADE NOT NULL,
    rating int CHECK (rating >= 1 AND rating <= 5),
    notes text,
    is_favorite boolean DEFAULT false,
    updated_at timestamptz DEFAULT now(),
    UNIQUE(user_id, meditation_id)
);

ALTER TABLE public.meditation_interactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own interactions" ON public.meditation_interactions
    FOR ALL USING (auth.uid() = user_id);

-- 3. Update Weekly Plan Items for Connections & Relax Constraint
ALTER TABLE public.weekly_plan_items
ADD COLUMN IF NOT EXISTS connection_id uuid REFERENCES public.contacts(id);

-- Drop the check constraint safely (Supabase/Postgres specific syntax might vary, usually just drop constraint)
DO $$ 
BEGIN 
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'weekly_plan_items_item_type_check') THEN
        ALTER TABLE public.weekly_plan_items DROP CONSTRAINT weekly_plan_items_item_type_check;
    END IF;
END $$;

-- Add new constraint
ALTER TABLE public.weekly_plan_items
ADD CONSTRAINT weekly_plan_items_item_type_check 
CHECK (item_type IN ('meditation', 'prompt', 'bucket_list', 'quote', 'connection', 'custom'));
