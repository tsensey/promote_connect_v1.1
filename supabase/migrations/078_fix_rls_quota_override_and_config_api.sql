-- ============================================================
-- Migration 078: Fix RLS policies to respect per-user quota overrides
-- + Add admin API route for platform_config (no RLS bypass)
--
-- Problems:
-- 1. Posts/produits INSERT policies always use platform_config default,
--    ignoring quota_override_posts / quota_override_vitrine on profiles.
--    Application-layer checkPostQuota respects the override, but RLS
--    rejects inserts that the app allowed → "new row violates RLS policy"
--
-- 2. Messages INSERT policy also ignores quota_override_messages.
--
-- 3. Admin config page uses browser client (subject to RLS), so saves
--    may silently fail if the admin user session lacks proper role.
-- ============================================================

-- 1. Posts INSERT policy — respect quota_override_posts
DROP POLICY IF EXISTS "Users can create posts" ON public.posts;
CREATE POLICY "Users can create posts" ON public.posts FOR INSERT
WITH CHECK (
  auth.uid() = author_id
  AND (
    public.is_paid()
    OR (
      (SELECT COUNT(*) FROM public.posts WHERE author_id = auth.uid())
      < COALESCE(
          (SELECT quota_override_posts FROM public.profiles WHERE id = auth.uid()),
          (public.get_platform_config('max_posts_free_trial') #>> '{}')::int,
          2
        )
    )
  )
);

-- 2. Produits INSERT policy — respect quota_override_vitrine
DROP POLICY IF EXISTS "Exposants can create their own products" ON public.produits;
CREATE POLICY "Exposants can create their own products" ON public.produits FOR INSERT
WITH CHECK (
  exposant_id IN (SELECT id FROM public.exposants WHERE profile_id = auth.uid())
  AND (
    public.is_paid()
    OR (
      (SELECT COUNT(*) FROM public.produits
       WHERE exposant_id IN (SELECT id FROM public.exposants WHERE profile_id = auth.uid()))
      < COALESCE(
          (SELECT quota_override_vitrine FROM public.profiles WHERE id = auth.uid()),
          (public.get_platform_config('max_vitrine_offers_free_trial') #>> '{}')::int,
          2
        )
    )
  )
);

-- 3. Messages INSERT policy — respect quota_override_messages (daily + total)
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
      public.get_user_message_count(auth.uid(), true) < COALESCE(
          (SELECT quota_override_messages FROM public.profiles WHERE id = auth.uid()),
          (public.get_platform_config('daily_message_limit') #>> '{}')::int,
          10
        )
      AND
      public.get_user_message_count(auth.uid(), false) < COALESCE(
          (SELECT quota_override_messages FROM public.profiles WHERE id = auth.uid()),
          (public.get_platform_config('total_message_limit') #>> '{}')::int,
          100
        )
    )
  )
);

-- 4. Conversations INSERT policy — respect quota_override_messages
DROP POLICY IF EXISTS "Users can create conversations" ON public.conversations;
CREATE POLICY "Users can create conversations" ON public.conversations FOR INSERT
WITH CHECK (
  (auth.uid() = participant_a OR auth.uid() = participant_b)
  AND (
    public.is_paid()
    OR (
      SELECT COALESCE(daily_exchange_count, 0) < COALESCE(
        quota_override_messages,
        (public.get_platform_config('daily_message_limit') #>> '{}')::int,
        10
      )
      FROM public.profiles WHERE id = auth.uid()
    )
  )
);
