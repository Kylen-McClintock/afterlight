-- Create Contacts Table for Friends & Family
create table public.contacts (
  id uuid default uuid_generate_v4() primary key,
  circle_id uuid references public.circles(id) on delete cascade not null,
  first_name text not null,
  last_name text,
  email text,
  phone text,
  relationship text,
  notes text,
  access_tags text[], -- e.g. "executor", "medical", "close_family"
  avatar_url text,
  is_user boolean default false, -- If they are also a registered user
  user_id uuid references public.profiles(id), -- Link to profile if they are a user
  created_at timestamptz default now()
);

-- RLS
alter table public.contacts enable row level security;

create policy "Circle members can view contacts" on public.contacts
  for select using (
    exists (
      select 1 from public.circle_memberships
      where circle_id = contacts.circle_id and user_id = auth.uid()
    )
  );

create policy "Circle members can create contacts" on public.contacts
  for insert with check (
    exists (
      select 1 from public.circle_memberships
      where circle_id = contacts.circle_id and user_id = auth.uid()
    )
  );

create policy "Circle members can update contacts" on public.contacts
  for update using (
    exists (
      select 1 from public.circle_memberships
      where circle_id = contacts.circle_id and user_id = auth.uid()
    )
  );

create policy "Circle members can delete contacts" on public.contacts
  for delete using (
    exists (
      select 1 from public.circle_memberships
      where circle_id = contacts.circle_id and user_id = auth.uid()
    )
  );
