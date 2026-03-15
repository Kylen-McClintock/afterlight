-- Add user requested prompts safely
INSERT INTO public.prompt_library_global (title, prompt_text, tags)
SELECT 'Happiest Day', 'What was the happiest day of your life?', ARRAY['Wisdom']
WHERE NOT EXISTS (
    SELECT 1 FROM public.prompt_library_global WHERE prompt_text = 'What was the happiest day of your life?'
);

INSERT INTO public.prompt_library_global (title, prompt_text, tags)
SELECT 'Childhood Dreams', 'What did you dream of becoming before life happened?', ARRAY['Childhood', 'Career']
WHERE NOT EXISTS (
    SELECT 1 FROM public.prompt_library_global WHERE prompt_text = 'What did you dream of becoming before life happened?'
);

INSERT INTO public.prompt_library_global (title, prompt_text, tags)
SELECT 'Falling in Love', 'How did you and mom/dad fall in love?', ARRAY['Family', 'Relationships']
WHERE NOT EXISTS (
    SELECT 1 FROM public.prompt_library_global WHERE prompt_text = 'How did you and mom/dad fall in love?'
);

INSERT INTO public.prompt_library_global (title, prompt_text, tags)
SELECT 'Things Done Differently', 'What do you wish you''d done differently?', ARRAY['Wisdom']
WHERE NOT EXISTS (
    SELECT 1 FROM public.prompt_library_global WHERE prompt_text = 'What do you wish you''d done differently?'
);
