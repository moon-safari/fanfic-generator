-- Users profile table (extends Supabase auth.users)
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  display_name text,
  avatar_url text,
  tier text not null default 'free' check (tier in ('free', 'pro')),
  chapters_used_this_month int not null default 0,
  billing_cycle_start timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Stories table
create table public.stories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  fandom text not null default '',
  custom_fandom text,
  characters text[] not null default '{}',
  relationship_type text not null default 'gen',
  rating text not null default 'mature',
  setting text,
  tone text[] not null default '{}',
  tropes text[] not null default '{}',
  word_count int not null default 0,
  is_public boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Chapters table (separate from stories for better querying)
create table public.chapters (
  id uuid primary key default gen_random_uuid(),
  story_id uuid references public.stories(id) on delete cascade not null,
  chapter_number int not null,
  content text not null,
  word_count int not null default 0,
  created_at timestamptz not null default now(),
  unique(story_id, chapter_number)
);

-- Indexes
create index idx_stories_user_id on public.stories(user_id);
create index idx_stories_created_at on public.stories(created_at desc);
create index idx_chapters_story_id on public.chapters(story_id);

-- RLS policies
alter table public.profiles enable row level security;
alter table public.stories enable row level security;
alter table public.chapters enable row level security;

-- Profiles: users can read/update their own profile
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Stories: users can CRUD their own stories, anyone can read public stories
create policy "Users can view own stories"
  on public.stories for select
  using (auth.uid() = user_id);

create policy "Anyone can view public stories"
  on public.stories for select
  using (is_public = true);

create policy "Users can create own stories"
  on public.stories for insert
  with check (auth.uid() = user_id);

create policy "Users can update own stories"
  on public.stories for update
  using (auth.uid() = user_id);

create policy "Users can delete own stories"
  on public.stories for delete
  using (auth.uid() = user_id);

-- Chapters: access follows story access
create policy "Users can view own chapters"
  on public.chapters for select
  using (
    exists (
      select 1 from public.stories
      where stories.id = chapters.story_id
      and stories.user_id = auth.uid()
    )
  );

create policy "Anyone can view public story chapters"
  on public.chapters for select
  using (
    exists (
      select 1 from public.stories
      where stories.id = chapters.story_id
      and stories.is_public = true
    )
  );

create policy "Users can create chapters for own stories"
  on public.chapters for insert
  with check (
    exists (
      select 1 from public.stories
      where stories.id = chapters.story_id
      and stories.user_id = auth.uid()
    )
  );

create policy "Users can update own chapters"
  on public.chapters for update
  using (
    exists (
      select 1 from public.stories
      where stories.id = chapters.story_id
      and stories.user_id = auth.uid()
    )
  );

create policy "Users can delete own chapters"
  on public.chapters for delete
  using (
    exists (
      select 1 from public.stories
      where stories.id = chapters.story_id
      and stories.user_id = auth.uid()
    )
  );

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', 'Anonymous'),
    coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
