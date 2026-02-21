-- DailyBit: Initial schema for user system + cloud favorites
-- Run this in Supabase SQL Editor

-- 1. Profiles (extends auth.users)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  tier text not null default 'free',
  subscription_id text,
  subscription_status text,
  custom_ai_prompt text,
  custom_skill_md text,
  created_at timestamptz default now()
);

-- 2. User custom RSS feeds
create table public.user_feeds (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  feed_url text not null,
  feed_title text,
  created_at timestamptz default now(),
  unique(user_id, feed_url)
);

-- 3. User-specific articles (from custom feeds)
create table public.user_articles (
  id text primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  url text not null,
  feed_title text,
  summary_zh text,
  tags text[],
  content_html text,
  published_at timestamptz,
  created_at timestamptz default now()
);

-- 4. User notes / edited summaries
create table public.user_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  article_id text not null,
  custom_summary text,
  note text,
  updated_at timestamptz default now(),
  unique(user_id, article_id)
);

-- 5. Favorites (cloud sync)
create table public.favorites (
  user_id uuid not null references public.profiles(id) on delete cascade,
  article_id text not null,
  article_title text,
  article_url text,
  feed_title text,
  summary_zh text,
  saved_at timestamptz default now(),
  primary key (user_id, article_id)
);

-- Indexes
create index idx_user_feeds_user on public.user_feeds(user_id);
create index idx_user_articles_user on public.user_articles(user_id);
create index idx_user_notes_user on public.user_notes(user_id);
create index idx_favorites_user on public.favorites(user_id);

-- ============================================================
-- Row Level Security
-- ============================================================

alter table public.profiles enable row level security;
alter table public.user_feeds enable row level security;
alter table public.user_articles enable row level security;
alter table public.user_notes enable row level security;
alter table public.favorites enable row level security;

-- profiles: users can read/update their own row
create policy "Users can view own profile"
  on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);
create policy "Users can insert own profile"
  on public.profiles for insert with check (auth.uid() = id);

-- user_feeds: full CRUD on own rows
create policy "Users manage own feeds"
  on public.user_feeds for all using (auth.uid() = user_id);

-- user_articles: read own rows (pipeline inserts via service key)
create policy "Users read own articles"
  on public.user_articles for select using (auth.uid() = user_id);

-- user_notes: full CRUD on own rows
create policy "Users manage own notes"
  on public.user_notes for all using (auth.uid() = user_id);

-- favorites: full CRUD on own rows
create policy "Users manage own favorites"
  on public.favorites for all using (auth.uid() = user_id);

-- ============================================================
-- Auto-create profile on signup (trigger)
-- ============================================================

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'user_name',
      split_part(new.email, '@', 1)
    )
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
