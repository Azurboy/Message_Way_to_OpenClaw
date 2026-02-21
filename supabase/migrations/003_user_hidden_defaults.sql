-- Track which default/preset feeds a user has chosen to hide
create table if not exists public.user_hidden_defaults (
  user_id uuid not null references public.profiles(id) on delete cascade,
  feed_xml_url text not null,
  hidden_at timestamptz default now(),
  primary key (user_id, feed_xml_url)
);

alter table public.user_hidden_defaults enable row level security;

create policy "Users can view own hidden defaults"
  on public.user_hidden_defaults for select
  using (auth.uid() = user_id);

create policy "Users can hide defaults"
  on public.user_hidden_defaults for insert
  with check (auth.uid() = user_id);

create policy "Users can unhide defaults"
  on public.user_hidden_defaults for delete
  using (auth.uid() = user_id);
