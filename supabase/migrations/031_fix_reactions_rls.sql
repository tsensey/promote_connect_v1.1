-- Fix RLS policies for reactions and post counters
-- 
-- Problem: Reactions (likes/reactions) work optimistically in UI but don't persist on reload
-- because:
-- 1. post_reactions has no UPDATE policy (upsert fails when changing reaction type)
-- 2. post_likes has no UPDATE policy (upsert fails when toggling like)
-- 3. posts counter columns (likes_count, comments_count, etc.) can only be updated by the
--    post author, but any authenticated user needs to increment/decrement them

-- 1. Add UPDATE policy for post_reactions
-- Required for upsert operations when changing reaction type
create policy "Users can update their reactions"
  on post_reactions for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 2. Add UPDATE policy for post_likes
-- Required for upsert operations when toggling likes
create policy "Users can update their likes"
  on post_likes for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 3. Allow any authenticated user to update counter columns on posts
-- Without this, likes_count, comments_count, shares_count, reposts_count
-- only the post author can update them, but any user interacting with a post
-- (liking, commenting, sharing) needs to increment these counters
create policy "Anyone can update post counters"
  on posts for update
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');
