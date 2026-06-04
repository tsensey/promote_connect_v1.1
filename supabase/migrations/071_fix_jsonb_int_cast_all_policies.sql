-- ============================================================
-- Migration 071: Fix jsonb → int cast in all RLS policies
--
-- Using ::text::int on jsonb values adds JSON quotes when the
-- stored value is a JSON string (e.g. "2") instead of a number
-- (e.g. 2), causing "invalid input syntax for type integer".
-- Fix: use #>> '{}' which extracts JSON text without quotes.
--
-- Affects: messages, posts, produits, conversations INSERT policies.
-- ============================================================

-- 1. Messages INSERT policy (recreated from 070 with fixed cast)
DROP POLICY IF EXISTS "Users can send messages in their conversations" ON public.messages;
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

-- 2. Posts INSERT policy (from 055 — still active, uses ::text::int)
DROP POLICY IF EXISTS "Users can create posts" ON public.posts;
CREATE POLICY "Users can create posts" ON public.posts FOR INSERT
WITH CHECK (
  auth.uid() = author_id
  AND (
    public.is_paid()
    OR (
      (SELECT COUNT(*) FROM public.posts WHERE author_id = auth.uid())
      < COALESCE((public.get_platform_config('max_posts_free_trial') #>> '{}')::int, 2)
    )
  )
);

-- 3. Produits INSERT policy (from 055 — still active, uses ::text::int)
DROP POLICY IF EXISTS "Exposants can create their own products" ON public.produits;
CREATE POLICY "Exposants can create their own products" ON public.produits FOR INSERT
WITH CHECK (
  exposant_id IN (SELECT id FROM public.exposants WHERE profile_id = auth.uid())
  AND (
    public.is_paid()
    OR (
      (SELECT COUNT(*) FROM public.produits
       WHERE exposant_id IN (SELECT id FROM public.exposants WHERE profile_id = auth.uid()))
      < COALESCE((public.get_platform_config('max_vitrine_offers_free_trial') #>> '{}')::int, 2)
    )
  )
);

-- 4. Conversations INSERT policy (from 055 — still active, uses ::text::int)
DROP POLICY IF EXISTS "Users can create conversations" ON public.conversations;
CREATE POLICY "Users can create conversations" ON public.conversations FOR INSERT
WITH CHECK (
  (auth.uid() = participant_a OR auth.uid() = participant_b)
  AND (
    public.is_paid()
    OR (
      SELECT COALESCE(daily_exchange_count, 0) < COALESCE((public.get_platform_config('daily_message_limit') #>> '{}')::int, 10)
      FROM public.profiles WHERE id = auth.uid()
    )
  )
);
