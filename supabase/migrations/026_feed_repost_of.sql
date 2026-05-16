-- Module H — Republication avec référence au post original (style LinkedIn)

alter table posts
  add column if not exists repost_of_id uuid references posts(id) on delete set null;

create index if not exists idx_posts_repost_of on posts(repost_of_id);
