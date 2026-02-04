-- Fix Key Constraint Error: Allow stories to be linked to Global Prompts
-- Currently, stories can only be linked to `prompt_requests` (custom circle prompts).
-- But the "Inspiration" / "Prompts" page sends IDs from `prompt_library_global`.

-- 1. Add new column to `story_sessions`
alter table public.story_sessions
add column global_prompt_id uuid references public.prompt_library_global(id);

-- 2. Update RLS (if needed)
-- The existing `story_sessions` policies cover insert/select generally, 
-- so adding a column doesn't break them unless we have specific column-level security (which we don't).
