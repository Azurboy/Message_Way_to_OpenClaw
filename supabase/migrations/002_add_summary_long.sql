-- Add summary_long column for pro users' deep summaries
alter table public.user_articles add column if not exists summary_long text;
