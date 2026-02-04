-- Create relationships table
CREATE TABLE IF NOT EXISTS public.relationships (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    label text NOT NULL UNIQUE,
    category text NOT NULL CHECK (category IN ('Family', 'Friend', 'Peer', 'Other')),
    created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.relationships ENABLE ROW LEVEL SECURITY;

-- Allow read access to everyone (public data)
CREATE POLICY "Allow public read access" ON public.relationships
    FOR SELECT USING (true);

-- Seed Data
INSERT INTO public.relationships (label, category) VALUES
    ('Mother', 'Family'),
    ('Father', 'Family'),
    ('Sister', 'Family'),
    ('Brother', 'Family'),
    ('Grandmother', 'Family'),
    ('Grandfather', 'Family'),
    ('Aunt', 'Family'),
    ('Uncle', 'Family'),
    ('Cousin', 'Family'),
    ('Child', 'Family'),
    ('Partner/Spouse', 'Family'),
    ('Best Friend', 'Friend'),
    ('Childhood Friend', 'Friend'),
    ('School Friend', 'Friend'),
    ('Neighbor', 'Friend'),
    ('Colleague', 'Peer'),
    ('Mentor', 'Peer'),
    ('Mentee', 'Peer'),
    ('Classmate', 'Peer'),
    ('Acquaintance', 'Other')
ON CONFLICT (label) DO NOTHING;
