-- ============================================================
-- Migration 059: RdV B2B réservé aux abonnés PAID
-- CdC §9.1 — Un free trial ne peut pas créer de rendez-vous
-- (Les RDV sont une fonctionnalité premium)
-- ============================================================

DROP POLICY IF EXISTS "Users can create rendez-vous" ON public.rendez_vous;
CREATE POLICY "Users can create rendez-vous" ON public.rendez_vous FOR INSERT
WITH CHECK (
  auth.uid() = demandeur_id
  AND public.is_paid()
);
