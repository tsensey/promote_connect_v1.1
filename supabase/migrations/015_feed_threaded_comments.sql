-- Migration 015 : Commentaires imbriqués, shares_count, reposts_count sur posts

-- 1. Ajouter parent_comment_id pour les réponses aux commentaires
ALTER TABLE post_comments
  ADD COLUMN IF NOT EXISTS parent_comment_id uuid REFERENCES post_comments(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS likes_count integer DEFAULT 0;

-- 2. Ajouter shares_count et reposts_count si pas déjà présents
ALTER TABLE posts
  ADD COLUMN IF NOT EXISTS shares_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS reposts_count integer DEFAULT 0;

-- 3. Index pour les réponses
CREATE INDEX IF NOT EXISTS idx_post_comments_parent ON post_comments(parent_comment_id);

-- 4. Policy pour supprimer ses propres commentaires (si pas déjà définie)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'post_comments' AND policyname = 'Users can delete own comments'
  ) THEN
    CREATE POLICY "Users can delete own comments"
      ON post_comments FOR DELETE
      USING (auth.uid() = author_id);
  END IF;
END;
$$;
