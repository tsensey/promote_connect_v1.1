-- Migration 016 : Création de la table post_shares (partages et republications)

CREATE TABLE IF NOT EXISTS post_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'share', -- 'share' | 'repost'
  created_at timestamptz DEFAULT now(),
  UNIQUE(post_id, user_id, type)
);

ALTER TABLE post_shares ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Post shares are viewable by authenticated users" ON post_shares;
CREATE POLICY "Post shares are viewable by authenticated users"
  ON post_shares FOR SELECT
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can share posts" ON post_shares;
CREATE POLICY "Users can share posts"
  ON post_shares FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can unshare posts" ON post_shares;
CREATE POLICY "Users can unshare posts"
  ON post_shares FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_post_shares_post ON post_shares(post_id);
CREATE INDEX IF NOT EXISTS idx_post_shares_user ON post_shares(user_id);
