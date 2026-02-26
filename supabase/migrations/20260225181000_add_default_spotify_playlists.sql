-- Update RLS to allow all authenticated users to see global library_meditations (circle_id IS NULL)
DROP POLICY IF EXISTS "Circle members can view custom meditations" ON public.library_meditations;

CREATE POLICY "Users can view global and circle meditations" ON public.library_meditations
    FOR SELECT USING (
        circle_id IS NULL OR EXISTS (
            SELECT 1 FROM public.circle_memberships 
            WHERE circle_id = library_meditations.circle_id AND user_id = auth.uid()
        )
    );

-- Insert default Spotify Playlists
INSERT INTO public.library_meditations (id, title, category, type, content, is_custom, description, duration_mins)
VALUES 
    (uuid_generate_v4(), 'Peaceful Piano', 'Music', 'song', 'https://open.spotify.com/playlist/37i9dQZF1DX4sWSpwq3LiO', false, 'Relaxing piano music for focus or unwinding.', 60),
    (uuid_generate_v4(), 'Nature Sounds', 'Nature', 'song', 'https://open.spotify.com/playlist/37i9dQZF1DZ06evO07zaak', false, 'Immersive sounds from nature for grounding and peace.', 60),
    (uuid_generate_v4(), 'Ambient Relaxation', 'Ambient', 'song', 'https://open.spotify.com/playlist/37i9dQZF1DX3Ogo9pFvBkY', false, 'Soft ambient drones to clear the mind.', 60),
    (uuid_generate_v4(), 'Deep Focus', 'Focus', 'song', 'https://open.spotify.com/playlist/37i9dQZF1DWZeKCadgRdKQ', false, 'Keep calm and focus with ambient and post-rock music.', 60)
ON CONFLICT DO NOTHING;
