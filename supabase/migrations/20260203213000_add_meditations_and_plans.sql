-- Drop conflicting tables from previous schema version
DROP TABLE IF EXISTS public.weekly_plans CASCADE;
DROP TABLE IF EXISTS public.weekly_plan_items CASCADE;
DROP TABLE IF EXISTS public.library_meditations CASCADE;

-- Create library_meditations table
CREATE TABLE IF NOT EXISTS public.library_meditations (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    title text NOT NULL,
    description text,
    type text NOT NULL CHECK (type IN ('text', 'video')),
    content text, -- Text body or Video URL/ID
    category text NOT NULL, -- e.g. 'Death & Meaning', 'Joy & Gratitude'
    duration_mins int DEFAULT 5,
    created_at timestamptz DEFAULT now()
);

-- Create weekly_plans table
CREATE TABLE IF NOT EXISTS public.weekly_plans (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    week_start_date date NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now()
);

-- Create weekly_plan_items table
CREATE TABLE IF NOT EXISTS public.weekly_plan_items (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    plan_id uuid REFERENCES public.weekly_plans(id) ON DELETE CASCADE,
    item_type text NOT NULL CHECK (item_type IN ('meditation', 'prompt', 'bucket_list', 'quote')),
    meditation_id uuid REFERENCES public.library_meditations(id),
    prompt_id uuid REFERENCES public.prompt_library_global(id),
    custom_text text, -- For tasks not linked to a library item
    status text DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
    sort_order int DEFAULT 0,
    created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.library_meditations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_plan_items ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Public read access for meditations" ON public.library_meditations
    FOR SELECT USING (true);

CREATE POLICY "Users can manage their own plans" ON public.weekly_plans
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own plan items" ON public.weekly_plan_items
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.weekly_plans wp
            WHERE wp.id = weekly_plan_items.plan_id
            AND wp.user_id = auth.uid()
        )
    );

-- Seed Meditations
INSERT INTO public.library_meditations (title, description, type, category, content, duration_mins) VALUES
    (
        'The Last Day on Earth',
        'A Stoic reflection to bring clarity and urgency to your life.',
        'text',
        'Death & Meaning',
        'Close your eyes. Imagine that tonight, when you go to sleep, you will not wake up. This is your last day. How does the air feel? How does your coffee taste? Look at the people around you—your family, your friends. If this was the last time you saw them, what would you say? Let the petty annoyances fade away. They do not matter on the last day. Only connection matters. Only presence matters. Open your eyes, and live this day as a gift.',
        5
    ),
    (
        'Loving Kindness (Metta)',
        'Generate warmth and connection towards yourself and others.',
        'text',
        'Joy & Connection',
        'Sit comfortably. Take a deep breath. Bring to mind someone easy to love—a pet, a child, a close friend. Feel the warmth you have for them. Silently say: "May you be happy. May you be healthy. May you be safe. May you be at ease." Now, turn that warmth towards yourself. "May I be happy. May I be healthy." Finally, extend it to the whole world. "May all beings be happy."',
        10
    ),
    (
        'Visualize Your Legacy',
        'What ripples will you leave behind?',
        'text',
        'Meaning & Legacy',
        'Imagine a gathering of your loved ones ten years after you are gone. They are sharing stories about you. What are they smiling about? What lessons did you teach them, not by words, but by example? You are writing that story right now. Every action you take today adds a sentence to that legacy. What do you want to write today?',
        7
    ),
    (
        'The View from Above',
        'Zoom out to find peace in perspective.',
        'video',
        'Perspective',
        'https://www.youtube.com/embed/Hu4Yvq-g7_Y', -- Example generic placeholder or real relevant video
        15
    ),
    (
        'Acceptance of Mortality',
        'Exploring the beauty of a finite existence.',
        'video',
        'Death & Meaning',
        'https://www.youtube.com/embed/ExampleVideoID', 
        10
    );
