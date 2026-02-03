-- Create storage bucket for stories
insert into storage.buckets (id, name, public) values ('stories', 'stories', false);

-- Set up RLS for storage.objects
create policy "Authenticated users can upload stories" on storage.objects
  for insert with check (
    bucket_id = 'stories' and 
    auth.role() = 'authenticated'
  );

create policy "Authenticated users can update their own stories" on storage.objects
  for update using (
    bucket_id = 'stories' and 
    owner = auth.uid()
  );

create policy "Authenticated users can read stories" on storage.objects
  for select using (
    bucket_id = 'stories' and 
    auth.role() = 'authenticated'
  );

-- RELOAD SCHEMA CACHE to ensure policies pick up
notify pgrst, 'reload schema';

-- RLS Policies for Story Sessions
-- (Allow reading if you are a member of the circle)
create policy "Circle members can view story sessions" on public.story_sessions
  for select using (
    exists (
      select 1 from public.circle_memberships
      where circle_id = story_sessions.circle_id and user_id = auth.uid()
    )
  );

create policy "Users can create story sessions" on public.story_sessions
  for insert with check (auth.uid() = storyteller_user_id);

-- RLS Policies for Story Assets
create policy "Circle members can view story assets" on public.story_assets
  for select using (
    exists (
      select 1 from public.story_sessions
      join public.circle_memberships on story_sessions.circle_id = circle_memberships.circle_id
      where story_sessions.id = story_assets.story_session_id
      and circle_memberships.user_id = auth.uid()
    )
  );

create policy "Users can create story assets" on public.story_assets
  for insert with check (
    exists (
       select 1 from public.story_sessions
       where id = story_assets.story_session_id
       and storyteller_user_id = auth.uid()
    )
  );

-- RLS Policies for Story Recipients
create policy "Circle members can view story recipients" on public.story_recipients
  for select using (
     exists (
      select 1 from public.story_sessions
      join public.circle_memberships on story_sessions.circle_id = circle_memberships.circle_id
      where story_sessions.id = story_recipients.story_session_id
      and circle_memberships.user_id = auth.uid()
    )
  );
  
create policy "Users can create story recipients" on public.story_recipients
  for insert with check (
    exists (
       select 1 from public.story_sessions
       where id = story_recipients.story_session_id
       and storyteller_user_id = auth.uid()
    )
  );

-- Other Missing Policies (Simplified to "Circle Member Access")

-- Values Map
create policy "Circle members can view values map" on public.values_map
  for select using (
    exists (
      select 1 from public.circle_memberships
      where circle_id = values_map.circle_id and user_id = auth.uid()
    )
  );
  
create policy "Circle members can update values map" on public.values_map
  for update using (
    exists (
      select 1 from public.circle_memberships
      where circle_id = values_map.circle_id and user_id = auth.uid()
    )
  );
  
create policy "Circle members can insert values map" on public.values_map
  for insert with check (
    exists (
      select 1 from public.circle_memberships
      where circle_id = values_map.circle_id and user_id = auth.uid()
    )
  );

-- Bucket List Items
create policy "Circle members can view bucket list" on public.bucket_list_items
  for select using (
    exists (
      select 1 from public.circle_memberships
      where circle_id = bucket_list_items.circle_id and user_id = auth.uid()
    )
  );

create policy "Circle members can manage bucket list" on public.bucket_list_items
  for all using (
    exists (
      select 1 from public.circle_memberships
      where circle_id = bucket_list_items.circle_id and user_id = auth.uid()
    )
  );

-- Weekly Plans
create policy "Circle members can view weekly plans" on public.weekly_plans
  for select using (
    exists (
      select 1 from public.circle_memberships
      where circle_id = weekly_plans.circle_id and user_id = auth.uid()
    )
  );

create policy "Circle members can manage weekly plans" on public.weekly_plans
  for all using (
    exists (
      select 1 from public.circle_memberships
      where circle_id = weekly_plans.circle_id and user_id = auth.uid()
    )
  );

-- Quotes Circle
create policy "Circle members can view circle quotes" on public.quotes_circle
  for select using (
    exists (
      select 1 from public.circle_memberships
      where circle_id = quotes_circle.circle_id and user_id = auth.uid()
    )
  );
  
create policy "Circle members can manage circle quotes" on public.quotes_circle
  for all using (
    exists (
      select 1 from public.circle_memberships
      where circle_id = quotes_circle.circle_id and user_id = auth.uid()
    )
  );

-- Meditations Circle
create policy "Circle members can view circle meditations" on public.meditations_circle
  for select using (
    exists (
      select 1 from public.circle_memberships
      where circle_id = meditations_circle.circle_id and user_id = auth.uid()
    )
  );
  
create policy "Circle members can manage circle meditations" on public.meditations_circle
  for all using (
    exists (
      select 1 from public.circle_memberships
      where circle_id = meditations_circle.circle_id and user_id = auth.uid()
    )
  );

-- Custom Collections
create policy "Circle members can view custom collections" on public.custom_collections
  for select using (
    exists (
      select 1 from public.circle_memberships
      where circle_id = custom_collections.circle_id and user_id = auth.uid()
    )
  );

create policy "Circle members can manage custom collections" on public.custom_collections
  for all using (
    exists (
      select 1 from public.circle_memberships
      where circle_id = custom_collections.circle_id and user_id = auth.uid()
    )
  );

-- Custom Collection Items
create policy "Circle members can view collection items" on public.custom_collection_items
  for select using (
    exists (
      select 1 from public.custom_collections
      join public.circle_memberships on custom_collections.circle_id = circle_memberships.circle_id
      where custom_collections.id = custom_collection_items.collection_id
      and circle_memberships.user_id = auth.uid()
    )
  );

create policy "Circle members can manage collection items" on public.custom_collection_items
  for all using (
    exists (
      select 1 from public.custom_collections
      join public.circle_memberships on custom_collections.circle_id = circle_memberships.circle_id
      where custom_collections.id = custom_collection_items.collection_id
      and circle_memberships.user_id = auth.uid()
    )
  );
