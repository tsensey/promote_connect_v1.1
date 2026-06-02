-- ============================================================
-- Migration 055: Enforce subscription tier RLS policies
-- Active les vérifications is_paid() sur les INSERT sensibles
-- CdC §1.2, §9.1 — Defense in depth : RLS = dernier rempart
-- ============================================================

-- 1. Posts — limite de publication free_trial (max_posts_free_trial)
DROP POLICY IF EXISTS "Users can create posts" ON public.posts;
CREATE POLICY "Users can create posts" ON public.posts FOR INSERT
WITH CHECK (
  auth.uid() = author_id
  AND (
    public.is_paid()
    OR (
      (SELECT COUNT(*) FROM public.posts WHERE author_id = auth.uid())
      < COALESCE((public.get_platform_config('max_posts_free_trial'))::text::int, 2)
    )
  )
);

-- 2. Produits — limite d'offres vitrine free_trial (max_vitrine_offers_free_trial)
DROP POLICY IF EXISTS "Exposants can create their own products" ON public.produits;
CREATE POLICY "Exposants can create their own products" ON public.produits FOR INSERT
WITH CHECK (
  exposant_id IN (SELECT id FROM public.exposants WHERE profile_id = auth.uid())
  AND (
    public.is_paid()
    OR (
      (SELECT COUNT(*) FROM public.produits
       WHERE exposant_id IN (SELECT id FROM public.exposants WHERE profile_id = auth.uid()))
      < COALESCE((public.get_platform_config('max_vitrine_offers_free_trial'))::text::int, 2)
    )
  )
);

-- 3. Conversations — limite d'échanges quotidiens free_trial (daily_message_limit)
DROP POLICY IF EXISTS "Users can create conversations" ON public.conversations;
CREATE POLICY "Users can create conversations" ON public.conversations FOR INSERT
WITH CHECK (
  (auth.uid() = participant_a OR auth.uid() = participant_b)
  AND (
    public.is_paid()
    OR (
      SELECT COALESCE(daily_exchange_count, 0) < COALESCE((public.get_platform_config('daily_message_limit'))::text::int, 10)
      FROM public.profiles WHERE id = auth.uid()
    )
  )
);

-- 4. Messages — double limite free_trial (daily_message_limit + total_message_limit)
DROP POLICY IF EXISTS "Users can send messages in their conversations" ON public.messages;
CREATE POLICY "Users can send messages in their conversations" ON public.messages FOR INSERT
WITH CHECK (
  conversation_id IN (SELECT id FROM public.conversations WHERE participant_a = auth.uid() OR participant_b = auth.uid())
  AND (
    public.is_paid()
    OR (
      (SELECT COUNT(*) FROM public.messages WHERE sender_id = auth.uid() AND created_at >= CURRENT_DATE)
      < COALESCE((public.get_platform_config('daily_message_limit'))::text::int, 10)
      AND
      (SELECT COUNT(*) FROM public.messages WHERE sender_id = auth.uid())
      < COALESCE((public.get_platform_config('total_message_limit'))::text::int, 100)
    )
  )
);

-- 5. Admin ALL policies pour les tables qui en manquent
DROP POLICY IF EXISTS "Admins can manage all conversations" ON public.conversations;
CREATE POLICY "Admins can manage all conversations" ON public.conversations FOR ALL
USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can manage all messages" ON public.messages;
CREATE POLICY "Admins can manage all messages" ON public.messages FOR ALL
USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can manage all produits" ON public.produits;
CREATE POLICY "Admins can manage all produits" ON public.produits FOR ALL
USING (public.is_admin());
