-- Create Contacts Table (Idempotent)
create table if not exists public.contacts (
  id uuid default uuid_generate_v4() primary key,
  circle_id uuid references public.circles(id) on delete cascade not null,
  first_name text not null,
  last_name text,
  email text,
  phone text,
  relationship text,
  notes text,
  access_tags text[],
  avatar_url text,
  is_user boolean default false,
  user_id uuid references public.profiles(id),
  created_at timestamptz default now()
);

-- Ensure columns exist (in case table existed but not these cols)
do $$ 
begin
    if not exists (select 1 from information_schema.columns where table_name='contacts' and column_name='notes') then
        alter table public.contacts add column notes text;
    end if;
    if not exists (select 1 from information_schema.columns where table_name='contacts' and column_name='access_tags') then
        alter table public.contacts add column access_tags text[];
    end if;
    if not exists (select 1 from information_schema.columns where table_name='contacts' and column_name='phone') then
        alter table public.contacts add column phone text;
    end if;
end $$;

-- RLS
alter table public.contacts enable row level security;

-- Policies (Drop first to avoid confusion)
drop policy if exists "Circle members can view contacts" on public.contacts;
create policy "Circle members can view contacts" on public.contacts
  for select using (
    exists (
      select 1 from public.circle_memberships where circle_id = contacts.circle_id and user_id = auth.uid()
    )
  );

drop policy if exists "Circle members can create contacts" on public.contacts;
create policy "Circle members can create contacts" on public.contacts
  for insert with check (
    exists (
      select 1 from public.circle_memberships where circle_id = contacts.circle_id and user_id = auth.uid()
    )
  );

drop policy if exists "Circle members can update contacts" on public.contacts;
create policy "Circle members can update contacts" on public.contacts
  for update using (
    exists (
      select 1 from public.circle_memberships where circle_id = contacts.circle_id and user_id = auth.uid()
    )
  );

drop policy if exists "Circle members can delete contacts" on public.contacts;
create policy "Circle members can delete contacts" on public.contacts
  for delete using (
    exists (
      select 1 from public.circle_memberships where circle_id = contacts.circle_id and user_id = auth.uid()
    )
  );
