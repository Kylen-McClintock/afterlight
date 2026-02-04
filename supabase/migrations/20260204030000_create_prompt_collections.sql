-- Create prompt_collections table (Personal Library)
CREATE TABLE IF NOT EXISTS public.prompt_collections (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
    name text NOT NULL,
    description text,
    type text DEFAULT 'user_defined', -- 'user_defined', 'system', 'favorite'
    is_public boolean DEFAULT false,
    created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.prompt_collections ENABLE ROW LEVEL SECURITY;

-- Policies for prompt_collections
CREATE POLICY "Users can view their own collections" ON public.prompt_collections
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own collections" ON public.prompt_collections
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own collections" ON public.prompt_collections
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own collections" ON public.prompt_collections
    FOR DELETE USING (auth.uid() = user_id);


-- Create prompt_collection_items table (Items within a collection)
CREATE TABLE IF NOT EXISTS public.prompt_collection_items (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    collection_id uuid REFERENCES public.prompt_collections(id) ON DELETE CASCADE,
    prompt_id uuid REFERENCES public.prompt_library_global(id) ON DELETE SET NULL,
    story_id uuid REFERENCES public.story_sessions(id) ON DELETE SET NULL,
    note text,
    sort_order int DEFAULT 0,
    created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.prompt_collection_items ENABLE ROW LEVEL SECURITY;

-- Policies for items (inherit from collection ownership)
CREATE POLICY "Users can view items in their collections" ON public.prompt_collection_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.prompt_collections pc
            WHERE pc.id = prompt_collection_items.collection_id
            AND pc.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can add items to their collections" ON public.prompt_collection_items
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.prompt_collections pc
            WHERE pc.id = collection_id
            AND pc.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage items in their collections" ON public.prompt_collection_items
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.prompt_collections pc
            WHERE pc.id = prompt_collection_items.collection_id
            AND pc.user_id = auth.uid()
        )
    );
