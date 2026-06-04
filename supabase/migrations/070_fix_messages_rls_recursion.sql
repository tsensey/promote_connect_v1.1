-- ============================================================
-- Migration 070: Fix infinite RLS recursion on messages INSERT
-- 
-- The INSERT policy on messages queries messages via COUNT(*),
-- which triggers re-entrant RLS evaluation on the same table.
-- Fix: use SECURITY DEFINER helper functions that bypass RLS.
-- ============================================================

-- 1. Create a SECURITY DEFINER function to count user messages (daily)
-- Bypasses RLS to avoid recursion when called from INSERT policy
CREATE OR REPLACE FUNCTION public.get_user_message_count(p_user_id uuid, p_daily_only boolean DEFAULT false)
RETURNS integer
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_daily_only THEN
    RETURN (SELECT COUNT(*) FROM public.messages WHERE sender_id = p_user_id AND created_at >= CURRENT_DATE);
  ELSE
    RETURN (SELECT COUNT(*) FROM public.messages WHERE sender_id = p_user_id);
  END IF;
END;
$$;

-- 2. Drop the recursive INSERT policy
DROP POLICY IF EXISTS "Users can send messages in their conversations" ON public.messages;

-- 3. Recreate it using the SECURITY DEFINER functions instead of inline COUNT(*)
CREATE POLICY "Users can send messages in their conversations" ON public.messages FOR INSERT
WITH CHECK (
  conversation_id IN (SELECT id FROM public.conversations WHERE participant_a = auth.uid() OR participant_b = auth.uid())
  AND (
    public.is_paid()
    OR (
      EXISTS (
        SELECT 1 FROM public.conversations
        WHERE id = conversation_id
        AND initiated_by_tier = 'paid'
        AND initiated_by != auth.uid()
      )
    )
    OR (
      public.get_user_message_count(auth.uid(), true) < COALESCE((public.get_platform_config('daily_message_limit') #>> '{}')::int, 10)
      AND
      public.get_user_message_count(auth.uid(), false) < COALESCE((public.get_platform_config('total_message_limit') #>> '{}')::int, 100)
    )
  )
);

-- 4. Comment
COMMENT ON FUNCTION public.get_user_message_count IS 'Count user messages bypassing RLS (avoids recursion in INSERT policy)';
