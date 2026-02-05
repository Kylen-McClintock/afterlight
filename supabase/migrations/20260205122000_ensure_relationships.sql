-- Create relationships table if not exists (referenced in UI but missing)
CREATE TABLE IF NOT EXISTS public.relationships (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL, -- e.g. "Family", "Friend", "Peer"
    category text, -- e.g. "Personal", "Professional"
    created_at timestamptz DEFAULT now()
);

ALTER TABLE public.relationships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to relationships" ON public.relationships FOR SELECT USING (true);

-- Seed basic data
INSERT INTO public.relationships (name, category) VALUES
('Parent', 'Family'),
('Sibling', 'Family'),
('Child', 'Family'),
('Partner', 'Family'),
('Friend', 'Personal'),
('Colleague', 'Professional'),
('Mentor', 'Abilities')
ON CONFLICT DO NOTHING;
