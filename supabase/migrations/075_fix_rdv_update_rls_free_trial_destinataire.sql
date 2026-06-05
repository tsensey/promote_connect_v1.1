-- ============================================================
-- Migration 075: Fix UPDATE RLS on rendez_vous for free_trial
-- destinataire
--
-- La migration 074 a ajouté AND public.is_paid() dans le WITH
-- CHECK de la politique UPDATE. Cela empêche un destinataire
-- en free_trial d'accepter/refuser un RDV, même si le
-- demandeur est bien payant.
--
-- Fix : le destinataire peut toujours répondre (accept/refuse)
-- sans être paid. Seul le demandeur doit rester paid pour
-- modifier le RDV.
-- ============================================================

DROP POLICY IF EXISTS "Participants can update their rendez-vous" ON public.rendez_vous;
CREATE POLICY "Participants can update their rendez-vous"
  ON public.rendez_vous FOR UPDATE
  USING (auth.uid() = demandeur_id OR auth.uid() = destinataire_id)
  WITH CHECK (
    auth.uid() = demandeur_id OR auth.uid() = destinataire_id
  );
