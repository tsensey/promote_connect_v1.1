-- ============================================================
-- Migration 069: Atomic post counter increment/decrement
-- Remplace les mises à jour read-then-write côté client
-- par un RPC atomique pour éviter les race conditions
-- quand plusieurs utilisateurs interagissent simultanément.
-- ============================================================

-- RPC atomique : incrémente ou décrémente un compteur sur un post
-- p_amount > 0 → incrémente, p_amount < 0 → décrémente
-- Sécurité : column_name est validé contre une liste blanche
CREATE OR REPLACE FUNCTION public.increment_post_counter(
  p_post_id uuid,
  p_column text,
  p_amount int DEFAULT 1
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_column NOT IN ('likes_count', 'comments_count', 'shares_count', 'reposts_count') THEN
    RAISE EXCEPTION 'Column "%" is not a valid counter column', p_column;
  END IF;
  EXECUTE format(
    'UPDATE public.posts SET %I = GREATEST(0, COALESCE(%I, 0) + $1) WHERE id = $2',
    p_column, p_column
  ) USING p_amount, p_post_id;
END;
$$;
