-- Module H — Partages & republications

alter table posts add column shares_count integer default 0;
alter table posts add column reposts_count integer default 0;

create table post_shares (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references posts(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  type text not null default 'share',
  created_at timestamptz default now(),
  unique(post_id, user_id, type)
);

-- RLS
alter table post_shares enable row level security;

create policy "Post shares are viewable by authenticated users"
  on post_shares for select
  using (auth.role() = 'authenticated');

create policy "Users can share posts"
  on post_shares for insert
  with check (auth.uid() = user_id);

create policy "Users can remove own shares"
  on post_shares for delete
  using (auth.uid() = user_id);

-- Indexes
create index idx_post_shares_post on post_shares(post_id);
create index idx_post_shares_user on post_shares(user_id);

-- Realtime
alter publication supabase_realtime add table post_shares;

-- Storage bucket for feed images
insert into storage.buckets (id, name, public) values ('feed-images', 'feed-images', true);
