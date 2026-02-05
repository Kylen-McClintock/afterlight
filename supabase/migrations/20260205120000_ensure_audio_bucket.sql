-- Create storage bucket for interactions audio if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('interactions_audio', 'interactions_audio', false)
ON CONFLICT (id) DO NOTHING;

-- Policy: Give users access to their own folder (authenticated uploads)
CREATE POLICY "Give users access to own folder 1oj01a_0" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'interactions_audio' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Give users access to own folder 1oj01a_1" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'interactions_audio' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Give users access to own folder 1oj01a_2" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'interactions_audio' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Give users access to own folder 1oj01a_3" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'interactions_audio' AND auth.uid()::text = (storage.foldername(name))[1]);
