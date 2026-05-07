-- Module H — Fil d'actualites (Reseau professionnel)

create table posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references profiles(id) on delete cascade,
  content text not null,
  type text not null default 'general',
  category text,
  image_url text,
  attachment_url text,
  likes_count integer default 0,
  comments_count integer default 0,
  created_at timestamptz default now()
);

create table post_likes (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references posts(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz default now(),
  unique(post_id, user_id)
);

create table post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references posts(id) on delete cascade,
  author_id uuid not null references profiles(id) on delete cascade,
  content text not null,
  created_at timestamptz default now()
);

-- RLS
alter table posts enable row level security;
alter table post_likes enable row level security;
alter table post_comments enable row level security;

-- Posts policies
create policy "Posts are viewable by authenticated users"
  on posts for select
  using (auth.role() = 'authenticated');

create policy "Users can create posts"
  on posts for insert
  with check (auth.uid() = author_id);

create policy "Users can update own posts"
  on posts for update
  using (auth.uid() = author_id)
  with check (auth.uid() = author_id);

create policy "Users can delete own posts"
  on posts for delete
  using (auth.uid() = author_id);

-- Post likes policies
create policy "Post likes are viewable by authenticated users"
  on post_likes for select
  using (auth.role() = 'authenticated');

create policy "Users can like posts"
  on post_likes for insert
  with check (auth.uid() = user_id);

create policy "Users can unlike posts"
  on post_likes for delete
  using (auth.uid() = user_id);

-- Post comments policies
create policy "Post comments are viewable by authenticated users"
  on post_comments for select
  using (auth.role() = 'authenticated');

create policy "Users can comment posts"
  on post_comments for insert
  with check (auth.uid() = author_id);

create policy "Users can update own comments"
  on post_comments for update
  using (auth.uid() = author_id)
  with check (auth.uid() = author_id);

create policy "Users can delete own comments"
  on post_comments for delete
  using (auth.uid() = author_id);

-- Indexes
create index idx_posts_author on posts(author_id);
create index idx_posts_created on posts(created_at desc);
create index idx_posts_type on posts(type);
create index idx_post_likes_post on post_likes(post_id);
create index idx_post_comments_post on post_comments(post_id);

-- Realtime
alter publication supabase_realtime add table posts;
alter publication supabase_realtime add table post_likes;
alter publication supabase_realtime add table post_comments;
