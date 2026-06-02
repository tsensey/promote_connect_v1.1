-- ============================================================
-- Migration 056: Fix RLS messages — quota waiver PAID-initiated
-- CdC §2.1 : Free Trial peut répondre sans quota si PAID a initié
-- ============================================================

-- Corrige la politique INSERT sur messages
-- Ajoute le waiver initiated_by_tier pour les conversations initiées par un PAID
DROP POLICY IF EXISTS "Users can send messages in their conversations" ON public.messages;
CREATE POLICY "Users can send messages in their conversations" ON public.messages FOR INSERT
WITH CHECK (
  conversation_id IN (SELECT id FROM public.conversations WHERE participant_a = auth.uid() OR participant_b = auth.uid())
  AND (
    public.is_paid()
    OR (
      -- Free trial peut répondre sans quota si la conversation a été initiée par un PAID
      -- et qu'il n'est pas lui-même l'initiateur (CdC §2.1)
      EXISTS (
        SELECT 1 FROM public.conversations
        WHERE id = conversation_id
        AND initiated_by_tier = 'paid'
        AND initiated_by != auth.uid()
      )
    )
    OR (
      (SELECT COUNT(*) FROM public.messages WHERE sender_id = auth.uid() AND created_at >= CURRENT_DATE)
      < COALESCE((public.get_platform_config('daily_message_limit'))::text::int, 10)
      AND
      (SELECT COUNT(*) FROM public.messages WHERE sender_id = auth.uid())
      < COALESCE((public.get_platform_config('total_message_limit'))::text::int, 100)
    )
  )
);
