-- Module H — Fonctionnalités sociales du fil d'actualités
-- Follows, saves, réactions enrichies

-- 1. Abonnements (Follow)
create table if not exists user_follows (
  id uuid primary key default gen_random_uuid(),
  follower_id uuid not null references profiles(id) on delete cascade,
  following_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz default now(),
  unique(follower_id, following_id)
);

alter table user_follows enable row level security;

create policy "Follows are viewable by authenticated users"
  on user_follows for select
  using (auth.role() = 'authenticated');

create policy "Users can follow"
  on user_follows for insert
  with check (auth.uid() = follower_id);

create policy "Users can unfollow"
  on user_follows for delete
  using (auth.uid() = follower_id);

create index idx_user_follows_follower on user_follows(follower_id);
create index idx_user_follows_following on user_follows(following_id);

-- 2. Sauvegarde de posts (Bookmark)
create table if not exists post_saves (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references posts(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz default now(),
  unique(post_id, user_id)
);

alter table post_saves enable row level security;

create policy "Saves are viewable by owner"
  on post_saves for select
  using (auth.uid() = user_id);

create policy "Users can save posts"
  on post_saves for insert
  with check (auth.uid() = user_id);

create policy "Users can unsave posts"
  on post_saves for delete
  using (auth.uid() = user_id);

create index idx_post_saves_user on post_saves(user_id);
create index idx_post_saves_post on post_saves(post_id);

-- 3. Réactions enrichies (remplace post_likes à terme)
create table if not exists post_reactions (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references posts(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  type text not null default 'like', -- 'like' | 'love' | 'celebrate' | 'support' | 'insightful'
  created_at timestamptz default now(),
  unique(post_id, user_id)
);

alter table post_reactions enable row level security;

create policy "Reactions are viewable by authenticated users"
  on post_reactions for select
  using (auth.role() = 'authenticated');

create policy "Users can react"
  on post_reactions for insert
  with check (auth.uid() = user_id);

create policy "Users can remove reactions"
  on post_reactions for delete
  using (auth.uid() = user_id);

create index idx_post_reactions_post on post_reactions(post_id);
create index idx_post_reactions_user on post_reactions(user_id);

-- 4. Colonne is_pinned pour les posts épinglés
alter table posts add column if not exists is_pinned boolean default false;

-- 5. Realtime
alter publication supabase_realtime add table user_follows;
alter publication supabase_realtime add table post_saves;
alter publication supabase_realtime add table post_reactions;
